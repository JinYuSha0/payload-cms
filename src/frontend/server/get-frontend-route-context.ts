import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Category as PayloadCategory, Media, Production as PayloadProduction } from '@/payload-types'
import type { Category, CategoryTree, LeafCategory, Picture, Production } from '@/type'
import type {
  CategoryPageData,
  ContactInformation,
  FrontendRouteContext,
  ProductionDetailData,
  ProductionPageData,
  SiteVariant,
} from '@/frontend/types'

type CategoryDoc = PayloadCategory & {
  documentId?: string
}

type ProductionDoc = PayloadProduction & {
  documentId?: string
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

const resolveLocalizedString = (value: unknown): string => {
  const direct = asNonEmptyString(value)
  if (direct) {
    return direct
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  const localized = value as Record<string, unknown>
  return (
    asNonEmptyString(localized.en) ||
    asNonEmptyString(localized.zh) ||
    Object.values(localized).map(asNonEmptyString).find(Boolean) ||
    ''
  )
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => asNonEmptyString(item))
      .filter((item): item is string => Boolean(item))
  }

  const single = asNonEmptyString(value)
  return single ? [single] : []
}

const resolveLocalizedStringArray = (value: unknown): string[] => {
  const direct = normalizeStringArray(value)
  if (direct.length > 0) {
    return direct
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const localized = value as Record<string, unknown>
  const prioritized = [localized.en, localized.zh, ...Object.values(localized)]

  for (const candidate of prioritized) {
    const parsed = normalizeStringArray(candidate)
    if (parsed.length > 0) {
      return parsed
    }
  }

  return []
}

const getRelationshipId = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const relation = value as { id?: unknown; value?: unknown }
  if (typeof relation.id === 'number') {
    return relation.id
  }

  if (typeof relation.value === 'number') {
    return relation.value
  }

  if (relation.value && typeof relation.value === 'object') {
    const nested = relation.value as { id?: unknown }
    if (typeof nested.id === 'number') {
      return nested.id
    }
  }

  return null
}

const getDocumentId = (doc: { id: number; documentId?: unknown }): string => {
  return asNonEmptyString(doc.documentId) || String(doc.id)
}

const getCategoryRouteIndex = (category: {
  id: number
  documentId?: unknown
  slug?: unknown
}): string => {
  return asNonEmptyString(category.slug) || getDocumentId(category)
}

const getProductionRouteIndex = (production: {
  id: number
  documentId?: unknown
  slug?: unknown
}): string => {
  return asNonEmptyString(production.slug) || String(production.id)
}

const toPicture = (mediaValue: unknown): Picture | null => {
  if (!mediaValue || typeof mediaValue !== 'object') {
    return null
  }

  const media = mediaValue as Media & { documentId?: string }
  const fullURL = asNonEmptyString(media.url)
  const thumbnailURL = asNonEmptyString(media.thumbnailURL) || fullURL
  const displayURL = fullURL || thumbnailURL

  if (!displayURL) {
    return null
  }

  return {
    id: media.id,
    documentId: getDocumentId({ id: media.id, documentId: (media as { documentId?: unknown }).documentId }),
    name: asNonEmptyString(media.filename) || `media-${media.id}`,
    alternativeText: asNonEmptyString(media.alt),
    caption: asNonEmptyString(media.alt),
    width: media.width || undefined,
    height: media.height || undefined,
    url: displayURL,
    formats: {
      small: {
        url: displayURL,
        width: media.width || undefined,
        height: media.height || undefined,
      },
      thumbnail: {
        url: displayURL,
        width: media.width || undefined,
        height: media.height || undefined,
      },
    },
  }
}

const toLeafCategory = (categoryValue: unknown, counts: Map<number, number>): LeafCategory | undefined => {
  if (!categoryValue || typeof categoryValue !== 'object') {
    return undefined
  }

  const category = categoryValue as CategoryDoc
  return {
    id: category.id,
    documentId: getDocumentId(category),
    name: resolveLocalizedString(category.name),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    publishedAt: category.updatedAt,
    sortOrder: category.sortOrder || 0,
    productionCount: counts.get(category.id) || 0,
  }
}

