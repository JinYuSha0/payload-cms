import type { MetadataRoute } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Blog, Category, Production } from '@/payload-types'
import { createAbsoluteURL } from '@/frontend/server/seo'

type CategoryDoc = Category & {
  documentId?: string | null
}

type ProductionDoc = Production & {
  documentId?: string | null
}

type NewsDoc = Blog & {
  documentId?: string | null
}

const PUBLISHED_ONLY_WHERE = {
  _status: {
    equals: 'published' as const,
  },
}

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toDateOrNow = (value: string | null | undefined): Date => {
  const timestamp = Date.parse(value || '')
  return Number.isFinite(timestamp) ? new Date(timestamp) : new Date()
}

const getCategoryRouteIndex = (category: {
  id: number
  slug?: string | null
  documentId?: string | null
}): string => {
  return asNonEmptyString(category.slug) || asNonEmptyString(category.documentId) || String(category.id)
}

const getProductionRouteIndex = (production: {
  id: number
  slug?: string | null
}): string => {
  return asNonEmptyString(production.slug) || String(production.id)
}

const getNewsRouteIndex = (news: {
  id: number
  slug?: string | null
}): string => {
  return asNonEmptyString(news.slug) || String(news.id)
}

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise })
  const locale = 'en' as const

  const [categoriesRes, productionsRes, newsRes] = await Promise.allSettled([
    payload.find({
      collection: 'categories',
      pagination: false,
      depth: 0,
      where: PUBLISHED_ONLY_WHERE,
      select: {
        documentId: true,
        slug: true,
        updatedAt: true,
      },
      draft: false,
      locale,
      fallbackLocale: locale,
    }),
    payload.find({
      collection: 'productions',
      pagination: false,
      depth: 0,
      where: PUBLISHED_ONLY_WHERE,
      select: {
        slug: true,
        updatedAt: true,
      },
      draft: false,
      locale,
      fallbackLocale: locale,
    }),
    payload.find({
      collection: 'blogs',
      pagination: false,
      depth: 0,
      where: PUBLISHED_ONLY_WHERE,
      select: {
        slug: true,
        updatedAt: true,
      },
      draft: false,
      locale,
      fallbackLocale: locale,
    }),
  ])

  const categories =
    categoriesRes.status === 'fulfilled' ? ((categoriesRes.value.docs || []) as CategoryDoc[]) : []
  const productions =
    productionsRes.status === 'fulfilled' ? ((productionsRes.value.docs || []) as ProductionDoc[]) : []
  const newsItems = newsRes.status === 'fulfilled' ? ((newsRes.value.docs || []) as NewsDoc[]) : []

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: createAbsoluteURL('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: createAbsoluteURL('/productions'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: createAbsoluteURL('/news'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: createAbsoluteURL(`/category/${getCategoryRouteIndex(category)}`),
    lastModified: toDateOrNow(category.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const productionEntries: MetadataRoute.Sitemap = productions.map((production) => ({
    url: createAbsoluteURL(`/production/${getProductionRouteIndex(production)}`),
    lastModified: toDateOrNow(production.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const newsEntries: MetadataRoute.Sitemap = newsItems.map((news) => ({
    url: createAbsoluteURL(`/news/${getNewsRouteIndex(news)}`),
    lastModified: toDateOrNow(news.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const seen = new Set<string>()

  return [...staticEntries, ...categoryEntries, ...productionEntries, ...newsEntries]
    .filter((entry) => {
      if (seen.has(entry.url)) {
        return false
      }
      seen.add(entry.url)
      return true
    })
    .sort((a, b) => a.url.localeCompare(b.url))
}
