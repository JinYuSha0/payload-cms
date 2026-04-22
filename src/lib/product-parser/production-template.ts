import { parseFirstTableFromDocx } from '@/lib/word/docx'

import type { ParsedProductDraft, RichTextContent } from './types'

const labelAliases: Record<string, string[]> = {
  categoryName: ['分类', 'category'],
  content: ['内容', '详情', 'description', 'content'],
  intro: ['简介', '介绍', 'summary', 'intro'],
  keywords: ['关键字', '关键词', 'key words', 'keywords'],
  model: ['型号', 'model'],
  name: ['名称', '产品名称', 'name', 'title'],
  picture: ['主图', '图片', 'picture', 'image'],
}

type ExtractedWordBlock = {
  start: number
  tagName: string
  xml: string
}

type InlineNode = {
  [k: string]: unknown
  type: string
  version: number
}

type BlockNode = {
  [k: string]: unknown
  children?: unknown[]
  type: string
  version: number
}

const normalizeLabel = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[：:]/g, '')
    .replace(/\s+/g, '')

const matchFieldKey = (label: string): keyof typeof labelAliases | null => {
  const normalized = normalizeLabel(label)

  for (const [fieldKey, aliases] of Object.entries(labelAliases)) {
    const matched = aliases.some((alias) => normalizeLabel(alias) === normalized)
    if (matched) {
      return fieldKey as keyof typeof labelAliases
    }
  }

  return null
}

const parseKeywords = (value: string): string[] =>
  value
    .split(/[,，;；\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

export const DOCX_IMAGE_TOKEN_PREFIX = '[[DOCX_IMAGE:'
export const DOCX_IMAGE_TOKEN_SUFFIX = ']]'

export const buildDocxImageToken = (relationshipID: string): string =>
  `${DOCX_IMAGE_TOKEN_PREFIX}${relationshipID}${DOCX_IMAGE_TOKEN_SUFFIX}`

const extractImageRelationshipIDsFromXML = (xml: string): string[] => {
  const ids: string[] = []
  const seen = new Set<string>()

  for (const match of xml.matchAll(/r:embed="([^"]+)"/g)) {
    const id = match[1]?.trim()
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    ids.push(id)
  }

  return ids
}

const extractRunImageRelationshipIDs = (runXML: string): string[] => {
  const ids: string[] = []
  const seen = new Set<string>()

  for (const match of runXML.matchAll(/r:embed="([^"]+)"/g)) {
    const id = match[1]?.trim()
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    ids.push(id)
  }

  return ids
}

const decodeXML = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\u00a0/g, ' ')

const createTextNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  text,
  type: 'text' as const,
  version: 1,
})

