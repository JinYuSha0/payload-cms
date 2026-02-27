import type { GlobalConfig } from 'payload'

export const ContactInformation: GlobalConfig = {
  slug: 'contact-information',
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'address',
      type: 'textarea',
    },
  ],
}
