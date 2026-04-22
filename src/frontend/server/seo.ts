const DEFAULT_SITE_URL = 'https://www.xinzhuolian.com'

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const stripHTML = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(0, maxLength).trim()
}

export const resolveSiteURL = (host?: string | null): string => {
  const configured =
    asNonEmptyString(process.env.NEXT_PUBLIC_SITE_URL) ||
    asNonEmptyString(process.env.SITE_URL) ||
    asNonEmptyString(process.env.PAYLOAD_PUBLIC_SERVER_URL)

  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  const normalizedHost = asNonEmptyString(host)
  if (normalizedHost) {
    const protocol = normalizedHost.includes('localhost') || normalizedHost.startsWith('127.0.0.1') ? 'http' : 'https'
    return `${protocol}://${normalizedHost}`
  }

  return DEFAULT_SITE_URL
}

export const createAbsoluteURL = (pathname: string, host?: string | null): string => {
  return new URL(pathname, `${resolveSiteURL(host)}/`).toString()
}
