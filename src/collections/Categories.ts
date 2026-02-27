import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'sortOrder', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      unique: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'categories',
      type: 'join',
      collection: 'categories',
      on: 'category',
    },
    {
      name: 'picture',
      type: 'upload',
      relationTo: 'media',
      localized: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'productions',
      type: 'join',
      collection: 'productions',
      on: 'leaf_category',
    },
  ],
}
