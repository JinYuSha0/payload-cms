import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { convertHTMLToLexical, EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.resolve(scriptDir, '../sql/20260402_06_migrate_strapi_productions.sql')
const mediaSQLPath = path.resolve(scriptDir, '../sql/20260402_01_migrate_strapi_media_and_folders.sql')
const existingSQL = fs.readFileSync(sqlPath, 'utf8')

const db = new DatabaseSync(':memory:')

db.exec(`
CREATE TABLE productions (
  id INTEGER PRIMARY KEY,
  leaf_category_id INTEGER,
  sort_order INTEGER,
  updated_at TEXT,
  created_at TEXT,
  _status TEXT
);
CREATE TABLE productions_locales (
  name TEXT,
  content TEXT,
  id INTEGER PRIMARY KEY,
  _locale TEXT,
  _parent_id INTEGER
);
CREATE TABLE productions_rels (
  id INTEGER PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER,
  path TEXT,
  locale TEXT,
  media_id INTEGER
);
CREATE TABLE _productions_v (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  version_leaf_category_id INTEGER,
  version_sort_order INTEGER,
  version_updated_at TEXT,
  version_created_at TEXT,
  version__status TEXT,
  created_at TEXT,
  updated_at TEXT,
  snapshot TEXT,
  published_locale TEXT,
  latest INTEGER
);
CREATE TABLE _productions_v_locales (
  version_name TEXT,
  version_content TEXT,
  id INTEGER PRIMARY KEY,
  _locale TEXT,
  _parent_id INTEGER
);
CREATE TABLE _productions_v_rels (
  id INTEGER PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER,
  path TEXT,
  locale TEXT,
  media_id INTEGER
);
CREATE TABLE payload_folders (
  id INTEGER PRIMARY KEY,
  name TEXT,
  folder_id INTEGER,
  updated_at TEXT,
  created_at TEXT
);
CREATE TABLE payload_folders_folder_type (
  id INTEGER PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER,
  value TEXT
);
CREATE TABLE media (
  id INTEGER PRIMARY KEY,
  alt TEXT,
  folder_id INTEGER,
  updated_at TEXT,
  created_at TEXT,
  url TEXT,
  thumbnail_u_r_l TEXT,
  filename TEXT,
  mime_type TEXT,
  filesize INTEGER,
  width INTEGER,
  height INTEGER
);
`)

db.exec(existingSQL)
if (fs.existsSync(mediaSQLPath)) {
  db.exec(fs.readFileSync(mediaSQLPath, 'utf8'))
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
const CDN = 'https://img.viteedge.com'

const rewriteAssetURLs = (html) => {
  if (!html) return ''
  return html.replace(/https?:\/\/[^\s"'<>]+/g, (raw) => {
    try {
      const u = new URL(raw)
      const filename = u.pathname.split('/').filter(Boolean).at(-1)
      if (!filename) return raw
      return `${CDN}/${filename}`
    } catch {
      return raw
    }
  })
}

const isLexicalEditorState = (value) => {
  if (typeof value !== 'string' || value.length === 0) return false
  try {
    const parsed = JSON.parse(value)
    return (
      parsed &&
      typeof parsed === 'object' &&
      parsed.root &&
      typeof parsed.root === 'object' &&
      Array.isArray(parsed.root.children)
    )
  } catch {
    return false
  }
}

const asLexicalJSONString = (html, id, field) => {
  try {
    let editorState
    if (isLexicalEditorState(html)) {
      editorState = JSON.parse(html)
    } else {
      const rewritten = rewriteAssetURLs(html || '')
      editorState = convertHTMLToLexical({
        editorConfig,
        html: rewritten,
        JSDOM,
      })
    }

    normalizeUploadNodes(editorState)
    return JSON.stringify(editorState)
  } catch (error) {
    throw new Error(`Failed converting ${field} for row id=${id}: ${String(error?.message || error)}`)
  }
}

const sqlText = (value) => {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

const sqlNum = (value) => {
  if (value === null || value === undefined || value === '') return 'NULL'
  return String(value)
}

const tuple = (values) => `(${values.join(', ')})`
const CONTENT_CHUNK_SIZE = 8_000

const splitContentChunks = (value, chunkSize = CONTENT_CHUNK_SIZE) => {
  if (!value) return []
  const chunks = []
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize))
  }
  return chunks
}

const mediaFilenameToID = new Map()

