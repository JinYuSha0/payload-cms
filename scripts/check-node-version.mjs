const [major, minor] = process.versions.node
  .split('.')
  .map((value) => Number.parseInt(value, 10))

const isSupportedMajor = major >= 20 && major <= 22
const isSupportedMinor = major !== 20 || minor >= 9

if (!isSupportedMajor || !isSupportedMinor) {
  console.error(
    `[payload-cms] Unsupported Node.js ${process.versions.node}. ` +
      'Use Node.js 20.9+ or 22.x for Next/OpenNext Cloudflare deploys.',
  )
  process.exit(1)
}