const toCategory = (category: CategoryDoc, counts: Map<number, number>): Category => {
  return {
    id: category.id,
    documentId: getDocumentId(category),
    slug: asNonEmptyString(category.slug) || undefined,
    routeIndex: getCategoryRouteIndex(category),
    name: resolveLocalizedString(category.name),
    seoTitle: resolveLocalizedString(category.seoTitle) || undefined,
    seoDescription: resolveLocalizedString(category.seoDescription) || undefined,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    publishedAt: category.updatedAt,
    sortOrder: category.sortOrder || 0,
    picture: toPicture(category.picture) || undefined,
    productionCount: counts.get(category.id) || 0,
  }
}

const lexicalToHTML = (content: unknown): string => {
  if (typeof content === 'string') {
    return content
  }

  if (!content || typeof content !== 'object') {
    return ''
  }

  try {
    return convertLexicalToHTML({
      data: content as Parameters<typeof convertLexicalToHTML>[0]['data'],
      disableContainer: true,
    })
  } catch {
    return ''
  }
}

const toProduction = (
  production: ProductionDoc,
  counts: Map<number, number>,
  categoryById: Map<number, CategoryDoc>,
): Production => {
  const pictures = (Array.isArray(production.picture) ? production.picture : [])
    .map((picture) => toPicture(picture))
    .filter((picture): picture is Picture => picture !== null)

  const leafId = getRelationshipId(production.leaf_category)
  const leafCategory = leafId ? categoryById.get(leafId) : null

  return {
    id: production.id,
    documentId: getDocumentId(production),
    slug: asNonEmptyString(production.slug) || undefined,
    routeIndex: getProductionRouteIndex(production),
    createdAt: production.createdAt,
    updatedAt: production.updatedAt,
    publishedAt: production.updatedAt || production.createdAt,
    locale: 'en',
    name: resolveLocalizedString(production.name),
    intro: resolveLocalizedString(production.intro) || undefined,
    keywords: resolveLocalizedStringArray(production.keywords),
    seoTitle: resolveLocalizedString(production.seoTitle) || undefined,
    seoDescription: resolveLocalizedString(production.seoDescription) || undefined,
    content: lexicalToHTML(production.content),
    sortOrder: production.sortOrder || 0,
    leaf_category: toLeafCategory(leafCategory, counts),
    picture: pictures,
  }
}

const bySortOrder = <T extends { sortOrder?: number | null; name?: string }>(a: T, b: T): number => {
  const sortA = a.sortOrder || 0
  const sortB = b.sortOrder || 0
  if (sortA !== sortB) {
    return sortB - sortA
  }
  return (a.name || '').localeCompare(b.name || '')
}

