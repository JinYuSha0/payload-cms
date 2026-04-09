import configPromise from '@payload-config'
import { getPayload } from 'payload'

const EMAIL_MAX_LENGTH = 128
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json().catch((): null => null)) as { email?: string } | null
  const email = normalizeString(body?.email)?.toLowerCase()

  if (!email) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'subscribers',
    where: {
      email: {
        equals: email,
      },
    },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'subscribers',
      data: {
        email,
      },
    })
  }

  return Response.json({ ok: true })
}
