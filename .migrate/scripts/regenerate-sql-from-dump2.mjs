import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const dumpPath = path.resolve(rootDir, 'sql/dump2.sql')

const outPaths = {
  media: path.resolve(rootDir, 'sql/20260402_01_migrate_strapi_media_and_folders.sql'),
  categories: path.resolve(rootDir, 'sql/20260402_04_migrate_strapi_categories.sql'),
  globals: path.resolve(rootDir, 'sql/20260402_05_migrate_strapi_globals_contact_and_receive_email.sql'),
  productions: path.resolve(rootDir, 'sql/20260402_06_migrate_strapi_productions.sql'),
}

const dump = fs.readFileSync(dumpPath, 'utf8')

const requiredTables = [
  'categories',
  'categories_category_lnk',
  'leaf_categories',
  'leaf_categories_category_lnk',
  'contact_informations',
  'receive_emails',
  'files',
  'files_folder_lnk',
  'files_related_mph',
  'upload_folders',
  'upload_folders_parent_lnk',
  'productions',
  'productions_leaf_category_lnk',
]

const parseColumns = (raw) =>
  raw
    .split(',')
    .map((v) => v.trim())
    .map((v) => {
      if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
      return v
    })

const decodeCopyValue = (raw) => {
  if (raw === '\\N') return null

  let out = ''
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]
    if (ch !== '\\') {
      out += ch
      continue
    }

    if (i + 1 >= raw.length) {
      out += '\\'
      break
    }

    const next = raw[i + 1]
    i += 1

    switch (next) {
      case 'b':
        out += '\b'
        break
      case 'f':
        out += '\f'
        break
      case 'n':
        out += '\n'
        break
      case 'r':
        out += '\r'
        break
      case 't':
        out += '\t'
        break
      case 'v':
        out += '\v'
        break
      case '\\':
        out += '\\'
        break
      default: {
        if (/[0-7]/.test(next)) {
          let oct = next
          for (let j = 0; j < 2 && i + 1 < raw.length && /[0-7]/.test(raw[i + 1]); j += 1) {
            i += 1
            oct += raw[i]
          }
          out += String.fromCharCode(Number.parseInt(oct, 8))
        } else {
          out += next
        }
      }
    }
  }

  return out
}

const extractCopyTable = (tableName) => {
  const marker = `COPY public.${tableName} (`
  const start = dump.indexOf(marker)
  if (start === -1) {
    throw new Error(`COPY block not found for table: ${tableName}`)
  }

  const columnsEndMarker = ') FROM stdin;\n'
  const columnsEnd = dump.indexOf(columnsEndMarker, start)
  if (columnsEnd === -1) {
    throw new Error(`Malformed COPY header for table: ${tableName}`)
  }

  const columnsRaw = dump.slice(start + marker.length, columnsEnd)
  const bodyStart = columnsEnd + columnsEndMarker.length
  const bodyEndMarker = '\n\\.\n'
  const bodyEnd = dump.indexOf(bodyEndMarker, bodyStart)
  if (bodyEnd === -1) {
    throw new Error(`Malformed COPY body for table: ${tableName}`)
  }

  const columns = parseColumns(columnsRaw)
  const body = dump.slice(bodyStart, bodyEnd)
  const rows = []

  if (body.trim().length === 0) {
    return { columns, rows }
  }

  const lines = body.split('\n')
  for (const line of lines) {
    if (!line || line === '\\.') continue
    const parts = line.split('\t')
    if (parts.length !== columns.length) {
      throw new Error(
        `Field count mismatch for ${tableName}: expected ${columns.length}, got ${parts.length} at line: ${line.slice(0, 120)}`,
      )
    }

    const row = {}
    for (let i = 0; i < columns.length; i += 1) {
      row[columns[i]] = decodeCopyValue(parts[i])
    }
    rows.push(row)
  }

  return { columns, rows }
}

const parsed = Object.fromEntries(requiredTables.map((name) => [name, extractCopyTable(name).rows]))

const num = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n)) return null
  return n
}

const int = (value) => {
  const n = num(value)
  if (n === null) return null
  return Math.trunc(n)
}

const toISOZ = (value) => {
  if (!value) return null
  const s = String(value)
  if (/Z$/i.test(s)) return s
  if (s.includes('T')) return `${s}Z`
  return `${s.replace(' ', 'T')}Z`
}

const statusFromPublishedAt = (publishedAt) => (publishedAt ? 'published' : 'draft')

