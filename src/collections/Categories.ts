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

const buildFallbackSEOTitle = (name: string): string => {
  const primary = normalizeString(name)
  const suffix = 'Kitchen Utensils'
  if (!primary) {
    return suffix
  }

  return truncateText(`${primary} | ${suffix}`, 60)
}

const buildFallbackSEODescription = (name: string): string => {
  const normalizedName = normalizeString(name)
  const base = normalizedName ? `${normalizedName} category overview.` : 'Kitchen utensils category page.'
  return truncateText(base, 160)
}

const generateCategorySEOEndpoint: Endpoint = {
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
    const locale = normalizeString(input.locale) || 'zh'
    const name = normalizeString(input.name)

    if (!name) {
      throw new APIError('请输入分类名称后再生成 SEO', 400)
    }

    const model = process.env.WORKERS_AI_SEO_MODEL || DEFAULT_WORKERS_AI_MODEL
    const promptPayload = {
      locale,
      name,
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
            content: `Generate SEO fields for this category document:\n${JSON.stringify(promptPayload)}`,
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
      normalizeSlug(aiJSON?.slug) || normalizeSlug(name) || `category-${Date.now().toString(36)}`
    const seoTitle =
      truncateText(normalizeString(aiJSON?.seoTitle), 60) || buildFallbackSEOTitle(name)
    const seoDescription =
      truncateText(normalizeString(aiJSON?.seoDescription), 160) || buildFallbackSEODescription(name)

    return Response.json({
      slug,
      seoTitle,
      seoDescription,
      generatedAt: new Date().toISOString(),
      model,
    })
  },
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'category', 'sortOrder', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  endpoints: [generateCategorySEOEndpoint],
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      unique: true,
    },
    {
      name: 'seoAIGenerator',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/CategorySeoAIGeneratorField',
        },
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'SEO URL path（可选；可用于前台 category URL）',
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