const addMediaFilename = (name, id) => {
  if (!name || typeof name !== 'string') return
  mediaFilenameToID.set(name, id)
  mediaFilenameToID.set(name.toLowerCase(), id)
}

const basenameFromURL = (value) => {
  if (!value || typeof value !== 'string') return null
  try {
    const parsed = /^https?:\/\//i.test(value) ? new URL(value) : new URL(value, 'https://payload.local')
    const pathname = parsed.pathname || ''
    const filename = pathname.split('/').filter(Boolean).at(-1)
    if (!filename) return null
    return decodeURIComponent(filename)
  } catch {
    return null
  }
}

for (const row of db.prepare('SELECT id, filename, url, thumbnail_u_r_l FROM media').all()) {
  const id = Number(row.id)
  if (Number.isNaN(id)) continue

  if (typeof row.filename === 'string') {
    addMediaFilename(row.filename, id)
  }
  const urlFilename = basenameFromURL(row.url)
  if (urlFilename) {
    addMediaFilename(urlFilename, id)
  }
  const thumbFilename = basenameFromURL(row.thumbnail_u_r_l)
  if (thumbFilename) {
    addMediaFilename(thumbFilename, id)
  }
}

const tryResolveMediaIDBySrc = (src) => {
  const filename = basenameFromURL(src)
  if (!filename) return null

  const direct = mediaFilenameToID.get(filename) ?? mediaFilenameToID.get(filename.toLowerCase())
  if (direct !== undefined) return direct

  if (filename.startsWith('thumbnail_')) {
    const originName = filename.slice('thumbnail_'.length)
    const fromOrigin =
      mediaFilenameToID.get(originName) ?? mediaFilenameToID.get(originName.toLowerCase())
    if (fromOrigin !== undefined) return fromOrigin
  }

  return null
}

const unresolvedUploadSrcSet = new Set()

