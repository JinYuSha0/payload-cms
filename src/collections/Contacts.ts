import type { CollectionConfig } from 'payload'

const authenticatedOnly: CollectionConfig['access'] = {
  create: ({ req }) => Boolean(req.user),
  read: ({ req }) => Boolean(req.user),
  update: ({ req }) => Boolean(req.user),
  delete: ({ req }) => Boolean(req.user),
}

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'createdAt'],
  },
  access: authenticatedOnly,
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      maxLength: 64,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      maxLength: 64,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
      validate: (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Email is required'
        }

        if (value.length > 128) {
          return 'Email must be at most 128 characters'
        }

        return true
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 1024,
    },
  ],
}
