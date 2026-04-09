import type { CollectionConfig } from 'payload'

const authenticatedOnly: CollectionConfig['access'] = {
  create: ({ req }) => Boolean(req.user),
  read: ({ req }) => Boolean(req.user),
  update: ({ req }) => Boolean(req.user),
  delete: ({ req }) => Boolean(req.user),
}

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'createdAt'],
  },
  access: authenticatedOnly,
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
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
  ],
}
