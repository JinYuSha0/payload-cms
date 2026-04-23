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

const extractRichTextText = (value: unknown): string => {
  if (typeof value === 'string') {
    return normalizeString(value)
  }

  const chunks: string[] = []

  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      return
    }

    if (!node || typeof node !== 'object') {
      return
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item)
      }
      return
    }

    for (const [key, child] of Object.entries(node)) {
      if (key === 'text' && typeof child === 'string') {
        const text = normalizeString(child)
        if (text) {
          chunks.push(text)
        }
      } else {
        walk(child)
      }
    }
  }

  walk(value)

  return chunks.join(' ').replace(/\s+/g, ' ').trim()
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

const buildFallbackSEOTitle = (title: string, keywords: string[]): string => {
  const primary = title || keywords[0] || ''
  const suffix = 'Kitchen Utensils News'
  if (!primary) {
    return suffix
  }

  return truncateText(`${primary} | ${suffix}`, 60)
}

const buildFallbackSEODescription = (title: string, content: string, keywords: string[]): string => {
  const pieces = [title, content, keywords.slice(0, 4).join(' / ')].map((item) => normalizeString(item))
  const merged = pieces.filter(Boolean).join('。')
  return truncateText(merged || 'Kitchen utensils news article.', 160)
}

const deriveKeywords = (title: string, content: string): string[] => {
  const source = `${title} ${content}`.toLowerCase()
  const candidates = source
    .split(/[^\p{L}\p{N}]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)

  const unique = new Set<string>()
  for (const item of candidates) {
    if (unique.size >= 8) {
      break
    }

    unique.add(item)
  }

  return [...unique]
}

const generateBlogSEOEndpoint: Endpoint = {
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
    const title = normalizeString(input.title)
    const content = extractRichTextText(input.content)
    const existingKeywords = normalizeKeywords(input.seoKeywords)
    const locale = normalizeString(input.locale) || 'zh'

    if (!title && !content && existingKeywords.length === 0) {
      throw new APIError('请输入标题、内容或关键词后再生成 SEO', 400)
    }

    const model = process.env.WORKERS_AI_SEO_MODEL || DEFAULT_WORKERS_AI_MODEL
    const promptPayload = {
      locale,
      title,
      content: truncateText(content, 2400),
      existingKeywords,
      constraints: {
        slug: 'lowercase, hyphenated, <=96 chars',
        seoTitle: '<=60 chars, no markdown',
        seoDescription: '<=160 chars, no markdown',
        seoKeywords: 'array of short keywords, <=8 items',
      },
    }

    let aiResult: unknown = null
    try {
      aiResult = await ai.run(model, {
        messages: [
          {
            role: 'system',
            content:
              'You are an SEO writer. Return strict JSON only with keys: slug, seoTitle, seoDescription, seoKeywords.',
          },
          {
            role: 'user',
            content: `Generate SEO fields for this news document:\n${JSON.stringify(promptPayload)}`,
          },
        ],
        max_tokens: 400,
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
        typeof maybeDirect.seoDescription === 'string' ||
        maybeDirect.seoKeywords != null
      ) {
        aiJSON = maybeDirect
      }
    }

    if (!aiJSON) {
      const aiText = extractAIText(aiResult)
      aiJSON = parseJSONObjectFromText(aiText)
    }

    const fallbackKeywords = existingKeywords.length > 0 ? existingKeywords : deriveKeywords(title, content)
    const slug =
      normalizeSlug(aiJSON?.slug) ||
      normalizeSlug(title) ||
      normalizeSlug(fallbackKeywords[0]) ||
      `news-${Date.now().toString(36)}`
    const seoTitle =
      truncateText(normalizeString(aiJSON?.seoTitle), 60) ||
      buildFallbackSEOTitle(title, fallbackKeywords)
    const seoDescription =
      truncateText(normalizeString(aiJSON?.seoDescription), 160) ||
      buildFallbackSEODescription(title, content, fallbackKeywords)
    const seoKeywords = normalizeKeywords(aiJSON?.seoKeywords)

    return Response.json({
      slug,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywords.length > 0 ? seoKeywords : fallbackKeywords,
      generatedAt: new Date().toISOString(),
      model,
    })
  },
}

export const Blogs: CollectionConfig = {
  slug: 'blogs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  endpoints: [generateBlogSEOEndpoint],
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'News 主图（单图）',
      },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      name: 'seoAIGenerator',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/BlogSeoAIGeneratorField',
        },
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'SEO URL path（可选；优先用于前台 news URL）',
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
      name: 'seoKeywords',
      type: 'text',
      hasMany: true,
      localized: true,
      admin: {
        description: '建议 3-8 个关键词',
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
