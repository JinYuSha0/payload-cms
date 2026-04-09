import configPromise from '@payload-config'
import { getPayload } from 'payload'

const NAME_MAX_LENGTH = 64
const EMAIL_MAX_LENGTH = 128
const MESSAGE_MAX_LENGTH = 1024
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json().catch((): null => null)) as
    | {
        email?: string
        firstName?: string
        lastName?: string
        message?: string
      }
    | null

  const firstName = normalizeString(body?.firstName)
  const lastName = normalizeString(body?.lastName)
  const email = normalizeString(body?.email)?.toLowerCase()
  const message = normalizeString(body?.message)

  if (!firstName || !lastName || !email || !message) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (firstName.length > NAME_MAX_LENGTH || lastName.length > NAME_MAX_LENGTH) {
    return Response.json({ error: 'Name too long' }, { status: 400 })
  }

  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    return Response.json({ error: 'Message too long' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  await payload.create({
    collection: 'contacts',
    data: {
      firstName,
      lastName,
      email,
      message,
    },
  })

  return Response.json({ ok: true })
}