const getPublishedTimestamp = <T extends { publishedAt?: string; updatedAt?: string; createdAt?: string }>(
  value: T,
): number => {
  const timestamp = new Date(value.publishedAt || value.updatedAt || value.createdAt || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

const byProductionOrder = <
  T extends {
    sortOrder?: number | null
    publishedAt?: string
    updatedAt?: string
    createdAt?: string
    name?: string
  },
>(
  a: T,
  b: T,
): number => {
  const sortA = a.sortOrder || 0
  const sortB = b.sortOrder || 0
  if (sortA !== sortB) {
    return sortB - sortA
  }

  const publishedA = getPublishedTimestamp(a)
  const publishedB = getPublishedTimestamp(b)
  if (publishedA !== publishedB) {
    return publishedB - publishedA
  }

  return (a.name || '').localeCompare(b.name || '')
}

const getSiteVariant = (host: string | null | undefined): SiteVariant => {
  const normalized = (host || '').toLowerCase()
  if (normalized.includes('icookingtech')) {
    return 'icookingtech'
  }

  return 'xinzhuolian'
}

const computeProductionCounts = (
  categories: CategoryDoc[],
  productions: ProductionDoc[],
  childrenByParent: Map<number, number[]>,
): Map<number, number> => {
  const directCounts = new Map<number, number>()

  for (const production of productions) {
    const leafId = getRelationshipId(production.leaf_category)
    if (!leafId) {
      continue
    }
    directCounts.set(leafId, (directCounts.get(leafId) || 0) + 1)
  }

  const totalCounts = new Map<number, number>()

  const countWithChildren = (categoryId: number): number => {
    const cached = totalCounts.get(categoryId)
    if (cached != null) {
      return cached
    }

    const own = directCounts.get(categoryId) || 0
    const children = childrenByParent.get(categoryId) || []
    const total = own + children.reduce((sum, childId) => sum + countWithChildren(childId), 0)

    totalCounts.set(categoryId, total)
    return total
  }

  for (const category of categories) {
    countWithChildren(category.id)
  }

  return totalCounts
}

const findByRouteId = <T extends { id: number; documentId?: unknown }>(docs: T[], routeId: string): T | null => {
  const exact = docs.find((doc) => getDocumentId(doc) === routeId)
  if (exact) {
    return exact
  }

  const numeric = Number(routeId)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return docs.find((doc) => doc.id === numeric) || null
}

const findCategoryByRouteId = (categories: CategoryDoc[], routeId: string): CategoryDoc | null => {
  const bySlug = categories.find((category) => asNonEmptyString(category.slug) === routeId)
  if (bySlug) {
    return bySlug
  }

  return findByRouteId(categories, routeId)
}

const findProductionByRouteId = (productions: Production[], routeId: string): Production | null => {
  const bySlug = productions.find((production) => asNonEmptyString(production.slug) === routeId)
  if (bySlug) {
    return bySlug
  }

  const byDocumentId = productions.find((production) => production.documentId === routeId)
  if (byDocumentId) {
    return byDocumentId
  }

  const numeric = Number(routeId)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return productions.find((production) => production.id === numeric) || null
}

const collectDescendantIDs = (rootId: number, childrenByParent: Map<number, number[]>): Set<number> => {
  const ids = new Set<number>()
  const stack = [rootId]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || ids.has(current)) {
      continue
    }

    ids.add(current)

    for (const childId of childrenByParent.get(current) || []) {
      stack.push(childId)
    }
  }

  return ids
}

const buildCategoryChain = (categoryId: number, categoryById: Map<number, CategoryDoc>): CategoryDoc[] => {
  const chain: CategoryDoc[] = []
  const seen = new Set<number>()

  let current: CategoryDoc | undefined = categoryById.get(categoryId)

  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    chain.unshift(current)

    const parentId = getRelationshipId(current.category)
    current = parentId ? categoryById.get(parentId) : undefined
  }

  return chain
}

const toDetailProduction = (
  production: Production,
  categoryChain: CategoryDoc[],
): ProductionDetailData => {
  return {
    id: production.id,
    documentId: production.documentId,
    slug: production.slug || undefined,
    name: production.name,
    intro: production.intro || undefined,
    keywords: Array.isArray(production.keywords) ? production.keywords : [],
    seoTitle: production.seoTitle || undefined,
    seoDescription: production.seoDescription || undefined,
    content: production.content || '',
    picture: (production.picture || []).map((picture) => ({
      id: picture.id,
      url: picture.url,
      alternativeText: picture.alternativeText || undefined,
      caption: picture.caption || undefined,
    })),
    categories: categoryChain.map((category) => ({
      id: category.id,
      documentId: getDocumentId(category),
      routeIndex: getCategoryRouteIndex(category),
      name: resolveLocalizedString(category.name),
    })),
    createdAt: production.createdAt,
    updatedAt: production.updatedAt,
    publishedAt: production.publishedAt,
  }
}

