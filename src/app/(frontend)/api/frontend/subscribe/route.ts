import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json().catch((): null => null)) as { email?: string } | null

  if (!body || !body.email) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'receive-email',
    data: {
      email: body.email,
    },
    draft: true,
  })

  return Response.json({ ok: true })
}
