import { APIError, type CollectionConfig } from 'payload'

const getRelationshipID = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const relation = value as { id?: unknown; value?: unknown }
  if (typeof relation.id === 'number' || typeof relation.id === 'string') {
    return relation.id
  }
  if (typeof relation.value === 'number' || typeof relation.value === 'string') {
    return relation.value
  }
  if (relation.value && typeof relation.value === 'object') {
    const nested = relation.value as { id?: unknown }
    if (typeof nested.id === 'number' || typeof nested.id === 'string') {
      return nested.id
    }
  }

  return null
}

const listNonLeafCategoryIDs = async (req: Parameters<NonNullable<CollectionConfig['hooks']>['beforeValidate'][number]>[0]['req']) => {
  const { docs } = await req.payload.find({
    collection: 'categories',
    where: {
      category: {
        exists: true,
      },
    },
    draft: true,
    depth: 0,
    pagination: false,
    req,
  })

  const ids = new Set<number | string>()
  for (const doc of docs) {
    const id = getRelationshipID((doc as { category?: unknown }).category)
    if (id != null) {
      ids.add(id)
    }
  }

  return [...ids]
}

export const Productions: CollectionConfig = {
  slug: 'productions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'leaf_category', 'sortOrder', '_status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        const target = data?.leaf_category ?? originalDoc?.leaf_category
        if (target == null) {
          return data
        }

        const id = getRelationshipID(target)
        if (id == null) {
          throw new APIError('production 的分类只能选择叶分类', 400)
        }

        try {
          await req.payload.findByID({
            collection: 'categories',
            id,
            depth: 0,
            req,
          })
        } catch {
          throw new APIError('production 的分类只能选择叶分类', 400)
        }

        const childCategory = await req.payload.find({
          collection: 'categories',
          where: {
            category: {
              equals: id,
            },
          },
          limit: 1,
          depth: 0,
          draft: true,
          req,
        })

        if (childCategory.totalDocs > 0) {
          throw new APIError('production 的分类只能选择叶分类', 400)
        }

        return data
      },
    ],
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
      name: 'picture',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'leaf_category',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: async ({ req }) => {
        const nonLeafIDs = await listNonLeafCategoryIDs(req)
        if (nonLeafIDs.length === 0) {
          return true
        }

        return {
          id: {
            not_in: nonLeafIDs,
          },
        }
      },
      admin: {
        description: '只能选择叶分类',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
  ],
}