const buildCategoryPageData = (
  routeId: string,
  categories: CategoryDoc[],
  productions: Production[],
  counts: Map<number, number>,
  childrenByParent: Map<number, number[]>,
  categoryById: Map<number, CategoryDoc>,
): CategoryPageData | null => {
  const categoryDoc = findCategoryByRouteId(categories, routeId)
  if (!categoryDoc) {
    return null
  }

  const descendants = collectDescendantIDs(categoryDoc.id, childrenByParent)
  const filteredProductions = productions
    .filter((production) => {
      const leafId = production.leaf_category?.id
      return typeof leafId === 'number' ? descendants.has(leafId) : false
    })
    .sort(byProductionOrder)

  const children = (childrenByParent.get(categoryDoc.id) || [])
    .map((childId) => categoryById.get(childId))
    .filter((child): child is CategoryDoc => Boolean(child))
    .sort(bySortOrder)

  const chain = buildCategoryChain(categoryDoc.id, categoryById)

  const categoryTree: CategoryTree = {
    category: toCategory(categoryDoc, counts),
    children: children.map((child) => toCategory(child, counts)),
  }

  const parentCategory = chain.slice(0, -1).map((category) => toCategory(category, counts))

  return {
    productions: filteredProductions,
    pagination: {
      page: 1,
      pageSize: filteredProductions.length,
      pageCount: filteredProductions.length > 0 ? 1 : 0,
      total: filteredProductions.length,
    },
    categoryTree,
    parentCategory,
  }
}

const buildProductionPageData = (
  routeId: string,
  productions: Production[],
  categoryById: Map<number, CategoryDoc>,
): ProductionPageData => {
  const production = findProductionByRouteId(productions, routeId)
  if (!production) {
    return {
      production: null,
      recommendedProductions: [],
      error: 'Product not found',
    }
  }

  const leafId = production.leaf_category?.id
  const categoryChain = typeof leafId === 'number' ? buildCategoryChain(leafId, categoryById) : []

  const recommendedProductions = productions
    .filter((item) => item.documentId !== production.documentId)
    .filter((item) => {
      const itemLeafId = item.leaf_category?.id
      return typeof leafId === 'number' && itemLeafId === leafId
    })
    .slice(0, 8)

  return {
    production: toDetailProduction(production, categoryChain),
    recommendedProductions,
  }
}

type CachedFrontendBaseData = {
  categories: CategoryDoc[]
  productions: Production[]
  rootCategories: FrontendRouteContext['categories']
  contactInformation: ContactInformation
  countsEntries: Array<[number, number]>
  childrenByParentEntries: Array<[number, number[]]>
}

