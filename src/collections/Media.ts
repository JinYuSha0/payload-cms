import type { CollectionConfig } from 'payload'
import { getRuntimeR2Bucket } from '../lib/runtime-bindings'

const DEFAULT_THUMBNAIL_PREFIX = 'thumbnail_'
const DEFAULT_THUMBNAIL_RESIZE_OPTS = 'width=480,fit=cover,quality=85,format=auto'

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const resolveMediaPublicOrigin = (): string | null => {
  const configured = normalizeString(process.env.MEDIA_PUBLIC_ORIGIN)
  if (!configured) {
    return null
  }

  return configured.replace(/\/+$/, '')
}

const resolveThumbnailPrefix = (): string => {
  return normalizeString(process.env.MEDIA_THUMBNAIL_PREFIX) || DEFAULT_THUMBNAIL_PREFIX
}

const resolveThumbnailResizeOptions = (): string => {
  return normalizeString(process.env.MEDIA_THUMBNAIL_RESIZE_OPTS) || DEFAULT_THUMBNAIL_RESIZE_OPTS
}

const mapURLToPublicOrigin = (sourceURL: string): string | null => {
  const raw = normalizeString(sourceURL)
  if (!raw) {
    return null
  }

  const origin = resolveMediaPublicOrigin()
  if (!origin) {
    return raw
  }
  const absoluteURLPattern = /^https?:\/\//i
  const isAbsolute = absoluteURLPattern.test(raw)

  try {
    const target = new URL(origin)
    const parsed = isAbsolute ? new URL(raw) : new URL(raw, `${target.origin}/`)
    parsed.protocol = target.protocol
    parsed.host = target.host
    return parsed.toString()
  } catch {
    return null
  }
}

const isImageLikeResource = (data: Record<string, unknown>): boolean => {
  const mime =
    normalizeString(data.mimeType) || normalizeString(data.mime_type) || normalizeString(data.mime)

  if (!mime) {
    return true
  }

  return mime.toLowerCase().startsWith('image/')
}