const createElementBase = () => ({
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

const createParagraphNode = (children: InlineNode[]) => ({
  ...createElementBase(),
  children,
  type: 'paragraph' as const,
})

const createHeadingNode = (tag: 'h1' | 'h2' | 'h3', children: InlineNode[]) => ({
  ...createElementBase(),
  children,
  tag,
  type: 'heading' as const,
})

const createLinkNode = (url: string, children: Array<ReturnType<typeof createTextNode>>) => ({
  ...createElementBase(),
  children,
  fields: {
    linkType: 'custom' as const,
    newTab: false,
    url,
  },
  type: 'link' as const,
})

const createTableCellNode = (children: BlockNode[], rowIndex: number, colSpan?: number) => ({
  ...createElementBase(),
  children,
  colSpan,
  headerState: rowIndex === 0 ? 2 : 0,
  type: 'tablecell' as const,
})

const createTableRowNode = (children: Array<ReturnType<typeof createTableCellNode>>) => ({
  ...createElementBase(),
  children,
  type: 'tablerow' as const,
})

const createTableNode = (children: Array<ReturnType<typeof createTableRowNode>>) => ({
  ...createElementBase(),
  children,
  type: 'table' as const,
})

const isTagEnabled = (xml: string, tagName: string): boolean => {
  const tag = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?\\/?\\s*>`, 'i'))?.[0]
  if (!tag) {
    return false
  }

  const val = tag.match(/\bw:val="([^"]+)"/i)?.[1]?.toLowerCase()
  if (!val) {
    return true
  }

  return val !== '0' && val !== 'false' && val !== 'none'
}

const textFormatBits = (runXML: string): number => {
  let format = 0
  if (isTagEnabled(runXML, 'w:b')) format |= 1
  if (isTagEnabled(runXML, 'w:i')) format |= 2
  if (isTagEnabled(runXML, 'w:strike')) format |= 4
  if (isTagEnabled(runXML, 'w:u')) format |= 8
  return format
}

const extractRunText = (runXML: string): string => {
  const raw = runXML
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')

  return decodeXML(raw)
}

const extractInstructionText = (runXML: string): string => {
  const parts = [...runXML.matchAll(/<w:instrText[^>]*>([\s\S]*?)<\/w:instrText>/g)].map((match) => decodeXML(match[1]))
  return parts.join('')
}

const getFieldCharType = (runXML: string): 'begin' | 'separate' | 'end' | null => {
  const type = runXML.match(/<w:fldChar[^>]*w:fldCharType="([^"]+)"/i)?.[1]
  if (type === 'begin' || type === 'separate' || type === 'end') {
    return type
  }

  return null
}

const parseHyperlinkURLFromInstruction = (instruction: string): string | null => {
  const normalized = instruction.replace(/\s+/g, ' ').trim()
  const quoted = normalized.match(/HYPERLINK\s+"([^"]+)"/i)?.[1]
  if (quoted) return quoted

  const plain = normalized.match(/HYPERLINK\s+([^\s"]+)/i)?.[1]
  return plain || null
}

const isMeaningfulText = (text: string): boolean => text.replace(/\s+/g, '').length > 0

const extractTopLevelWordBlocks = (xml: string, targetTagNames: string[]): ExtractedWordBlock[] => {
  const targets = new Set(targetTagNames)
  const blocks: ExtractedWordBlock[] = []
  const stack: string[] = []
  const tagPattern = /<\/?w:[A-Za-z0-9]+(?:\s[^<>]*?)?\/?\s*>/g

  let currentCapture: null | { start: number; tagName: string } = null

  for (const match of xml.matchAll(tagPattern)) {
    const token = match[0]
    const start = match.index ?? 0
    const tagName = token.match(/^<\/?(w:[A-Za-z0-9]+)/)?.[1]

    if (!tagName) {
      continue
    }

    const isClosing = token.startsWith('</')
    const isSelfClosing = token.endsWith('/>')

    if (!isClosing) {
      if (!currentCapture && targets.has(tagName) && stack.length === 1) {
        currentCapture = { start, tagName }
      }

      if (!isSelfClosing) {
        stack.push(tagName)
      }

      if (isSelfClosing && currentCapture && currentCapture.tagName === tagName && stack.length === 1) {
        blocks.push({
          start: currentCapture.start,
          tagName,
          xml: xml.slice(currentCapture.start, start + token.length),
        })
        currentCapture = null
      }

      continue
    }

    if (stack.length > 0) {
      const top = stack[stack.length - 1]
      if (top === tagName) {
        stack.pop()
      } else {
        const index = stack.lastIndexOf(tagName)
        if (index !== -1) {
          stack.splice(index, 1)
        }
      }
    }

    if (currentCapture && currentCapture.tagName === tagName && stack.length === 1) {
      blocks.push({
        start: currentCapture.start,
        tagName,
        xml: xml.slice(currentCapture.start, start + token.length),
      })
      currentCapture = null
    }
  }

  return blocks.sort((a, b) => a.start - b.start)
}

const getParagraphMaxFontSizeHalfPoint = (paragraphXML: string): number => {
  const sizes = [...paragraphXML.matchAll(/<w:sz[^>]*w:val="(\d+)"/g)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value))

  return sizes.length > 0 ? Math.max(...sizes) : 0
}

const headingTagFromParagraph = (paragraphXML: string): 'h1' | 'h2' | 'h3' | null => {
  const style = paragraphXML.match(/<w:pStyle[^>]*w:val="([^"]+)"/i)?.[1]?.toLowerCase()
  if (style === 'heading1') return 'h1'
  if (style === 'heading2') return 'h2'
  if (style === 'heading3') return 'h3'

  const maxSize = getParagraphMaxFontSizeHalfPoint(paragraphXML)
  if (maxSize >= 64) return 'h1'
  if (maxSize >= 52) return 'h2'
  if (maxSize >= 44) return 'h3'

  return null
}

const textNodeFromRun = (runXML: string): ReturnType<typeof createTextNode> | null => {
  const text = extractRunText(runXML)
  if (!isMeaningfulText(text)) {
    return null
  }

  return {
    ...createTextNode(text),
    format: textFormatBits(runXML),
  }
}

const parseRunsToTextNodes = (runsXML: string[]): Array<ReturnType<typeof createTextNode>> =>
  runsXML.map((runXML) => textNodeFromRun(runXML)).filter(Boolean) as Array<ReturnType<typeof createTextNode>>

const inlineNodesFromHyperlinkBlock = (
  hyperlinkXML: string,
  hyperlinksByRelationshipID: Record<string, string>,
): InlineNode[] => {
  const relationshipID = hyperlinkXML.match(/\br:id="([^"]+)"/)?.[1]
  const url = relationshipID ? hyperlinksByRelationshipID[relationshipID] : null
  const runs = extractTopLevelWordBlocks(hyperlinkXML, ['w:r']).map((block) => block.xml)
  const textNodes = parseRunsToTextNodes(runs)

  if (textNodes.length === 0) {
    return []
  }

  if (!url) {
    return textNodes
  }

  return [createLinkNode(url, textNodes)]
}

const parseParagraphInlineNodes = (
  paragraphXML: string,
  hyperlinksByRelationshipID: Record<string, string>,
): InlineNode[] => {
  const blocks = extractTopLevelWordBlocks(paragraphXML, ['w:r', 'w:hyperlink'])

  let fieldInstruction = ''
  let activeFieldLinkURL: null | string = null
  let inField = false
  let fieldTextNodes: Array<ReturnType<typeof createTextNode>> = []

  const flushField = (inlineNodes: InlineNode[]) => {
    if (activeFieldLinkURL && fieldTextNodes.length > 0) {
      inlineNodes.push(createLinkNode(activeFieldLinkURL, fieldTextNodes))
    } else if (fieldTextNodes.length > 0) {
      inlineNodes.push(...fieldTextNodes)
    }

    fieldInstruction = ''
    activeFieldLinkURL = null
    inField = false
    fieldTextNodes = []
  }

  const inlineNodes: InlineNode[] = []

  for (const block of blocks) {
    if (block.tagName === 'w:hyperlink') {
      if (inField) {
        flushField(inlineNodes)
      }
      inlineNodes.push(...inlineNodesFromHyperlinkBlock(block.xml, hyperlinksByRelationshipID))
      continue
    }

    const runXML = block.xml
    const fieldCharType = getFieldCharType(runXML)
    const instructionText = extractInstructionText(runXML)

    if (fieldCharType === 'begin') {
      if (inField) {
        flushField(inlineNodes)
      }
      inField = true
      fieldInstruction = ''
      activeFieldLinkURL = null
      fieldTextNodes = []
      continue
    }

    if (inField && instructionText) {
      fieldInstruction += instructionText
    }

    if (fieldCharType === 'separate' && inField) {
      activeFieldLinkURL = parseHyperlinkURLFromInstruction(fieldInstruction)
      continue
    }

    const runImageRelationshipIDs = extractRunImageRelationshipIDs(runXML)
    if (runImageRelationshipIDs.length > 0) {
      const imageTokenNodes = runImageRelationshipIDs.map((relationshipID) =>
        createTextNode(buildDocxImageToken(relationshipID)),
      )

      if (inField) {
        fieldTextNodes.push(...imageTokenNodes)
      } else {
        inlineNodes.push(...imageTokenNodes)
      }
    }

    const textNode = textNodeFromRun(runXML)
    if (textNode) {
      if (inField) {
        fieldTextNodes.push(textNode)
      } else {
        inlineNodes.push(textNode)
      }
    }

    if (fieldCharType === 'end' && inField) {
      flushField(inlineNodes)
    }
  }

  if (inField) {
    flushField(inlineNodes)
  }

  return inlineNodes
}

const parseParagraphNode = (
  paragraphXML: string,
  hyperlinksByRelationshipID: Record<string, string>,
): BlockNode | null => {
  const inlineNodes = parseParagraphInlineNodes(paragraphXML, hyperlinksByRelationshipID)
  if (inlineNodes.length === 0) {
    return null
  }

  const headingTag = headingTagFromParagraph(paragraphXML)
  if (headingTag) {
    return createHeadingNode(headingTag, inlineNodes)
  }

  return createParagraphNode(inlineNodes)
}

const parseCellBlocks = (
  cellXML: string,
  hyperlinksByRelationshipID: Record<string, string>,
  allowTable: boolean,
): BlockNode[] => {
  const blocks = extractTopLevelWordBlocks(cellXML, allowTable ? ['w:p', 'w:tbl'] : ['w:p'])
  const children: BlockNode[] = []

  for (const block of blocks) {
    if (block.tagName === 'w:p') {
      const node = parseParagraphNode(block.xml, hyperlinksByRelationshipID)
      if (node) {
        children.push(node)
      }
      continue
    }

    if (block.tagName === 'w:tbl' && allowTable) {
      children.push(parseTableNode(block.xml, hyperlinksByRelationshipID))
    }
  }

  if (children.length === 0) {
    children.push(createParagraphNode([createTextNode('')]))
  }

  return children
}

const parseTableNode = (tableXML: string, hyperlinksByRelationshipID: Record<string, string>) => {
  const rowBlocks = extractTopLevelWordBlocks(tableXML, ['w:tr'])
  const rows = rowBlocks.map((rowBlock, rowIndex) => {
    const cellBlocks = extractTopLevelWordBlocks(rowBlock.xml, ['w:tc'])
    const cells = cellBlocks.map((cellBlock) => {
      const colSpan = Number.parseInt(cellBlock.xml.match(/<w:gridSpan[^>]*w:val="(\d+)"/)?.[1] || '1', 10)

      return createTableCellNode(
        parseCellBlocks(cellBlock.xml, hyperlinksByRelationshipID, false),
        rowIndex,
        Number.isFinite(colSpan) && colSpan > 1 ? colSpan : undefined,
      )
    })

    return createTableRowNode(cells)
  })

  return createTableNode(rows)
}

const parseDocxRichTextFromCellXML = (
  cellXML: string,
  hyperlinksByRelationshipID: Record<string, string>,
): RichTextContent => {
  const children = parseCellBlocks(cellXML, hyperlinksByRelationshipID, true)

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

const textToParagraphNodes = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => createParagraphNode([createTextNode(line)]))

const buildProductionContentRichText = (input: {
  content: string
  intro: string
  keywords: string
  model: string
}): RichTextContent => {
  const children: Array<ReturnType<typeof createParagraphNode> | ReturnType<typeof createHeadingNode>> = []

  const model = input.model.trim()
  const keywords = input.keywords.trim()
  const intro = input.intro.trim()
  const content = input.content.trim()

  if (model) {
    children.push(createParagraphNode([createTextNode(`型号：${model}`)]))
  }

  if (keywords) {
    children.push(createParagraphNode([createTextNode(`关键字：${keywords}`)]))
  }

  if (intro) {
    children.push(createHeadingNode('h2', [createTextNode('简介')]))
    children.push(...textToParagraphNodes(intro))
  }

  if (content) {
    children.push(createHeadingNode('h2', [createTextNode('内容')]))
    children.push(...textToParagraphNodes(content))
  }

  if (children.length === 0) {
    children.push(createParagraphNode([createTextNode('')]))
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

export const parseProductionTemplateDocx = (buffer: ArrayBuffer): ParsedProductDraft => {
  const parsed = parseFirstTableFromDocx(buffer)

  const rawFieldMap: Record<string, string> = {}
  const mainImageRelationshipIDs = new Set<string>()
  let contentImageRelationshipIDs: string[] = []
  let contentCellXML = ''

  for (const row of parsed.rows) {
    if (row.cells.length < 2) {
      continue
    }

    const label = row.cells[0].text.trim()
    if (!label) {
      continue
    }

    const value = row.cells[1].text.trim()
    rawFieldMap[label] = value

    const fieldKey = matchFieldKey(label)
    if (fieldKey === 'picture') {
      for (const relationshipID of row.cells[1].imageRelationshipIDs) {
        mainImageRelationshipIDs.add(relationshipID)
      }
    }

    if (fieldKey === 'content') {
      contentCellXML = row.cells[1].xml
      contentImageRelationshipIDs = extractImageRelationshipIDsFromXML(contentCellXML)
    }
  }

  const content = rawFieldMap['内容'] || rawFieldMap['详情'] || ''
  const intro = rawFieldMap['简介'] || rawFieldMap['介绍'] || ''
  const model = rawFieldMap['型号'] || ''
  const keywords = parseKeywords(rawFieldMap['关键字'] || rawFieldMap['关键词'] || '')

  const draft: ParsedProductDraft = {
    categoryName: rawFieldMap['分类'] || '',
    content,
    contentImages: contentImageRelationshipIDs
      .map((relationshipID) => parsed.imagesByRelationshipID[relationshipID])
      .filter(Boolean)
      .map((image) => ({
        bytes: image.bytes,
        fileName: image.fileName,
        mimeType: image.mimeType,
        relationshipID: image.relationshipID,
      })),
    contentRichText: contentCellXML
      ? parseDocxRichTextFromCellXML(contentCellXML, parsed.hyperlinksByRelationshipID)
      : buildProductionContentRichText({
          content,
          intro,
          keywords: keywords.join(', '),
          model,
        }),
    intro,
    keywords,
    mainImages: [...mainImageRelationshipIDs]
      .map((relationshipID) => parsed.imagesByRelationshipID[relationshipID])
      .filter(Boolean)
      .map((image) => ({
        bytes: image.bytes,
        fileName: image.fileName,
        mimeType: image.mimeType,
        relationshipID: image.relationshipID,
      })),
    model,
    name: rawFieldMap['名称'] || rawFieldMap['产品名称'] || '',
    rawFieldMap,
    warnings: [],
  }

  if (!draft.name) {
    draft.warnings.push('模板中未解析到“名称”')
  }

  if (!draft.content && !draft.intro) {
    draft.warnings.push('模板中未解析到“简介/内容”')
  }

  if (draft.mainImages.length === 0) {
    draft.warnings.push('模板中未解析到“主图”')
  }

  return draft
}
