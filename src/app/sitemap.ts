import type { MetadataRoute } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Category, Production } from '@/payload-types'
import { createAbsoluteURL } from '@/frontend/server/seo'

type CategoryDoc = Category & {
  documentId?: string | null
}

type ProductionDoc = Production & {
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

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise })
  const locale = 'en' as const

  const [categoriesRes, productionsRes] = await Promise.allSettled([
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
  ])

  const categories =
    categoriesRes.status === 'fulfilled' ? ((categoriesRes.value.docs || []) as CategoryDoc[]) : []
  const productions =
    productionsRes.status === 'fulfilled' ? ((productionsRes.value.docs || []) as ProductionDoc[]) : []

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: createAbsoluteURL('/'),
      changeFrequency: 'daily',
      priority: 1,
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

  const seen = new Set<string>()

  return [...staticEntries, ...categoryEntries, ...productionEntries]
    .filter((entry) => {
      if (seen.has(entry.url)) {
        return false
      }
      seen.add(entry.url)
      return true
    })
    .sort((a, b) => a.url.localeCompare(b.url))
}
