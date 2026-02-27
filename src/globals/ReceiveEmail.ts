import type { GlobalConfig } from 'payload'

export const ReceiveEmail: GlobalConfig = {
  slug: 'receive-email',
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
    },
  ],
}
