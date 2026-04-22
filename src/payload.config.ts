import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Productions } from './collections/Productions'
import { Contacts } from './collections/Contacts'
import { Subscribers } from './collections/Subscribers'
import { ContactInformation } from './globals/ContactInformation'
import { ReceiveEmail } from './globals/ReceiveEmail'
import { setRuntimeAI, setRuntimeR2Bucket } from './lib/runtime-bindings'

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const encodePathSegment = (value: string): string => encodeURIComponent(value)

const buildPrefixedObjectPath = (filename: string, prefix?: string): string => {
  const normalizedPrefix = normalizeString(prefix)?.replace(/^\/+|\/+$/g, '')
  const encodedFilename = encodePathSegment(filename)

  if (!normalizedPrefix) {
    return encodedFilename
  }

  const encodedPrefix = normalizedPrefix
    .split('/')
    .filter(Boolean)
    .map(encodePathSegment)
    .join('/')

  return encodedPrefix ? `${encodedPrefix}/${encodedFilename}` : encodedFilename
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)
const mediaPublicOrigin = normalizeString(process.env.MEDIA_PUBLIC_ORIGIN)?.replace(/\/+$/, '')
const mediaStorageConfig = mediaPublicOrigin
  ? {
      generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
        `${mediaPublicOrigin}/${buildPrefixedObjectPath(filename, prefix)}`,
    }
  : true

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build'
const isCloudflareWorkerRuntime = 'WebSocketPair' in globalThis

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

const cloudflare =
  isCLI || isNextBuild || (!isProduction && !isCloudflareWorkerRuntime)
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

setRuntimeR2Bucket(cloudflare.env.R2)
setRuntimeAI((cloudflare.env as CloudflareEnv & { AI?: unknown }).AI)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Productions, Contacts, Subscribers],
  globals: [ContactInformation, ReceiveEmail],
  localization: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: mediaStorageConfig },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction && !isNextBuild,
      } satisfies GetPlatformProxyOptions),
  )
}
