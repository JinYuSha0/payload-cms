'use client'

import { useCallback, useMemo, useState } from 'react'
import { useField, useFormFields, useLocale } from '@payloadcms/ui'

import {
  DOCX_IMAGE_TOKEN_PREFIX,
  DOCX_IMAGE_TOKEN_SUFFIX,
  parseProductionTemplateDocx,
} from '@/lib/product-parser/production-template'

import type { ParsedTemplateImage, RichTextContent } from '@/lib/product-parser/types'

type ParsedCategory = {
  id?: number | string
}

type UploadedMediaDoc = {
  fileName: string
  id: number | string
  relationshipID: string
}

const resolveFieldPath = (
  formFieldState: Record<string, unknown>,
  basePath: string,
  localeCode?: string,
): string => {
  const keys = Object.keys(formFieldState || {})

  if (localeCode && keys.includes(`${basePath}.${localeCode}`)) {
    return `${basePath}.${localeCode}`
  }

  if (keys.includes(basePath)) {
    return basePath
  }

  const localizedPath = keys.find(
    (key) => key.startsWith(`${basePath}.`) && key.split('.').length === 2,
  )

  return localizedPath || basePath
}

const decodeResponseJSON = async (response: Response): Promise<Record<string, unknown>> => {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

const getCreatedDocumentID = (payload: Record<string, unknown>): number | string | null => {
  const doc = payload.doc as { id?: number | string } | undefined
  if (typeof doc?.id === 'number' || typeof doc?.id === 'string') {
    return doc.id
  }

  if (typeof payload.id === 'number' || typeof payload.id === 'string') {
    return payload.id
  }

  return null
}

const uploadImagesToMedia = async (images: ParsedTemplateImage[]): Promise<UploadedMediaDoc[]> => {
  const uploaded: UploadedMediaDoc[] = []

  for (const image of images) {
    const formData = new FormData()
    const file = new File([new Uint8Array(image.bytes)], image.fileName, {
      type: image.mimeType || 'application/octet-stream',
    })

    formData.append('file', file)
    formData.append('alt', image.fileName.replace(/\.[^.]+$/, ''))

    const response = await fetch('/api/media', {
      body: formData,
      credentials: 'include',
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`图片上传失败: ${image.fileName} (${response.status})`)
    }

    const json = await decodeResponseJSON(response)
    const id = getCreatedDocumentID(json)
    if (id == null) {
      throw new Error(`图片上传失败: ${image.fileName} (未返回媒体 ID)`)
    }

    uploaded.push({
      fileName: image.fileName,
      id,
      relationshipID: image.relationshipID,
    })
  }

  return uploaded
}

const getLeafCategoryIDByName = async (
  categoryName: string,
  localeCode?: string,
): Promise<number | string | null> => {
  const trimmed = categoryName.trim()
  if (!trimmed) {
    return null
  }

  const query = new URLSearchParams({
    depth: '0',
    draft: 'true',
    limit: '20',
  })

  if (localeCode) {
    query.set('locale', localeCode)
  }

  query.set('where[name][equals]', trimmed)

  const response = await fetch(`/api/categories?${query.toString()}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    return null
  }

  const json = (await response.json()) as { docs?: ParsedCategory[] }
  const docs = Array.isArray(json.docs) ? json.docs : []
  if (docs.length === 0) {
    return null
  }

  for (const category of docs) {
    const id = category.id
    if (id == null) {
      continue
    }

    const childQuery = new URLSearchParams({
      depth: '0',
      draft: 'true',
      limit: '1',
    })
    childQuery.set('where[category][equals]', String(id))

    const childResponse = await fetch(`/api/categories?${childQuery.toString()}`, {
      credentials: 'include',
    })

    if (!childResponse.ok) {
      continue
    }

    const childJSON = (await childResponse.json()) as { docs?: unknown[] }
    const childDocs = Array.isArray(childJSON.docs) ? childJSON.docs : []

    if (childDocs.length === 0) {
      return id
    }
  }

  return null
}

const cloneRichText = (value: RichTextContent): RichTextContent => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as RichTextContent
}

const cloneJSON = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const isRichTextValue = (value: unknown): value is RichTextContent => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybe = value as { root?: { children?: unknown[] } }
  return Boolean(maybe.root && Array.isArray(maybe.root.children))
}

const isLocalizedObjectValue = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  if (isRichTextValue(value)) {
    return false
  }

  return true
}

const DOCX_IMAGE_TOKEN_PATTERN = new RegExp(
  `${DOCX_IMAGE_TOKEN_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\]]+)${DOCX_IMAGE_TOKEN_SUFFIX.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )}`,
  'g',
)

const DOCX_IMAGE_GRID_MARKER = 'var(--docx-image-grid-marker, transparent)'

const createUploadNode = (upload: UploadedMediaDoc) => ({
  fields: {
    alt: upload.fileName.replace(/\.[^.]+$/, ''),
  },
  format: '',
  relationTo: 'media',
  type: 'upload',
  value: upload.id,
  version: 2,
})

const createTableBase = () => ({
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

const createSideBySideUploadTableNode = (uploads: UploadedMediaDoc[]) => ({
  ...createTableBase(),
  children: [
    {
      ...createTableBase(),
      children: uploads.map((upload) => ({
        ...createTableBase(),
        backgroundColor: DOCX_IMAGE_GRID_MARKER,
        children: [createUploadNode(upload)],
        headerState: 0,
        type: 'tablecell' as const,
      })),
      type: 'tablerow' as const,
    },
  ],
  type: 'table' as const,
})

type InlineImageSegment =
  | { kind: 'inline'; node: unknown }
  | { kind: 'upload'; upload: UploadedMediaDoc }

const splitInlineNodesByImageTokens = (
  nodes: unknown[],
  uploadsByRelationshipID: Map<string, UploadedMediaDoc>,
): InlineImageSegment[] => {
  const segments: InlineImageSegment[] = []

  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      segments.push({ kind: 'inline', node })
      continue
    }

    const current = node as { text?: string; type?: string }
    if (current.type !== 'text' || typeof current.text !== 'string') {
      segments.push({ kind: 'inline', node: current })
      continue
    }

    const matches = [...current.text.matchAll(DOCX_IMAGE_TOKEN_PATTERN)]
    if (matches.length === 0) {
      segments.push({ kind: 'inline', node: current })
      continue
    }

    let cursor = 0
    for (const match of matches) {
      const start = match.index ?? 0
      if (start > cursor) {
        segments.push({
          kind: 'inline',
          node: {
            ...current,
            text: current.text.slice(cursor, start),
          },
        })
      }

      const relationshipID = match[1]?.trim()
      if (relationshipID) {
        const upload = uploadsByRelationshipID.get(relationshipID)
        if (upload) {
          segments.push({ kind: 'upload', upload })
        }
      }

      cursor = start + match[0].length
    }

    if (cursor < current.text.length) {
      segments.push({
        kind: 'inline',
        node: {
          ...current,
          text: current.text.slice(cursor),
        },
      })
    }
  }

  return segments
}

const buildBlocksFromInlineSegments = (
  blockNode: { children?: unknown[]; type?: string },
  segments: InlineImageSegment[],
  allowSideBySide: boolean,
): unknown[] => {
  const nextBlocks: unknown[] = []
  let pendingInlineChildren: unknown[] = []

  const flushInlineBlock = () => {
    if (pendingInlineChildren.length === 0) {
      return
    }

    nextBlocks.push({
      ...blockNode,
      children: pendingInlineChildren,
    })
    pendingInlineChildren = []
  }

  let index = 0
  while (index < segments.length) {
    const segment = segments[index]
    if (segment.kind === 'inline') {
      pendingInlineChildren.push(segment.node)
      index += 1
      continue
    }

    flushInlineBlock()

    const uploadGroup: UploadedMediaDoc[] = []
    while (index < segments.length && segments[index].kind === 'upload') {
      uploadGroup.push((segments[index] as { kind: 'upload'; upload: UploadedMediaDoc }).upload)
      index += 1
    }

    if (uploadGroup.length === 0) {
      continue
    }

    if (allowSideBySide && uploadGroup.length > 1) {
      nextBlocks.push(createSideBySideUploadTableNode(uploadGroup))
      continue
    }

    nextBlocks.push(...uploadGroup.map((upload) => createUploadNode(upload)))
  }

  flushInlineBlock()

  return nextBlocks
}

const injectUploadNodesIntoBlocks = (
  blocks: unknown[],
  uploadsByRelationshipID: Map<string, UploadedMediaDoc>,
  allowSideBySide: boolean,
): unknown[] => {
  const result: unknown[] = []

  for (const block of blocks) {
    if (!block || typeof block !== 'object') {
      result.push(block)
      continue
    }

    const node = block as { children?: unknown[]; type?: string }

    if (node.type === 'table' && Array.isArray(node.children)) {
      const nextRows = node.children.map((row) => {
        if (!row || typeof row !== 'object') return row
        const rowNode = row as { children?: unknown[] }
        const nextCells = (rowNode.children || []).map((cell) => {
          if (!cell || typeof cell !== 'object') return cell
          const cellNode = cell as { children?: unknown[] }
          const nextCellChildren = injectUploadNodesIntoBlocks(
            cellNode.children || [],
            uploadsByRelationshipID,
            false,
          )

          return {
            ...cellNode,
            children: nextCellChildren,
          }
        })

        return {
          ...rowNode,
          children: nextCells,
        }
      })

      result.push({
        ...node,
        children: nextRows,
      })
      continue
    }

    if (Array.isArray(node.children)) {
      const inlineSegments = splitInlineNodesByImageTokens(node.children, uploadsByRelationshipID)
      const nextBlocks = buildBlocksFromInlineSegments(node, inlineSegments, allowSideBySide)

      if (nextBlocks.length > 0) {
        result.push(...nextBlocks)
      }

      continue
    }

    result.push(node)
  }

  return result
}

const injectUploadNodesToRichText = (
  value: RichTextContent,
  uploads: UploadedMediaDoc[],
): RichTextContent => {
  if (uploads.length === 0) {
    return value
  }

  const uploadsByRelationshipID = new Map<string, UploadedMediaDoc>()
  for (const upload of uploads) {
    uploadsByRelationshipID.set(upload.relationshipID, upload)
  }

  const cloned = cloneRichText(value)
  const rootChildren = Array.isArray(cloned.root?.children) ? cloned.root.children : []
  cloned.root.children = injectUploadNodesIntoBlocks(
    rootChildren,
    uploadsByRelationshipID,
    true,
  ) as typeof cloned.root.children

  return cloned
}

export default function ProductionDocxImportField() {
  const locale = useLocale()
  const localeCode = typeof locale?.code === 'string' ? locale.code : undefined
  const localeContentPath = localeCode ? `content.${localeCode}` : 'content'

  const formFieldState = useFormFields(([fields]) => fields) as Record<string, unknown>
  const dispatchField = useFormFields(([, dispatch]) => dispatch) as (
    action: Record<string, unknown>,
  ) => void

  const namePath = useMemo(
    () => resolveFieldPath(formFieldState, 'name', localeCode),
    [formFieldState, localeCode],
  )
  const hasLocaleContentPath = useMemo(
    () =>
      Boolean(localeCode) &&
      Object.prototype.hasOwnProperty.call(formFieldState, localeContentPath),
    [formFieldState, localeCode, localeContentPath],
  )
  const contentPath = hasLocaleContentPath ? localeContentPath : 'content'
  const picturePath = useMemo(
    () => resolveFieldPath(formFieldState, 'picture', localeCode),
    [formFieldState, localeCode],
  )
  const introPath = useMemo(
    () => resolveFieldPath(formFieldState, 'intro', localeCode),
    [formFieldState, localeCode],
  )
  const keywordsPath = useMemo(
    () => resolveFieldPath(formFieldState, 'keywords', localeCode),
    [formFieldState, localeCode],
  )
  const leafCategoryPath = useMemo(
    () => resolveFieldPath(formFieldState, 'leaf_category'),
    [formFieldState],
  )
  const sortOrderPath = useMemo(
    () => resolveFieldPath(formFieldState, 'sortOrder'),
    [formFieldState],
  )

  const nameField = useField<string>({ path: namePath })
  const contentField = useField<RichTextContent | Record<string, unknown> | null>({
    path: 'content',
  })
  const pictureField = useField<Array<number | string> | null>({ path: picturePath })
  const introField = useField<string>({ path: introPath })
  const keywordsField = useField<string[] | null>({ path: keywordsPath })
  const leafCategoryField = useField<number | string | null>({ path: leafCategoryPath })
  const sortOrderField = useField<number | null>({ path: sortOrderPath })

  const [sourceName, setSourceName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  const writeContentValue = useCallback(
    (incomingContent: RichTextContent) => {
      const nextContent = cloneRichText(incomingContent)
      const currentContentValue = contentField.value
      const nextContentValue =
        localeCode && isLocalizedObjectValue(currentContentValue)
          ? {
              ...cloneJSON(currentContentValue),
              [localeCode]: nextContent,
            }
          : nextContent

      dispatchField({
        initialValue: cloneJSON(nextContentValue),
        path: contentPath,
        type: 'UPDATE',
        value: nextContentValue,
      })

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          dispatchField({
            initialValue: cloneJSON(nextContentValue),
            path: contentPath,
            type: 'UPDATE',
            value: cloneJSON(nextContentValue),
          })
        })
      }
    },
    [contentField.value, contentPath, dispatchField, localeCode],
  )

  const applyDocxBuffer = useCallback(
    async (buffer: ArrayBuffer, fileName: string) => {
      setIsProcessing(true)
      setErrorMessage('')
      setStatus('')

      try {
        const draft = parseProductionTemplateDocx(buffer)

        if (draft.name) {
          nameField.setValue(draft.name)
        }
        if (draft.intro) {
          introField.setValue(draft.intro)
        }
        if (draft.keywords.length > 0) {
          keywordsField.setValue(draft.keywords)
        }

        const contentImageUploads =
          draft.contentImages.length > 0 ? await uploadImagesToMedia(draft.contentImages) : []
        const contentWithUploads = injectUploadNodesToRichText(
          draft.contentRichText,
          contentImageUploads,
        )

        writeContentValue(contentWithUploads)

        if (typeof sortOrderField.value !== 'number') {
          sortOrderField.setValue(0)
        }

        const imageUploads =
          draft.mainImages.length > 0 ? await uploadImagesToMedia(draft.mainImages) : []
        if (imageUploads.length > 0) {
          pictureField.setValue(imageUploads.map((item) => item.id))
        }

        const leafCategoryID = await getLeafCategoryIDByName(draft.categoryName, localeCode)
        if (leafCategoryID != null) {
          leafCategoryField.setValue(leafCategoryID)
        }

        const nextWarnings = [...draft.warnings]
        if (draft.categoryName && leafCategoryID == null) {
          nextWarnings.push(`未自动匹配到叶分类: ${draft.categoryName}`)
        }

        setWarnings(nextWarnings)
        setSourceName(fileName)
        setStatus(
          `已导入：名称${draft.name ? '✓' : '✗'}，内容✓(path=${contentPath}, locale=${
            localeCode || 'n/a'
          })，图片${imageUploads.length}张，富文本图片${contentImageUploads.length}张${
            leafCategoryID != null ? '，分类✓' : ''
          }`,
        )
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'DOCX 解析失败')
      } finally {
        setIsProcessing(false)
      }
    },
    [
      introField,
      keywordsField,
      leafCategoryField,
      localeCode,
      nameField,
      pictureField,
      sortOrderField,
      writeContentValue,
    ],
  )

  const onUploadFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.name.toLowerCase().endsWith('.docx')) {
        setErrorMessage('仅支持 .docx 文件')
        event.target.value = ''
        return
      }

      const buffer = await file.arrayBuffer()
      await applyDocxBuffer(buffer, file.name)
      event.target.value = ''
    },
    [applyDocxBuffer],
  )

  return (
    <div
      className="docx-import-field"
      style={{
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        marginBottom: '16px',
        padding: '12px',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>DOCX 导入</div>
      <div style={{ color: 'var(--theme-elevation-700)', fontSize: '12px', marginBottom: '10px' }}>
        解析模板后自动填充当前产品表单（名称、简介、关键词、内容、主图、分类）。
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <label
          style={{
            border: '1px solid var(--theme-elevation-300)',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isProcessing ? 0.6 : 1,
            padding: '7px 10px',
          }}
        >
          上传 DOCX
          <input
            accept=".docx"
            disabled={isProcessing}
            onChange={onUploadFile}
            style={{ display: 'none' }}
            type="file"
          />
        </label>
      </div>

      {sourceName ? (
        <div style={{ color: 'var(--theme-elevation-700)', fontSize: '12px', marginTop: '10px' }}>
          当前来源: {sourceName}
        </div>
      ) : null}

      {status ? (
        <div
          style={{
            background: 'var(--theme-success-100)',
            border: '1px solid var(--theme-success-300)',
            borderRadius: '6px',
            color: 'var(--theme-success-700)',
            fontSize: '12px',
            marginTop: '10px',
            padding: '8px',
          }}
        >
          {status}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          style={{
            background: 'var(--theme-error-100)',
            border: '1px solid var(--theme-error-300)',
            borderRadius: '6px',
            color: 'var(--theme-error-700)',
            fontSize: '12px',
            marginTop: '10px',
            padding: '8px',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <ul
          style={{
            color: 'var(--theme-warning-700)',
            fontSize: '12px',
            marginTop: '10px',
            paddingLeft: '18px',
          }}
        >
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <style>
        {`
          .rich-text-lexical .lexical-table-container {
            overflow-x: auto;
            max-width: 100%;
          }

          .rich-text-lexical .lexical-table-container table:has(.lexical-table-cell[style*='--docx-image-grid-marker']),
          .rich-text-lexical .lexical-table-container table:has(.lexical-table-cell:has([data-filename])) {
            border: none !important;
            width: max-content !important;
            table-layout: auto !important;
          }

          .rich-text-lexical .lexical-table-cell[style*='--docx-image-grid-marker'],
          .rich-text-lexical .lexical-table-cell:has([data-filename]) {
            border: none !important;
            padding: 0 !important;
            width: auto !important;
            min-width: 0 !important;
            vertical-align: top !important;
            white-space: nowrap !important;
          }

          .rich-text-lexical .lexical-table-cell[style*='--docx-image-grid-marker'] img,
          .rich-text-lexical .lexical-table-cell[style*='--docx-image-grid-marker'] picture,
          .rich-text-lexical .lexical-table-cell:has([data-filename]) [data-filename],
          .rich-text-lexical .lexical-table-cell:has([data-filename]) [data-filename] * {
            width: auto !important;
            max-width: none !important;
          }

          .rich-text-lexical .lexical-table-cell[style*='--docx-image-grid-marker'] img,
          .rich-text-lexical .lexical-table-cell:has([data-filename]) img {
            height: auto !important;
            object-fit: contain !important;
            width: auto !important;
            max-width: none !important;
          }

          .rich-text-lexical .lexical-table-cell:has([data-filename]) [data-filename] {
            display: inline-block !important;
          }
        `}
      </style>
    </div>
  )
}
