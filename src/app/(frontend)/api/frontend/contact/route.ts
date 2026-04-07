export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json().catch((): null => null)) as
    | {
        email?: string
        firstName?: string
        lastName?: string
        message?: string
      }
    | null

  if (!body || !body.email || !body.message) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