const buildThumbnailURLWithFilenamePrefix = (sourceURL: string): string | null => {
  const raw = normalizeString(sourceURL)
  if (!raw) {
    return null
  }

  const isAbsolute = /^https?:\/\//i.test(raw)

  try {
    const parsed = isAbsolute ? new URL(raw) : new URL(raw, 'https://payload.local')
    const pathname = parsed.pathname
    const slashIndex = pathname.lastIndexOf('/')
    const directory = slashIndex >= 0 ? pathname.slice(0, slashIndex + 1) : ''
    const filename = slashIndex >= 0 ? pathname.slice(slashIndex + 1) : pathname

    if (!filename) {
      return null
    }

    const prefix = resolveThumbnailPrefix()
    const thumbName = filename.startsWith(prefix) ? filename : `${prefix}${filename}`
    parsed.pathname = `${directory}${thumbName}`

    if (isAbsolute) {
      return parsed.toString()
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

const buildPublicObjectURL = (filename: string): string | null => {
  const origin = resolveMediaPublicOrigin()
  if (!origin) {
    return null
  }

  return `${origin}/${encodeURIComponent(filename)}`
}

const extractPayloadFileRouteFilename = (value: string): string | null => {
  const raw = normalizeString(value)
  if (!raw) {
    return null
  }

  try {
    const parsed = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(raw, 'https://payload.local')
    const pathMatch = parsed.pathname.match(/\/api\/[^/]+\/file\/([^/]+)$/)
    if (!pathMatch?.[1]) {
      return null
    }

    return decodeURIComponent(pathMatch[1])
  } catch {
    return null
  }
}

const buildThumbnailFilename = (filename: string): string => {
  const prefix = resolveThumbnailPrefix()
  return filename.startsWith(prefix) ? filename : `${prefix}${filename}`
}

const pickExistingThumbnailURL = (data: Record<string, unknown>): string | null => {
  const candidates = [data.thumbnailURL, data.thumbnail_u_r_l, data.thumbnailUrl]
  for (const candidate of candidates) {
    const value = normalizeString(candidate)
    if (value) {
      return value
    }
  }

  return null
}

const resolveThumbnailURL = (data: Record<string, unknown>): string | null => {
  const existingThumbnailURL = pickExistingThumbnailURL(data)

  const sourceURL = normalizeString(data.url)
  if (!sourceURL) {
    return existingThumbnailURL
  }

  if (!isImageLikeResource(data)) {
    return existingThumbnailURL ?? sourceURL
  }

  if (existingThumbnailURL) {
    return existingThumbnailURL
  }

  const payloadRouteFilename = extractPayloadFileRouteFilename(sourceURL)
  if (payloadRouteFilename) {
    const directObjectURL = buildPublicObjectURL(buildThumbnailFilename(payloadRouteFilename))
    if (directObjectURL) {
      return directObjectURL
    }
  }

  return buildThumbnailURLWithFilenamePrefix(sourceURL) ?? sourceURL
}

const buildCloudflareResizeURL = (sourceURL: string): string | null => {
  const publicURL = mapURLToPublicOrigin(sourceURL)
  const origin = resolveMediaPublicOrigin()
  if (!publicURL || !origin) {
    return null
  }

  const opts = resolveThumbnailResizeOptions()
  return `${origin}/cdn-cgi/image/${opts}/${encodeURI(publicURL)}`
}

const extractFilenameFromURL = (value: string): string | null => {
  const raw = normalizeString(value)
  if (!raw) {
    return null
  }

  try {
    const parsed = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(raw, 'https://payload.local')
    const pathname = parsed.pathname
    const slashIndex = pathname.lastIndexOf('/')
    const filename = slashIndex >= 0 ? pathname.slice(slashIndex + 1) : pathname
    return filename || null
  } catch {
    return null
  }
}

const resolveThumbnailObjectKey = (data: Record<string, unknown>): string | null => {
  const filename = normalizeString(data.filename) || extractFilenameFromURL(normalizeString(data.url) || '')
  if (!filename) {
    return null
  }

  return buildThumbnailFilename(filename)
}

type BeforeChangeHook = NonNullable<NonNullable<CollectionConfig['hooks']>['beforeChange']>[number]
type AfterReadHook = NonNullable<NonNullable<CollectionConfig['hooks']>['afterRead']>[number]
type AfterChangeHook = NonNullable<NonNullable<CollectionConfig['hooks']>['afterChange']>[number]

const setThumbnailURLBeforeChange: BeforeChangeHook = ({ data }) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const mutableData = data as Record<string, unknown>
  const thumbnailURL = resolveThumbnailURL(mutableData)
  if (thumbnailURL) {
    mutableData.thumbnailURL = thumbnailURL
  }

  return data
}

const setThumbnailURLAfterRead: AfterReadHook = ({ doc }) => {
  if (!doc || typeof doc !== 'object') {
    return doc
  }

  const mutableDoc = doc as Record<string, unknown>
  const thumbnailURL = resolveThumbnailURL(mutableDoc)
  if (thumbnailURL) {
    mutableDoc.thumbnailURL = thumbnailURL
  }

  return doc
}

const generateThumbnailAfterChange: AfterChangeHook = async ({ doc }) => {
  if (!doc || typeof doc !== 'object') {
    return doc
  }

  const mutableDoc = doc as Record<string, unknown>
  if (!isImageLikeResource(mutableDoc)) {
    return doc
  }

  const sourceURL = normalizeString(mutableDoc.url)
  const thumbnailURL = resolveThumbnailURL(mutableDoc)
  if (!sourceURL || !thumbnailURL || sourceURL === thumbnailURL) {
    return doc
  }

  const thumbnailObjectKey = resolveThumbnailObjectKey(mutableDoc)
  const resizeURL = buildCloudflareResizeURL(sourceURL)
  const bucket = getRuntimeR2Bucket()
  if (!thumbnailObjectKey || !resizeURL || !bucket) {
    return doc
  }

  try {
    const response = await fetch(resizeURL)
    if (!response.ok) {
      console.warn(
        `[media-thumbnail] Failed to fetch resized image: status=${response.status}, url=${resizeURL}`,
      )
      return doc
    }

    const contentType =
      normalizeString(response.headers.get('content-type')) ||
      normalizeString(mutableDoc.mimeType) ||
      normalizeString(mutableDoc.mime_type) ||
      normalizeString(mutableDoc.mime) ||
      undefined

    const body = await response.arrayBuffer()
    await bucket.put(
      thumbnailObjectKey,
      body,
      contentType ? { httpMetadata: { contentType } } : undefined,
    )
  } catch (error) {
    console.warn(
      `[media-thumbnail] Failed to write thumbnail object: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  return doc
}

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [setThumbnailURLBeforeChange],
    afterRead: [setThumbnailURLAfterRead],
    afterChange: [generateThumbnailAfterChange],
  },
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