const sqlText = (value) => {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

const sqlNum = (value) => {
  if (value === null || value === undefined || value === '') return 'NULL'
  return String(value)
}

const tuple = (values) => `(${values.join(', ')})`

const sortByNumericID = (rows) => rows.slice().sort((a, b) => int(a.id) - int(b.id))

const sortByOrderThenID = (rows) =>
  rows.slice().sort((a, b) => {
    const ao = num(a.order) ?? Number.MAX_SAFE_INTEGER
    const bo = num(b.order) ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return int(a.id) - int(b.id)
  })

const groupBy = (rows, keyFn) => {
  const map = new Map()
  for (const row of rows) {
    const k = keyFn(row)
    const list = map.get(k)
    if (list) list.push(row)
    else map.set(k, [row])
  }
  return map
}

const basenameFromURL = (value) => {
  if (!value) return null
  try {
    const u = /^https?:\/\//i.test(value) ? new URL(value) : new URL(value, 'https://local.invalid')
    const name = u.pathname.split('/').filter(Boolean).at(-1)
    if (!name) return null
    return decodeURIComponent(name)
  } catch {
    return null
  }
}

const parseJSONSafe = (value) => {
  if (!value || typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const pickLatest = (rows, { preferPublished = false } = {}) => {
  const source = rows.slice()
  const sorted = source.sort((a, b) => {
    const ad = Date.parse(toISOZ(a.updated_at) ?? '') || 0
    const bd = Date.parse(toISOZ(b.updated_at) ?? '') || 0
    if (ad !== bd) return bd - ad
    return int(b.id) - int(a.id)
  })

  if (preferPublished) {
    const pub = sorted.find((r) => Boolean(r.published_at))
    if (pub) return pub
  }

  return sorted[0] ?? null
}

const folderParentMap = new Map()
for (const row of parsed.upload_folders_parent_lnk) {
  const folderID = int(row.folder_id)
  const parentID = int(row.inv_folder_id)
  if (folderID === null) continue
  if (!folderParentMap.has(folderID)) {
    folderParentMap.set(folderID, parentID)
  }
}

const fileFolderRowsByFile = groupBy(parsed.files_folder_lnk, (row) => int(row.file_id))
const fileFolderMap = new Map()
for (const [fileID, rows] of fileFolderRowsByFile.entries()) {
  if (fileID === null) continue
  const sorted = rows.slice().sort((a, b) => {
    const ao = num(a.file_ord) ?? Number.MAX_SAFE_INTEGER
    const bo = num(b.file_ord) ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return int(a.id) - int(b.id)
  })
  const folderID = int(sorted[0]?.folder_id)
  if (folderID !== null) fileFolderMap.set(fileID, folderID)
}

const mediaRows = sortByNumericID(parsed.files).map((row) => {
  const id = int(row.id)
  const formats = parseJSONSafe(row.formats)
  const thumbnailURL =
    row.preview_url ||
    formats?.thumbnail?.url ||
    formats?.small?.url ||
    formats?.medium?.url ||
    formats?.large?.url ||
    null

  const ext = row.ext || ''
  const filename = row.hash ? `${row.hash}${ext}` : basenameFromURL(row.url) || row.name || `file-${id}`

  const bytes = num(row.size)
  const filesize = bytes === null ? null : Math.round(bytes * 1024)

  return {
    id,
    alt: row.alternative_text || row.name || filename,
    folder_id: fileFolderMap.get(id) ?? null,
    updated_at: toISOZ(row.updated_at),
    created_at: toISOZ(row.created_at),
    url: row.url || null,
    thumbnail_u_r_l: thumbnailURL,
    filename,
    mime_type: row.mime || null,
    filesize,
    width: int(row.width),
    height: int(row.height),
  }
})

const folderRowsRaw = sortByNumericID(parsed.upload_folders).map((row) => ({
  id: int(row.id),
  name: row.name || `folder-${row.id}`,
  folder_id: folderParentMap.get(int(row.id)) ?? null,
  updated_at: toISOZ(row.updated_at),
  created_at: toISOZ(row.created_at),
  path: row.path || '',
}))

const folderRows = folderRowsRaw
  .slice()
  .sort((a, b) => {
    const ad = a.path.split('/').filter(Boolean).length
    const bd = b.path.split('/').filter(Boolean).length
    if (ad !== bd) return ad - bd
    return a.id - b.id
  })

const folderTypeRows = folderRows.map((row) => ({
  id: row.id,
  order: 1,
  parent_id: row.id,
  value: 'media',
}))

const mphRows = parsed.files_related_mph.filter((row) => row.field === 'picture')
const categoryPictureRows = mphRows.filter((row) => row.related_type === 'api::category.category')
const leafPictureRows = mphRows.filter((row) => row.related_type === 'api::leaf-category.leaf-category')
const productionPictureRows = mphRows.filter((row) => row.related_type === 'api::production.production')

const pickPictureMap = (rows) => {
  const map = new Map()
  const grouped = groupBy(rows, (row) => int(row.related_id))
  for (const [relatedID, group] of grouped.entries()) {
    if (relatedID === null) continue
    const sorted = sortByOrderThenID(group)
    const fileID = int(sorted[0]?.file_id)
    if (fileID !== null) map.set(relatedID, fileID)
  }
  return map
}

const categoryPictureMap = pickPictureMap(categoryPictureRows)
const leafPictureMap = pickPictureMap(leafPictureRows)

const categoryParentMap = new Map()
for (const row of parsed.categories_category_lnk) {
  const child = int(row.category_id)
  const parent = int(row.inv_category_id)
  if (child === null) continue
  if (!categoryParentMap.has(child)) categoryParentMap.set(child, parent)
}

const leafParentMap = new Map()
for (const row of parsed.leaf_categories_category_lnk) {
  const child = int(row.leaf_category_id)
  const parent = int(row.category_id)
  if (child === null) continue
  if (!leafParentMap.has(child)) leafParentMap.set(child, parent)
}

const categoryNodes = [
  ...parsed.categories.map((row) => ({
    kind: 'category',
    id: int(row.id),
    name: row.name,
    locale: row.locale || 'en',
    category_id: categoryParentMap.get(int(row.id)) ?? null,
    sort_order: int(row.sort_order) ?? 0,
    created_at: toISOZ(row.created_at),
    updated_at: toISOZ(row.updated_at),
    _status: statusFromPublishedAt(row.published_at),
  })),
  ...parsed.leaf_categories.map((row) => ({
    kind: 'leaf',
    id: int(row.id),
    name: row.name,
    locale: row.locale || 'en',
    category_id: leafParentMap.get(int(row.id)) ?? null,
    sort_order: int(row.sort_order) ?? 0,
    created_at: toISOZ(row.created_at),
    updated_at: toISOZ(row.updated_at),
    _status: statusFromPublishedAt(row.published_at),
  })),
]
  .filter((row) => row.id !== null)
  .sort((a, b) => a.id - b.id)

const categoryLocaleRows = categoryNodes.map((node) => ({
  name: node.name,
  picture_id: node.kind === 'category' ? (categoryPictureMap.get(node.id) ?? null) : (leafPictureMap.get(node.id) ?? null),
  id: node.id,
  _locale: node.locale || 'en',
  _parent_id: node.id,
}))

const categoryVersionRows = categoryNodes.map((node) => ({
  id: node.id,
  parent_id: node.id,
  version_category_id: node.category_id,
  version_sort_order: node.sort_order,
  version_updated_at: node.updated_at,
  version_created_at: node.created_at,
  version__status: node._status,
  created_at: node.created_at,
  updated_at: node.updated_at,
  snapshot: null,
  published_locale: node._status === 'published' ? (node.locale || 'en') : null,
  latest: 1,
}))

const categoryVersionLocaleRows = categoryLocaleRows.map((row) => ({
  version_name: row.name,
  version_picture_id: row.picture_id,
  id: row.id,
  _locale: row._locale,
  _parent_id: row._parent_id,
}))

const pickGlobalCurrent = (rows) => {
  if (rows.length === 0) return null
  return pickLatest(rows, { preferPublished: true })
}

const contactRows = sortByNumericID(parsed.contact_informations)
const receiveRows = sortByNumericID(parsed.receive_emails)

const currentContact = pickGlobalCurrent(contactRows)
const currentReceive = pickGlobalCurrent(receiveRows)

const contactVersions = contactRows.map((row) => ({
  id: int(row.id),
  version_phone: row.phone || null,
  version_email: row.email || null,
  version_address: row.address || null,
  version__status: statusFromPublishedAt(row.published_at),
  version_updated_at: toISOZ(row.updated_at),
  version_created_at: toISOZ(row.created_at),
  created_at: toISOZ(row.created_at),
  updated_at: toISOZ(row.updated_at),
  snapshot: null,
  published_locale: row.locale || null,
  latest: currentContact && int(currentContact.id) === int(row.id) ? 1 : 0,
}))

const receiveVersions = receiveRows.map((row) => ({
  id: int(row.id),
  version_email: row.email || null,
  version__status: statusFromPublishedAt(row.published_at),
  version_updated_at: toISOZ(row.updated_at),
  version_created_at: toISOZ(row.created_at),
  created_at: toISOZ(row.created_at),
  updated_at: toISOZ(row.updated_at),
  snapshot: null,
  published_locale: row.locale || null,
  latest: currentReceive && int(currentReceive.id) === int(row.id) ? 1 : 0,
}))

const productionRows = sortByNumericID(parsed.productions)
const prodLinksByProductionID = groupBy(parsed.productions_leaf_category_lnk, (row) => int(row.production_id))

const getLeafCategoryForProductionID = (productionID) => {
  const links = prodLinksByProductionID.get(productionID)
  if (!links || links.length === 0) return null
  const sorted = links.slice().sort((a, b) => {
    const ao = num(a.production_ord) ?? Number.MAX_SAFE_INTEGER
    const bo = num(b.production_ord) ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return int(a.id) - int(b.id)
  })
  return int(sorted[0].leaf_category_id)
}

const productionDocs = []
const sourceToCanonical = new Map()

const prodByDocument = groupBy(productionRows, (row) => row.document_id || `id:${row.id}`)
for (const [, rows] of prodByDocument) {
  const canonical = pickLatest(rows, { preferPublished: true })
  if (!canonical) continue

  const canonicalID = int(canonical.id)
  if (canonicalID === null) continue

  for (const row of rows) {
    sourceToCanonical.set(int(row.id), canonicalID)
  }

  const leafFromCanonical = getLeafCategoryForProductionID(canonicalID)
  let leafCategoryID = leafFromCanonical
  if (leafCategoryID === null) {
    for (const row of rows) {
      const fallback = getLeafCategoryForProductionID(int(row.id))
      if (fallback !== null) {
        leafCategoryID = fallback
        break
      }
    }
  }

  productionDocs.push({
    canonicalID,
    canonicalRow: canonical,
    sourceRows: rows.slice(),
    leaf_category_id: leafCategoryID,
  })
}

productionDocs.sort((a, b) => a.canonicalID - b.canonicalID)

const productionPictureByRelatedID = groupBy(productionPictureRows, (row) => int(row.related_id))

const productionCurrentRows = productionDocs.map((doc) => ({
  id: doc.canonicalID,
  leaf_category_id: doc.leaf_category_id,
  sort_order: int(doc.canonicalRow.sort_order) ?? 0,
  updated_at: toISOZ(doc.canonicalRow.updated_at),
  created_at: toISOZ(doc.canonicalRow.created_at),
  _status: statusFromPublishedAt(doc.canonicalRow.published_at),
  locale: doc.canonicalRow.locale || 'en',
  name: doc.canonicalRow.name || null,
  content: doc.canonicalRow.content || '',
}))

const productionVersions = productionRows.map((row) => {
  const sourceID = int(row.id)
  const canonicalID = sourceToCanonical.get(sourceID) ?? sourceID
  const leaf = getLeafCategoryForProductionID(sourceID)
  const canonicalLeaf = productionCurrentRows.find((d) => d.id === canonicalID)?.leaf_category_id ?? null

  return {
    id: sourceID,
    parent_id: canonicalID,
    version_leaf_category_id: leaf ?? canonicalLeaf,
    version_sort_order: int(row.sort_order) ?? 0,
    version_updated_at: toISOZ(row.updated_at),
    version_created_at: toISOZ(row.created_at),
    version__status: statusFromPublishedAt(row.published_at),
    created_at: toISOZ(row.created_at),
    updated_at: toISOZ(row.updated_at),
    snapshot: null,
    published_locale: row.published_at ? row.locale || 'en' : null,
    latest: canonicalID === sourceID ? 1 : 0,
  }
})

const mediaFilenameToID = new Map()
const addMediaName = (name, id) => {
  if (!name) return
  mediaFilenameToID.set(name, id)
  mediaFilenameToID.set(String(name).toLowerCase(), id)
}

for (const row of mediaRows) {
  addMediaName(row.filename, row.id)
  const fromURL = basenameFromURL(row.url)
  if (fromURL) addMediaName(fromURL, row.id)
  const fromThumb = basenameFromURL(row.thumbnail_u_r_l)
  if (fromThumb) addMediaName(fromThumb, row.id)
}

const resolveMediaIDBySrc = (src) => {
  const filename = basenameFromURL(src)
  if (!filename) return null

  const direct = mediaFilenameToID.get(filename) ?? mediaFilenameToID.get(filename.toLowerCase())
  if (direct !== undefined) return direct

  if (filename.startsWith('thumbnail_')) {
    const original = filename.slice('thumbnail_'.length)
    const originalHit = mediaFilenameToID.get(original) ?? mediaFilenameToID.get(original.toLowerCase())
    if (originalHit !== undefined) return originalHit
  }

  return null
}

const adapterProvider = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
})

const adapter = await adapterProvider({
  config: {
    editor: {},
    i18n: { translations: {} },
    collections: [],
    globals: [],
  },
  isRoot: true,
  parentIsLocalized: false,
})

const editorConfig = adapter.editorConfig

const isLexicalEditorState = (value) => {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const parsed = JSON.parse(value)
    return Boolean(parsed && typeof parsed === 'object' && parsed.root && Array.isArray(parsed.root.children))
  } catch {
    return false
  }
}

