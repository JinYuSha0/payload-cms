import { APIError, type CollectionConfig, type Endpoint } from 'payload'
import { getRuntimeAI } from '../lib/runtime-bindings'

const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct'

const normalizeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const normalizeSlug = (value: unknown): string => {
  const input = normalizeString(value)
  if (!input) {
    return ''
  }

  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(0, maxLength).trim()
}

const normalizeKeywords = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter(Boolean)
      .slice(0, 12)
  }

  const asString = normalizeString(value)
  if (!asString) {
    return []
  }

  return asString
    .split(/[,\n，；;]+/)
    .map((item) => normalizeString(item))
    .filter(Boolean)
    .slice(0, 12)
}

const extractAIText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  const typed = value as {
    response?: unknown
    output_text?: unknown
    result?: unknown
    content?: unknown
    choices?: Array<{ message?: { content?: unknown } }>
  }

  const directCandidates = [typed.response, typed.output_text, typed.result, typed.content]
  for (const candidate of directCandidates) {
    if (typeof candidate === 'string') {
      return candidate
    }
  }

  const choiceContent = typed.choices?.[0]?.message?.content
  if (typeof choiceContent === 'string') {
    return choiceContent
  }

  return ''
}

const parseJSONObjectFromText = (value: string): Record<string, unknown> | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const normalized = trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  try {
    const parsed = JSON.parse(normalized.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

const buildFallbackSEOTitle = (name: string, keywords: string[]): string => {
  const primary = name || keywords[0] || ''
  const suffix = 'Kitchen Utensils'
  if (!primary) {
    return suffix
  }

  return truncateText(`${primary} | ${suffix}`, 60)
}

const buildFallbackSEODescription = (name: string, intro: string, keywords: string[]): string => {
  const pieces = [name, intro, keywords.slice(0, 4).join(' / ')].map((item) =>
    normalizeString(item),
  )
  const merged = pieces.filter(Boolean).join('。')
  return truncateText(merged || 'Kitchen utensils product page.', 160)
}

const generateProductionSEOEndpoint: Endpoint = {
  path: '/generate-seo',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const ai = getRuntimeAI()
    if (!ai) {
      throw new APIError('Workers AI binding is not configured', 500)
    }

    let body: unknown = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const name = normalizeString(input.name)
    const intro = normalizeString(input.intro)
    const keywords = normalizeKeywords(input.keywords)
    const locale = normalizeString(input.locale) || 'zh'

    if (!name && !intro && keywords.length === 0) {
      throw new APIError('请输入名称、简介或关键词后再生成 SEO', 400)
    }

    const model = process.env.WORKERS_AI_SEO_MODEL || DEFAULT_WORKERS_AI_MODEL
    const promptPayload = {
      locale,
      name,
      intro,
      keywords,
      constraints: {
        slug: 'lowercase, hyphenated, <=96 chars',
        seoTitle: '<=60 chars, no markdown',
        seoDescription: '<=160 chars, no markdown',
      },
    }

    let aiResult: unknown = null
    try {
      aiResult = await ai.run(model, {
        messages: [
          {
            role: 'system',
            content:
              'You are an SEO writer. Return strict JSON only with keys: slug, seoTitle, seoDescription.',
          },
          {
            role: 'user',
            content: `Generate SEO fields for this production document:\n${JSON.stringify(promptPayload)}`,
          },
        ],
        max_tokens: 320,
        temperature: 0.2,
      })
    } catch (error) {
      throw new APIError(
        `Workers AI generate failed: ${error instanceof Error ? error.message : String(error)}`,
        500,
      )
    }

    let aiJSON: Record<string, unknown> | null = null
    if (aiResult && typeof aiResult === 'object' && !Array.isArray(aiResult)) {
      const maybeDirect = aiResult as Record<string, unknown>
      if (
        typeof maybeDirect.slug === 'string' ||
        typeof maybeDirect.seoTitle === 'string' ||
        typeof maybeDirect.seoDescription === 'string'
      ) {
        aiJSON = maybeDirect
      }
    }

    if (!aiJSON) {
      const aiText = extractAIText(aiResult)
      aiJSON = parseJSONObjectFromText(aiText)
    }

    const slug =
      normalizeSlug(aiJSON?.slug) ||
      normalizeSlug(name) ||
      normalizeSlug(keywords[0]) ||
      `production-${Date.now().toString(36)}`
    const seoTitle =
      truncateText(normalizeString(aiJSON?.seoTitle), 60) || buildFallbackSEOTitle(name, keywords)
    const seoDescription =
      truncateText(normalizeString(aiJSON?.seoDescription), 160) ||
      buildFallbackSEODescription(name, intro, keywords)

    return Response.json({
      slug,
      seoTitle,
      seoDescription,
      generatedAt: new Date().toISOString(),
      model,
    })
  },
}

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

const listNonLeafCategoryIDs = async (
  req: Parameters<NonNullable<CollectionConfig['hooks']>['beforeValidate'][number]>[0]['req'],
) => {
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
  endpoints: [generateProductionSEOEndpoint],
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
      name: 'docxImporter',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/ProductionDocxImportField',
        },
      },
    },
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'SEO URL path（可选；优先用于前台产品 URL）',
      },
      validate: (value: unknown) => {
        const normalized = normalizeString(value)
        if (!normalized) {
          return true
        }

        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
          return 'slug 仅支持小写字母、数字和短横线'
        }

        return true
      },
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
      type: 'richText',
      localized: true,
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'keywords',
      type: 'text',
      hasMany: true,
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
    {
      name: 'seoAIGenerator',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/ProductionSeoAIGeneratorField',
        },
      },
    },
    {
      name: 'seoTitle',
      type: 'text',
      localized: true,
      admin: {
        description: '建议 50-60 字符',
      },
      validate: (value: unknown) => {
        const normalized = normalizeString(value)
        if (!normalized) {
          return true
        }

        if (normalized.length > 60) {
          return '建议不超过 60 个字符'
        }

        return true
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      localized: true,
      admin: {
        description: '建议 120-160 字符',
      },
      validate: (value: unknown) => {
        const normalized = normalizeString(value)
        if (!normalized) {
          return true
        }

        if (normalized.length > 160) {
          return '建议不超过 160 个字符'
        }

        return true
      },
    },
    {
      name: 'seoAIGeneratedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'seoAIModel',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
}
