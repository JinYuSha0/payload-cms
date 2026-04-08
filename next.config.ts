import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig: any = {
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],
  // Work around incomplete nft tracing under pnpm that can miss Next server internals.
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/next/dist/server/**/*',
      './node_modules/next/dist/client/**/*',
      './node_modules/next/dist/build/**/*',
      './node_modules/next/dist/compiled/**/*',
      './node_modules/next/dist/shared/**/*',
      './node_modules/next/dist/lib/**/*',
      './node_modules/next/package.json',
      './node_modules/.pnpm/next@*/node_modules/next/dist/server/**/*',
      './node_modules/.pnpm/next@*/node_modules/next/dist/client/**/*',
      './node_modules/.pnpm/next@*/node_modules/next/dist/build/**/*',
      './node_modules/.pnpm/next@*/node_modules/next/dist/compiled/**/*',
      './node_modules/.pnpm/next@*/node_modules/next/dist/shared/**/*',
      './node_modules/.pnpm/next@*/node_modules/next/dist/lib/**/*',
      './node_modules/.pnpm/next@*/node_modules/next/package.json',
      './node_modules/@swc/helpers/**/*',
      './node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**/*',
    ],
  },

  // Your Next.js config here
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