const unresolvedUploadSrc = new Set()

const normalizeUploadNodes = (editorState) => {
  const visit = (node) => {
    if (!node || typeof node !== 'object') return

    if (node.type === 'upload') {
      const src = node?.pending?.src
      if (typeof src === 'string' && src.length > 0) {
        const mediaID = resolveMediaIDBySrc(src)
        if (mediaID !== null) {
          node.fields = node.fields && typeof node.fields === 'object' ? node.fields : {}
          node.relationTo = 'media'
          node.value = mediaID
          delete node.pending
          node.version = 3
        } else {
          unresolvedUploadSrc.add(src)
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child)
    }
  }

  if (editorState?.root) visit(editorState.root)
}

const EMPTY_EDITOR = JSON.stringify({
  root: {
    children: [],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const asLexicalJSONString = (value, id, field) => {
  if (!value || String(value).trim() === '') return EMPTY_EDITOR
  try {
    let editorState
    if (isLexicalEditorState(value)) {
      editorState = JSON.parse(value)
    } else {
      editorState = convertHTMLToLexical({
        editorConfig,
        html: value,
        JSDOM,
      })
    }

    normalizeUploadNodes(editorState)
    return JSON.stringify(editorState)
  } catch (error) {
    throw new Error(`Failed to convert ${field} for production id=${id}: ${String(error?.message || error)}`)
  }
}

const CONTENT_CHUNK_SIZE = 8_000
const splitContentChunks = (value, chunkSize = CONTENT_CHUNK_SIZE) => {
  if (!value) return []
  const chunks = []
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize))
  }
  return chunks
}

const productionLocaleRows = productionCurrentRows.map((row) => ({
  name: row.name,
  content: asLexicalJSONString(row.content, row.id, 'productions_locales.content'),
  id: row.id,
  _locale: row.locale || 'en',
  _parent_id: row.id,
}))

const productionVersionLocaleRows = productionRows.map((row) => ({
  id: int(row.id),
  version_name: row.name || null,
  version_content: asLexicalJSONString(row.content || '', int(row.id), '_productions_v_locales.version_content'),
  _locale: row.locale || 'en',
  _parent_id: int(row.id),
}))

const productionRelRows = []
for (const doc of productionDocs) {
  const canonicalID = doc.canonicalID
  const canonicalSourceRows = productionPictureByRelatedID.get(canonicalID) ?? []

  // Merge picture links across all rows in the same Strapi document.
  // Canonical row keeps priority, while extra media from sibling rows is backfilled.
  const mergedRows = []
  if (canonicalSourceRows.length > 0) mergedRows.push(...canonicalSourceRows)
  for (const row of doc.sourceRows) {
    const sourceID = int(row.id)
    if (sourceID === canonicalID) continue
    const relRows = productionPictureByRelatedID.get(sourceID)
    if (relRows?.length) mergedRows.push(...relRows)
  }

  const dedupedByMedia = new Map()
  for (const rel of sortByOrderThenID(mergedRows)) {
    const mediaID = int(rel.file_id)
    if (mediaID === null) continue
    if (!dedupedByMedia.has(mediaID)) dedupedByMedia.set(mediaID, rel)
  }

  const sorted = sortByOrderThenID(Array.from(dedupedByMedia.values()))
  const locale = doc.canonicalRow.locale || 'en'

  for (const rel of sorted) {
    const mediaID = int(rel.file_id)
    if (mediaID === null) continue
    productionRelRows.push({
      id: int(rel.id),
      order: int(rel.order) ?? null,
      parent_id: canonicalID,
      path: 'picture',
      locale,
      media_id: mediaID,
    })
  }
}

const productionVersionRelRows = []
for (const row of productionRows) {
  const sourceID = int(row.id)
  const relatedRows = sortByOrderThenID(productionPictureByRelatedID.get(sourceID) ?? [])
  const locale = row.locale || 'en'

  for (const rel of relatedRows) {
    const mediaID = int(rel.file_id)
    if (mediaID === null) continue
    productionVersionRelRows.push({
      id: int(rel.id),
      order: int(rel.order) ?? null,
      parent_id: sourceID,
      path: 'picture',
      locale,
      media_id: mediaID,
    })
  }
}

const uniqueByID = (rows) => {
  const map = new Map()
  for (const row of rows) {
    map.set(row.id, row)
  }
  return Array.from(map.values()).sort((a, b) => a.id - b.id)
}

const productionRelRowsUnique = uniqueByID(productionRelRows)
const productionVersionRelRowsUnique = uniqueByID(productionVersionRelRows)

const renderInsert = ({ table, columns, rows, onConflict }) => {
  const lines = []
  if (rows.length === 0) {
    lines.push(`-- ${table}: no rows`)
    return lines
  }

  lines.push(`INSERT INTO ${table} (`)
  lines.push(columns.map((c) => `  ${c}`).join(',\n'))
  lines.push(')')
  lines.push('VALUES')
  lines.push(
    rows
      .map((row) =>
        tuple(
          columns.map((col) => {
            const key = col.replaceAll('"', '')
            const value = row[key]
            if (typeof value === 'number') return sqlNum(value)
            return sqlText(value)
          }),
        ),
      )
      .map((t) => `  ${t}`)
      .join(',\n'),
  )

  if (onConflict?.length) {
    lines.push('ON CONFLICT(id) DO UPDATE SET')
    lines.push(
      onConflict
        .map((col, idx) => {
          const comma = idx === onConflict.length - 1 ? ';' : ','
          return `  ${col} = excluded.${col}${comma}`
        })
        .join('\n'),
    )
  } else {
    lines[lines.length - 1] += ';'
  }

  return lines
}

const mediaLines = []
mediaLines.push('-- Generated from dump2.sql (PostgreSQL)')
mediaLines.push('-- Scope: media files + folder hierarchy')
mediaLines.push(`-- Source counts: ${folderRows.length} folders, ${mediaRows.length} files`)
mediaLines.push('-- Notes:')
mediaLines.push('-- 1) IDs keep Strapi source IDs to preserve relation integrity.')
mediaLines.push('-- 2) folder_id is resolved via files_folder_lnk.')
mediaLines.push('-- 3) filesize is converted from Strapi `size` (KB) to bytes.')
mediaLines.push('-- 4) Intentionally no explicit BEGIN/COMMIT for Cloudflare D1 execution compatibility.')
mediaLines.push('')
mediaLines.push('-- 1) Upsert folder tree into payload_folders')
mediaLines.push(
  ...renderInsert({
    table: 'payload_folders',
    columns: ['id', 'name', 'folder_id', 'updated_at', 'created_at'],
    rows: folderRows,
    onConflict: ['name', 'folder_id', 'updated_at', 'created_at'],
  }),
)
mediaLines.push('')
mediaLines.push('-- 2) Mark all imported folders as media type')
mediaLines.push(
  ...renderInsert({
    table: 'payload_folders_folder_type',
    columns: ['id', '"order"', 'parent_id', 'value'],
    rows: folderTypeRows,
    onConflict: ['"order"', 'parent_id', 'value'],
  }),
)
mediaLines.push('')
mediaLines.push('-- 3) Upsert media rows')
mediaLines.push(
  ...renderInsert({
    table: 'media',
    columns: [
      'id',
      'alt',
      'folder_id',
      'updated_at',
      'created_at',
      'url',
      'thumbnail_u_r_l',
      'filename',
      'mime_type',
      'filesize',
      'width',
      'height',
    ],
    rows: mediaRows,
    onConflict: [
      'alt',
      'folder_id',
      'updated_at',
      'created_at',
      'url',
      'thumbnail_u_r_l',
      'filename',
      'mime_type',
      'filesize',
      'width',
      'height',
    ],
  }),
)
mediaLines.push('')

const categoriesLines = []
categoriesLines.push('-- Generated from dump2.sql (PostgreSQL)')
categoriesLines.push('-- Scope: categories + leaf categories')
categoriesLines.push(
  `-- Source counts: ${parsed.categories.length} categories, ${parsed.leaf_categories.length} leaf categories, ${categoryNodes.length} total category nodes`,
)
categoriesLines.push('-- Notes:')
categoriesLines.push('-- 1) IDs keep Strapi source IDs to preserve production/category links.')
categoriesLines.push('-- 2) categories + leaf_categories are merged into Payload `categories` tree.')
categoriesLines.push('-- 3) picture relation is restored from files_related_mph for both category types.')
categoriesLines.push('-- 4) Includes versions tables used by Payload drafts/admin.')
categoriesLines.push('-- 5) Intentionally no explicit BEGIN/COMMIT for Cloudflare D1 execution compatibility.')
categoriesLines.push('')
categoriesLines.push('-- 1) Upsert categories tree')
categoriesLines.push(
  ...renderInsert({
    table: 'categories',
    columns: ['id', 'category_id', 'sort_order', 'updated_at', 'created_at', '_status'],
    rows: categoryNodes,
    onConflict: ['category_id', 'sort_order', 'updated_at', 'created_at', '_status'],
  }),
)
categoriesLines.push('')
categoriesLines.push('-- 2) Upsert categories_locales')
categoriesLines.push(
  ...renderInsert({
    table: 'categories_locales',
    columns: ['name', 'picture_id', 'id', '_locale', '_parent_id'],
    rows: categoryLocaleRows,
    onConflict: ['name', 'picture_id', '_locale', '_parent_id'],
  }),
)
categoriesLines.push('')
categoriesLines.push('-- 3) Upsert _categories_v')
categoriesLines.push(
  ...renderInsert({
    table: '_categories_v',
    columns: [
      'id',
      'parent_id',
      'version_category_id',
      'version_sort_order',
      'version_updated_at',
      'version_created_at',
      'version__status',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
    rows: categoryVersionRows,
    onConflict: [
      'parent_id',
      'version_category_id',
      'version_sort_order',
      'version_updated_at',
      'version_created_at',
      'version__status',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
  }),
)
categoriesLines.push('')
categoriesLines.push('-- 4) Upsert _categories_v_locales')
categoriesLines.push(
  ...renderInsert({
    table: '_categories_v_locales',
    columns: ['version_name', 'version_picture_id', 'id', '_locale', '_parent_id'],
    rows: categoryVersionLocaleRows,
    onConflict: ['version_name', 'version_picture_id', '_locale', '_parent_id'],
  }),
)
categoriesLines.push('')

const globalsLines = []
globalsLines.push('-- Generated from dump2.sql (PostgreSQL)')
globalsLines.push('-- Scope: contact_information + receive_email globals (with versions)')
globalsLines.push(`-- Source counts: contact_informations=${contactRows.length}, receive_emails=${receiveRows.length}`)
globalsLines.push('-- Notes:')
globalsLines.push('-- 1) Current global row uses latest published row when available (else latest draft).')
globalsLines.push('-- 2) Versions tables keep all source rows as history snapshots.')
globalsLines.push('-- 3) Intentionally no explicit BEGIN/COMMIT for Cloudflare D1 execution compatibility.')
globalsLines.push('')

globalsLines.push('-- 1) Upsert contact_information current row')
if (currentContact) {
  const contactCurrentRow = {
    id: 1,
    phone: currentContact.phone || null,
    email: currentContact.email || null,
    address: currentContact.address || null,
    _status: statusFromPublishedAt(currentContact.published_at),
    updated_at: toISOZ(currentContact.updated_at),
    created_at: toISOZ(currentContact.created_at),
  }
  globalsLines.push(
    ...renderInsert({
      table: 'contact_information',
      columns: ['id', 'phone', 'email', 'address', '_status', 'updated_at', 'created_at'],
      rows: [contactCurrentRow],
      onConflict: ['phone', 'email', 'address', '_status', 'updated_at', 'created_at'],
    }),
  )
} else {
  globalsLines.push('-- contact_information: no source rows')
}
globalsLines.push('')

globalsLines.push('-- 2) Upsert _contact_information_v')
globalsLines.push(
  ...renderInsert({
    table: '_contact_information_v',
    columns: [
      'id',
      'version_phone',
      'version_email',
      'version_address',
      'version__status',
      'version_updated_at',
      'version_created_at',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
    rows: contactVersions,
    onConflict: [
      'version_phone',
      'version_email',
      'version_address',
      'version__status',
      'version_updated_at',
      'version_created_at',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
  }),
)
globalsLines.push('')

globalsLines.push('-- 3) Upsert receive_email current row')
if (currentReceive) {
  const receiveCurrentRow = {
    id: 1,
    email: currentReceive.email || null,
    _status: statusFromPublishedAt(currentReceive.published_at),
    updated_at: toISOZ(currentReceive.updated_at),
    created_at: toISOZ(currentReceive.created_at),
  }
  globalsLines.push(
    ...renderInsert({
      table: 'receive_email',
      columns: ['id', 'email', '_status', 'updated_at', 'created_at'],
      rows: [receiveCurrentRow],
      onConflict: ['email', '_status', 'updated_at', 'created_at'],
    }),
  )
} else {
  globalsLines.push('-- receive_email: no source rows')
}
globalsLines.push('')

globalsLines.push('-- 4) Upsert _receive_email_v')
globalsLines.push(
  ...renderInsert({
    table: '_receive_email_v',
    columns: [
      'id',
      'version_email',
      'version__status',
      'version_updated_at',
      'version_created_at',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
    rows: receiveVersions,
    onConflict: [
      'version_email',
      'version__status',
      'version_updated_at',
      'version_created_at',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
  }),
)
globalsLines.push('')

const productionsLines = []
productionsLines.push('-- Generated from dump2.sql (PostgreSQL)')
productionsLines.push('-- Scope: productions (documents + localized richText + picture relations + versions)')
productionsLines.push('-- Source snapshot:')
productionsLines.push(`-- - productions: ${productionRows.length} source rows`) 
productionsLines.push(`-- - canonical productions: ${productionCurrentRows.length} current documents`) 
productionsLines.push(`-- - productions_leaf_category_lnk: ${parsed.productions_leaf_category_lnk.length} rows`) 
productionsLines.push(`-- - files_related_mph (production.picture): ${productionPictureRows.length} rows`) 
productionsLines.push('-- Notes:')
productionsLines.push('-- 1) Current document rows are resolved by document_id (prefer latest published row).')
productionsLines.push('-- 2) IDs keep source canonical IDs to avoid relationship drift.')
productionsLines.push('-- 3) content/version_content are converted to Payload Lexical EditorState JSON.')
productionsLines.push('-- 4) Upload nodes are normalized to relationTo=media when filename match is found.')
productionsLines.push('-- 5) RichText is chunk-updated to avoid SQLITE_TOOBIG in D1.')
productionsLines.push('-- 6) Intentionally no explicit BEGIN/COMMIT for Cloudflare D1 execution compatibility.')
productionsLines.push('')

productionsLines.push('-- 1) Upsert productions current rows')
productionsLines.push(
  ...renderInsert({
    table: 'productions',
    columns: ['id', 'leaf_category_id', 'sort_order', 'updated_at', 'created_at', '_status'],
    rows: productionCurrentRows,
    onConflict: ['leaf_category_id', 'sort_order', 'updated_at', 'created_at', '_status'],
  }),
)
productionsLines.push('')

productionsLines.push('-- 2) Upsert productions_locales (chunked content)')
for (const row of productionLocaleRows) {
  productionsLines.push(
    ...renderInsert({
      table: 'productions_locales',
      columns: ['name', 'content', 'id', '_locale', '_parent_id'],
      rows: [{ ...row, content: '' }],
      onConflict: ['name', 'content', '_locale', '_parent_id'],
    }),
  )

  const chunks = splitContentChunks(row.content)
  for (const chunk of chunks) {
    productionsLines.push('UPDATE productions_locales')
    productionsLines.push(`SET content = content || ${sqlText(chunk)}`)
    productionsLines.push(`WHERE id = ${sqlNum(row.id)};`)
  }
  productionsLines.push('')
}

productionsLines.push('-- 3) Upsert productions_rels (picture)')
productionsLines.push(
  ...renderInsert({
    table: 'productions_rels',
    columns: ['id', '"order"', 'parent_id', 'path', 'locale', 'media_id'],
    rows: productionRelRowsUnique,
    onConflict: ['"order"', 'parent_id', 'path', 'locale', 'media_id'],
  }),
)
productionsLines.push('')

productionsLines.push('-- 4) Upsert _productions_v')
productionsLines.push(
  ...renderInsert({
    table: '_productions_v',
    columns: [
      'id',
      'parent_id',
      'version_leaf_category_id',
      'version_sort_order',
      'version_updated_at',
      'version_created_at',
      'version__status',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
    rows: productionVersions,
    onConflict: [
      'parent_id',
      'version_leaf_category_id',
      'version_sort_order',
      'version_updated_at',
      'version_created_at',
      'version__status',
      'created_at',
      'updated_at',
      'snapshot',
      'published_locale',
      'latest',
    ],
  }),
)
productionsLines.push('')

productionsLines.push('-- 5) Upsert _productions_v_locales (chunked version_content)')
for (const row of productionVersionLocaleRows) {
  productionsLines.push(
    ...renderInsert({
      table: '_productions_v_locales',
      columns: ['version_name', 'version_content', 'id', '_locale', '_parent_id'],
      rows: [{ ...row, version_content: '' }],
      onConflict: ['version_name', 'version_content', '_locale', '_parent_id'],
    }),
  )

  const chunks = splitContentChunks(row.version_content)
  for (const chunk of chunks) {
    productionsLines.push('UPDATE _productions_v_locales')
    productionsLines.push(`SET version_content = version_content || ${sqlText(chunk)}`)
    productionsLines.push(`WHERE id = ${sqlNum(row.id)};`)
  }
  productionsLines.push('')
}

productionsLines.push('-- 6) Upsert _productions_v_rels (picture)')
productionsLines.push(
  ...renderInsert({
    table: '_productions_v_rels',
    columns: ['id', '"order"', 'parent_id', 'path', 'locale', 'media_id'],
    rows: productionVersionRelRowsUnique,
    onConflict: ['"order"', 'parent_id', 'path', 'locale', 'media_id'],
  }),
)
productionsLines.push('')

const writeSQL = (filePath, lines) => {
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8')
}

writeSQL(outPaths.media, mediaLines)
writeSQL(outPaths.categories, categoriesLines)
writeSQL(outPaths.globals, globalsLines)
writeSQL(outPaths.productions, productionsLines)

const folderIDSet = new Set(folderRows.map((r) => r.id))
const mediaIDSet = new Set(mediaRows.map((r) => r.id))
const categoryIDSet = new Set(categoryNodes.map((r) => r.id))
const productionIDSet = new Set(productionCurrentRows.map((r) => r.id))
const productionVersionIDSet = new Set(productionVersions.map((r) => r.id))

const mediaFolderOrphans = mediaRows.filter((r) => r.folder_id !== null && !folderIDSet.has(r.folder_id)).length
const folderParentOrphans = folderRows.filter((r) => r.folder_id !== null && !folderIDSet.has(r.folder_id)).length
const categoryParentOrphans = categoryNodes.filter((r) => r.category_id !== null && !categoryIDSet.has(r.category_id)).length
const productionCategoryOrphans = productionCurrentRows.filter(
  (r) => r.leaf_category_id !== null && !categoryIDSet.has(r.leaf_category_id),
).length
const productionRelMediaOrphans = productionRelRowsUnique.filter((r) => !mediaIDSet.has(r.media_id)).length
const productionRelParentOrphans = productionRelRowsUnique.filter((r) => !productionIDSet.has(r.parent_id)).length
const productionVRelMediaOrphans = productionVersionRelRowsUnique.filter((r) => !mediaIDSet.has(r.media_id)).length
const productionVRelParentOrphans = productionVersionRelRowsUnique.filter((r) => !productionVersionIDSet.has(r.parent_id)).length

console.log('Regenerated SQL files from dump2.sql:')
console.log(`- ${path.relative(process.cwd(), outPaths.media)}`)
console.log(`- ${path.relative(process.cwd(), outPaths.categories)}`)
console.log(`- ${path.relative(process.cwd(), outPaths.globals)}`)
console.log(`- ${path.relative(process.cwd(), outPaths.productions)}`)
console.log('')
console.log('Source summary:')
console.log(`- folders: ${folderRows.length}`)
console.log(`- files/media: ${mediaRows.length}`)
console.log(`- categories: ${parsed.categories.length}`)
console.log(`- leaf_categories: ${parsed.leaf_categories.length}`)
console.log(`- merged category nodes: ${categoryNodes.length}`)
console.log(`- productions source rows: ${productionRows.length}`)
console.log(`- productions canonical docs: ${productionCurrentRows.length}`)
console.log(`- contact versions: ${contactVersions.length}`)
console.log(`- receive_email versions: ${receiveVersions.length}`)
console.log('')
console.log('Integrity checks (should all be 0):')
console.log(`- folder parent orphans: ${folderParentOrphans}`)
console.log(`- media->folder orphans: ${mediaFolderOrphans}`)
console.log(`- category parent orphans: ${categoryParentOrphans}`)
console.log(`- productions->categories orphans: ${productionCategoryOrphans}`)
console.log(`- productions_rels media orphans: ${productionRelMediaOrphans}`)
console.log(`- productions_rels parent orphans: ${productionRelParentOrphans}`)
console.log(`- _productions_v_rels media orphans: ${productionVRelMediaOrphans}`)
console.log(`- _productions_v_rels parent orphans: ${productionVRelParentOrphans}`)
console.log(`- unresolved upload src in richText: ${unresolvedUploadSrc.size}`)

if (
  folderParentOrphans !== 0 ||
  mediaFolderOrphans !== 0 ||
  categoryParentOrphans !== 0 ||
  productionCategoryOrphans !== 0 ||
  productionRelMediaOrphans !== 0 ||
  productionRelParentOrphans !== 0 ||
  productionVRelMediaOrphans !== 0 ||
  productionVRelParentOrphans !== 0
) {
  process.exitCode = 1
}