const normalizeUploadNodes = (editorState) => {
  const visit = (node) => {
    if (!node || typeof node !== 'object') return

    if (node.type === 'upload') {
      const src = node?.pending?.src
      if (typeof src === 'string' && src.length > 0) {
        const mediaID = tryResolveMediaIDBySrc(src)
        if (mediaID !== null) {
          node.fields = node.fields && typeof node.fields === 'object' ? node.fields : {}
          node.relationTo = 'media'
          node.value = mediaID
          delete node.pending
          node.version = 3
        } else {
          unresolvedUploadSrcSet.add(src)
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  if (editorState && typeof editorState === 'object' && editorState.root) {
    visit(editorState.root)
  }
}

const productions = db
  .prepare(
    'SELECT id, leaf_category_id, sort_order, updated_at, created_at, _status FROM productions ORDER BY id',
  )
  .all()

const productionsLocalesRaw = db
  .prepare('SELECT name, content, id, _locale, _parent_id FROM productions_locales ORDER BY id')
  .all()

const productionsLocales = productionsLocalesRaw.map((row) => ({
  ...row,
  content: asLexicalJSONString(row.content, row.id, 'productions_locales.content'),
}))

const productionsRels = db
  .prepare('SELECT id, "order", parent_id, path, locale, media_id FROM productions_rels ORDER BY id')
  .all()

const productionsV = db
  .prepare(
    'SELECT id, parent_id, version_leaf_category_id, version_sort_order, version_updated_at, version_created_at, version__status, created_at, updated_at, snapshot, published_locale, latest FROM _productions_v ORDER BY id',
  )
  .all()

const productionsVLocalesRaw = db
  .prepare(
    'SELECT version_name, version_content, id, _locale, _parent_id FROM _productions_v_locales ORDER BY id',
  )
  .all()

const productionsVLocales = productionsVLocalesRaw.map((row) => ({
  ...row,
  version_content: asLexicalJSONString(row.version_content, row.id, '_productions_v_locales.version_content'),
}))

const productionsVRels = db
  .prepare('SELECT id, "order", parent_id, path, locale, media_id FROM _productions_v_rels ORDER BY id')
  .all()

const lines = []
lines.push('-- Generated from Strapi CSV data under .migrate/rds_data')
lines.push('-- Scope: productions (documents + localized content + picture relations + versions)')
lines.push('-- Source snapshot:')
lines.push(`-- - productions.csv: ${productionsV.length} rows`)
lines.push(`-- - productions_leaf_category_lnk.csv: ${productionsV.length} rows`)
lines.push(`-- - files_related_mph.csv (production.picture): ${productionsVRels.length} rows`)
lines.push('-- Notes:')
lines.push('-- 1) Production IDs are normalized to 1-based contiguous IDs.')
lines.push('-- 2) content is stored as Payload Lexical EditorState JSON (richText compatible).')
lines.push('-- 3) Image upload nodes are resolved to relationTo=media when filename match exists.')
lines.push('-- 4) All inline <img> URLs in content are rewritten to https://img.viteedge.com/<filename>.')
lines.push('-- 5) Localized content is written in chunks to avoid SQLITE_TOOBIG (statement too long).')
lines.push('-- 6) Intentionally no explicit BEGIN/COMMIT for Cloudflare SQL execution compatibility.')
lines.push('')

lines.push('-- 1) Upsert current productions')
lines.push('INSERT INTO productions (')
lines.push('  id,')
lines.push('  leaf_category_id,')
lines.push('  sort_order,')
lines.push('  updated_at,')
lines.push('  created_at,')
lines.push('  _status')
lines.push(')')
lines.push('VALUES')
lines.push(
  productions
    .map((row) =>
      tuple([
        sqlNum(row.id),
        sqlNum(row.leaf_category_id),
        sqlNum(row.sort_order),
        sqlText(row.updated_at),
        sqlText(row.created_at),
        sqlText(row._status),
      ]),
    )
    .map((t) => `  ${t}`)
    .join(',\n'),
)
lines.push('ON CONFLICT(id) DO UPDATE SET')
lines.push('  leaf_category_id = excluded.leaf_category_id,')
lines.push('  sort_order = excluded.sort_order,')
lines.push('  updated_at = excluded.updated_at,')
lines.push('  created_at = excluded.created_at,')
lines.push('  _status = excluded._status;')
lines.push('')

lines.push(
  '-- 2) Upsert localized production fields into productions_locales (content stored as Lexical JSON, chunked)',
)
for (const row of productionsLocales) {
  lines.push('INSERT INTO productions_locales (')
  lines.push('  name,')
  lines.push('  content,')
  lines.push('  id,')
  lines.push('  _locale,')
  lines.push('  _parent_id')
  lines.push(')')
  lines.push(
    `VALUES ${tuple([sqlText(row.name), sqlText(''), sqlNum(row.id), sqlText(row._locale), sqlNum(row._parent_id)])}`,
  )
  lines.push('ON CONFLICT(id) DO UPDATE SET')
  lines.push('  name = excluded.name,')
  lines.push("  content = '',")
  lines.push('  _locale = excluded._locale,')
  lines.push('  _parent_id = excluded._parent_id;')

  const contentChunks = splitContentChunks(row.content)
  for (const chunk of contentChunks) {
    lines.push('UPDATE productions_locales')
    lines.push(`SET content = content || ${sqlText(chunk)}`)
    lines.push(`WHERE id = ${sqlNum(row.id)};`)
  }
  lines.push('')
}

lines.push('-- 3) Upsert production picture hasMany relations (localized)')
lines.push('INSERT INTO productions_rels (')
lines.push('  id,')
lines.push('  "order",')
lines.push('  parent_id,')
lines.push('  path,')
lines.push('  locale,')
lines.push('  media_id')
lines.push(')')
lines.push('VALUES')
lines.push(
  productionsRels
    .map((row) =>
      tuple([
        sqlNum(row.id),
        sqlNum(row.order),
        sqlNum(row.parent_id),
        sqlText(row.path),
        sqlText(row.locale),
        sqlNum(row.media_id),
      ]),
    )
    .map((t) => `  ${t}`)
    .join(',\n'),
)
lines.push('ON CONFLICT(id) DO UPDATE SET')
lines.push('  "order" = excluded."order",')
lines.push('  parent_id = excluded.parent_id,')
lines.push('  path = excluded.path,')
lines.push('  locale = excluded.locale,')
lines.push('  media_id = excluded.media_id;')
lines.push('')

lines.push('-- 4) Upsert production versions')
lines.push('INSERT INTO _productions_v (')
lines.push('  id,')
lines.push('  parent_id,')
lines.push('  version_leaf_category_id,')
lines.push('  version_sort_order,')
lines.push('  version_updated_at,')
lines.push('  version_created_at,')
lines.push('  version__status,')
lines.push('  created_at,')
lines.push('  updated_at,')
lines.push('  snapshot,')
lines.push('  published_locale,')
lines.push('  latest')
lines.push(')')
lines.push('VALUES')
lines.push(
  productionsV
    .map((row) =>
      tuple([
        sqlNum(row.id),
        sqlNum(row.parent_id),
        sqlNum(row.version_leaf_category_id),
        sqlNum(row.version_sort_order),
        sqlText(row.version_updated_at),
        sqlText(row.version_created_at),
        sqlText(row.version__status),
        sqlText(row.created_at),
        sqlText(row.updated_at),
        sqlText(row.snapshot),
        sqlText(row.published_locale),
        sqlNum(row.latest),
      ]),
    )
    .map((t) => `  ${t}`)
    .join(',\n'),
)
lines.push('ON CONFLICT(id) DO UPDATE SET')
lines.push('  parent_id = excluded.parent_id,')
lines.push('  version_leaf_category_id = excluded.version_leaf_category_id,')
lines.push('  version_sort_order = excluded.version_sort_order,')
lines.push('  version_updated_at = excluded.version_updated_at,')
lines.push('  version_created_at = excluded.version_created_at,')
lines.push('  version__status = excluded.version__status,')
lines.push('  created_at = excluded.created_at,')
lines.push('  updated_at = excluded.updated_at,')
lines.push('  snapshot = excluded.snapshot,')
lines.push('  published_locale = excluded.published_locale,')
lines.push('  latest = excluded.latest;')
lines.push('')

lines.push('-- 5) Upsert localized version fields (version_content stored as Lexical JSON, chunked)')
for (const row of productionsVLocales) {
  lines.push('INSERT INTO _productions_v_locales (')
  lines.push('  version_name,')
  lines.push('  version_content,')
  lines.push('  id,')
  lines.push('  _locale,')
  lines.push('  _parent_id')
  lines.push(')')
  lines.push(
    `VALUES ${tuple([sqlText(row.version_name), sqlText(''), sqlNum(row.id), sqlText(row._locale), sqlNum(row._parent_id)])}`,
  )
  lines.push('ON CONFLICT(id) DO UPDATE SET')
  lines.push('  version_name = excluded.version_name,')
  lines.push("  version_content = '',")
  lines.push('  _locale = excluded._locale,')
  lines.push('  _parent_id = excluded._parent_id;')

  const contentChunks = splitContentChunks(row.version_content)
  for (const chunk of contentChunks) {
    lines.push('UPDATE _productions_v_locales')
    lines.push(`SET version_content = version_content || ${sqlText(chunk)}`)
    lines.push(`WHERE id = ${sqlNum(row.id)};`)
  }
  lines.push('')
}

lines.push('-- 6) Upsert version picture hasMany relations (localized)')
lines.push('INSERT INTO _productions_v_rels (')
lines.push('  id,')
lines.push('  "order",')
lines.push('  parent_id,')
lines.push('  path,')
lines.push('  locale,')
lines.push('  media_id')
lines.push(')')
lines.push('VALUES')
lines.push(
  productionsVRels
    .map((row) =>
      tuple([
        sqlNum(row.id),
        sqlNum(row.order),
        sqlNum(row.parent_id),
        sqlText(row.path),
        sqlText(row.locale),
        sqlNum(row.media_id),
      ]),
    )
    .map((t) => `  ${t}`)
    .join(',\n'),
)
lines.push('ON CONFLICT(id) DO UPDATE SET')
lines.push('  "order" = excluded."order",')
lines.push('  parent_id = excluded.parent_id,')
lines.push('  path = excluded.path,')
lines.push('  locale = excluded.locale,')
lines.push('  media_id = excluded.media_id;')
lines.push('')

fs.writeFileSync(sqlPath, lines.join('\n'))

console.log('Rewrote SQL with Lexical JSON content:')
console.log(`- productions: ${productions.length}`)
console.log(`- productions_locales: ${productionsLocales.length}`)
console.log(`- productions_rels: ${productionsRels.length}`)
console.log(`- _productions_v: ${productionsV.length}`)
console.log(`- _productions_v_locales: ${productionsVLocales.length}`)
console.log(`- _productions_v_rels: ${productionsVRels.length}`)
console.log(`- unresolved upload src count: ${unresolvedUploadSrcSet.size}`)
if (unresolvedUploadSrcSet.size > 0) {
  for (const src of unresolvedUploadSrcSet) {
    console.log(`  unresolved: ${src}`)
  }
}
