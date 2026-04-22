import { strFromU8, unzipSync } from 'fflate'

export interface DocxImageAsset {
  bytes: Uint8Array
  fileName: string
  mimeType: string
  relationshipID: string
}

export interface DocxTableCell {
  imageRelationshipIDs: string[]
  text: string
  xml: string
}

export interface DocxTableRow {
  cells: DocxTableCell[]
}

export interface ParsedDocxTable {
  hyperlinksByRelationshipID: Record<string, string>
  imagesByRelationshipID: Record<string, DocxImageAsset>
  rows: DocxTableRow[]
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractTopLevelTagBlocks = (xml: string, tagName: string): string[] => {
  const escapedTagName = escapeRegExp(tagName)
  const tagPattern = new RegExp(`<\\/?${escapedTagName}\\b[^>]*>`, 'g')

  const blocks: string[] = []
  let depth = 0
  let start = -1

  for (const match of xml.matchAll(tagPattern)) {
    const token = match[0]
    const index = match.index ?? -1
    const isClosingTag = token.startsWith('</')
    const isSelfClosingTag = token.endsWith('/>')

    if (!isClosingTag) {
      if (depth === 0) {
        start = index
      }

      if (!isSelfClosingTag) {
        depth += 1
      } else if (depth === 0 && start !== -1) {
        blocks.push(xml.slice(start, index + token.length))
        start = -1
      }

      continue
    }

    if (depth > 0) {
      depth -= 1
    }

    if (depth === 0 && start !== -1) {
      blocks.push(xml.slice(start, index + token.length))
      start = -1
    }
  }

  return blocks
}

const decodeXML = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const extractCellText = (cellXML: string): string => {
  const raw = cellXML
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')

  const lines = decodeXML(raw)
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)

  return lines.join('\n')
}

const extractCellImageRelationshipIDs = (cellXML: string): string[] => {
  const ids = new Set<string>()

  for (const match of cellXML.matchAll(/r:embed="([^"]+)"/g)) {
    const id = match[1]?.trim()
    if (id) {
      ids.add(id)
    }
  }

  return [...ids]
}

const normalizeDocxPath = (target: string): string => {
  if (target.startsWith('/')) {
    return target.slice(1)
  }

  const normalized = target.replace(/^\.\//, '')
  return normalized.startsWith('word/') ? normalized : `word/${normalized}`
}

const guessMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'bmp':
      return 'image/bmp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

const parseRelationships = (
  relationshipsXML: string,
): {
  hyperlinkTargetsByRelationshipID: Record<string, string>
  imageTargetsByRelationshipID: Record<string, string>
} => {
  const hyperlinkTargetsByRelationshipID: Record<string, string> = {}
  const imageTargetsByRelationshipID: Record<string, string> = {}

  for (const match of relationshipsXML.matchAll(/<Relationship\b[^>]*>/g)) {
    const relationshipTag = match[0]
    const id = relationshipTag.match(/\bId="([^"]+)"/)?.[1]
    const type = relationshipTag.match(/\bType="([^"]+)"/)?.[1]
    const target = relationshipTag.match(/\bTarget="([^"]+)"/)?.[1]

    if (!id || !target || !type) {
      continue
    }

    if (type.includes('/image')) {
      imageTargetsByRelationshipID[id] = normalizeDocxPath(target)
      continue
    }

    if (type.includes('/hyperlink')) {
      hyperlinkTargetsByRelationshipID[id] = target
    }
  }

  return {
    hyperlinkTargetsByRelationshipID,
    imageTargetsByRelationshipID,
  }
}

export const parseFirstTableFromDocx = (buffer: ArrayBuffer): ParsedDocxTable => {
  const zipped = unzipSync(new Uint8Array(buffer))
  const documentXMLBytes = zipped['word/document.xml']
  const relationshipsXMLBytes = zipped['word/_rels/document.xml.rels']

  if (!documentXMLBytes || !relationshipsXMLBytes) {
    throw new Error('DOCX 缺少必要的 XML 文件')
  }

  const documentXML = strFromU8(documentXMLBytes)
  const relationshipsXML = strFromU8(relationshipsXMLBytes)

  const firstTable = extractTopLevelTagBlocks(documentXML, 'w:tbl')[0]
  if (!firstTable) {
    return {
      hyperlinksByRelationshipID: {},
      imagesByRelationshipID: {},
      rows: [],
    }
  }

  const rows = extractTopLevelTagBlocks(firstTable, 'w:tr').map((rowXML) => {
    const cells = extractTopLevelTagBlocks(rowXML, 'w:tc').map((cellXML) => ({
      imageRelationshipIDs: extractCellImageRelationshipIDs(cellXML),
      text: extractCellText(cellXML),
      xml: cellXML,
    }))

    return { cells }
  })

  const { hyperlinkTargetsByRelationshipID, imageTargetsByRelationshipID } = parseRelationships(relationshipsXML)
  const imagesByRelationshipID: Record<string, DocxImageAsset> = {}

  for (const [relationshipID, path] of Object.entries(imageTargetsByRelationshipID)) {
    const bytes = zipped[path]
    if (!bytes) {
      continue
    }

    const fileName = path.split('/').pop() || `${relationshipID}.bin`

    imagesByRelationshipID[relationshipID] = {
      bytes,
      fileName,
      mimeType: guessMimeType(fileName),
      relationshipID,
    }
  }

  return {
    hyperlinksByRelationshipID: hyperlinkTargetsByRelationshipID,
    imagesByRelationshipID,
    rows,
  }
}