const getCachedFrontendBaseData = unstable_cache(
  async (): Promise<CachedFrontendBaseData> => {
    const payload = await getPayload({ config: configPromise })
    const locale = 'en' as const

    const [categoriesRes, productionsRes, contactInformationRes] = await Promise.all([
      payload.find({
        collection: 'categories',
        pagination: false,
        depth: 1,
        where: PUBLISHED_ONLY_WHERE,
        select: {
          documentId: true,
          slug: true,
          name: true,
          seoTitle: true,
          seoDescription: true,
          category: true,
          picture: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        draft: false,
        locale,
        fallbackLocale: locale,
        sort: '-sortOrder',
      }),
      payload.find({
        collection: 'productions',
        pagination: false,
        depth: 1,
        where: PUBLISHED_ONLY_WHERE,
        select: {
          documentId: true,
          slug: true,
          name: true,
          intro: true,
          keywords: true,
          seoTitle: true,
          seoDescription: true,
          picture: true,
          content: true,
          leaf_category: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        draft: false,
        locale,
        fallbackLocale: locale,
        sort: ['-sortOrder', '-updatedAt'],
      }),
      payload.findGlobal({
        slug: 'contact-information',
        select: {
          phone: true,
          email: true,
          address: true,
        },
        draft: false,
        locale,
        fallbackLocale: locale,
      }),
    ])

    const categories = (categoriesRes.docs || []) as CategoryDoc[]
    const productionDocs = (productionsRes.docs || []) as ProductionDoc[]

    const categoryById = new Map<number, CategoryDoc>()
    const childrenByParent = new Map<number, number[]>()

    for (const category of categories) {
      categoryById.set(category.id, category)
    }

    for (const category of categories) {
      const parentId = getRelationshipId(category.category)
      if (!parentId) {
        continue
      }
      const existing = childrenByParent.get(parentId) || []
      existing.push(category.id)
      childrenByParent.set(parentId, existing)
    }

    const counts = computeProductionCounts(categories, productionDocs, childrenByParent)

    const productions = productionDocs
      .map((production) => toProduction(production, counts, categoryById))
      .sort(byProductionOrder)

    const rootCategories = categories
      .filter((category) => getRelationshipId(category.category) == null)
      .sort(bySortOrder)
      .map((category) => ({
        documentId: getDocumentId(category),
        slug: asNonEmptyString(category.slug) || undefined,
        routeIndex: getCategoryRouteIndex(category),
        name: resolveLocalizedString(category.name),
        children: (childrenByParent.get(category.id) || [])
          .map((childId) => categoryById.get(childId))
          .filter((child): child is CategoryDoc => Boolean(child))
          .sort(bySortOrder)
          .map((child) => ({
            documentId: getDocumentId(child),
            slug: asNonEmptyString(child.slug) || undefined,
            routeIndex: getCategoryRouteIndex(child),
            name: resolveLocalizedString(child.name),
          })),
      }))

    const contactGlobal = contactInformationRes as unknown as Record<string, unknown>
    const contactInformation: ContactInformation = {
      phone: resolveLocalizedString(contactGlobal.phone),
      email: resolveLocalizedString(contactGlobal.email),
      address: resolveLocalizedString(contactGlobal.address),
    }

    return {
      categories,
      productions,
      rootCategories,
      contactInformation,
      countsEntries: [...counts.entries()],
      childrenByParentEntries: [...childrenByParent.entries()].map(([parentId, childIds]) => [parentId, [...childIds]]),
    }
  },
  ['frontend-route-context-base-v2'],
  { revalidate: 60 },
)

const buildBaseContext = async (
  host: string | null | undefined,
): Promise<{
  context: Omit<FrontendRouteContext, 'homeData' | 'categoryData' | 'productionData'>
  categories: CategoryDoc[]
  productions: Production[]
  counts: Map<number, number>
  childrenByParent: Map<number, number[]>
  categoryById: Map<number, CategoryDoc>
}> => {
  const cached = await getCachedFrontendBaseData()
  const categories = cached.categories
  const productions = cached.productions
  const counts = new Map<number, number>(cached.countsEntries)
  const childrenByParent = new Map<number, number[]>(
    cached.childrenByParentEntries.map(([parentId, childIds]) => [parentId, [...childIds]]),
  )
  const categoryById = new Map<number, CategoryDoc>(categories.map((category) => [category.id, category]))

  return {
    context: {
      siteVariant: getSiteVariant(host),
      categories: cached.rootCategories,
      contactInformation: cached.contactInformation,
    },
    categories,
    productions,
    counts,
    childrenByParent,
    categoryById,
  }
}

export const getHomeRouteContext = async (host: string | null | undefined): Promise<FrontendRouteContext> => {
  const { context, productions } = await buildBaseContext(host)

  return {
    ...context,
    homeData: {
      products: productions.slice(0, 12),
    },
    categoryData: null,
    productionData: null,
  }
}

export const getCategoryRouteContext = async (
  host: string | null | undefined,
  routeId: string,
): Promise<FrontendRouteContext> => {
  const { context, categories, productions, counts, childrenByParent, categoryById } =
    await buildBaseContext(host)

  return {
    ...context,
    homeData: null,
    categoryData: buildCategoryPageData(
      routeId,
      categories,
      productions,
      counts,
      childrenByParent,
      categoryById,
    ),
    productionData: null,
  }
}

export const getProductionRouteContext = async (
  host: string | null | undefined,
  routeId: string,
): Promise<FrontendRouteContext> => {
  const { context, productions, categoryById } = await buildBaseContext(host)

  return {
    ...context,
    homeData: null,
    categoryData: null,
    productionData: buildProductionPageData(routeId, productions, categoryById),
  }
}
