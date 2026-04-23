import type { CategoryTree, Production, Category, Picture } from '@/type'

export type SiteVariant = 'xinzhuolian' | 'icookingtech'

export type NavCategory = {
  documentId: string
  slug?: string
  routeIndex: string
  name: string
  children: Array<{
    documentId: string
    slug?: string
    routeIndex: string
    name: string
  }>
}

export type ContactInformation = {
  phone: string
  email: string
  address: string
} | null

export type HomePageData = {
  products: Production[]
  news: NewsItem[]
}

export type NewsItem = {
  id: number
  documentId: string
  slug?: string
  routeIndex: string
  title: string
  picture?: Picture
  content: string
  excerpt: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  createdAt?: string
  updatedAt?: string
}

export type NewsListPageData = {
  news: NewsItem[]
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}

export type ProductionsListPageData = {
  productions: Production[]
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}

export type NewsPageData = {
  news: NewsItem | null
  relatedNews: NewsItem[]
  error?: string
}

export type CategoryPageData = {
  productions: Production[]
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
  categoryTree: CategoryTree
  parentCategory: Category[]
}

export type ProductionDetailCategory = {
  id: number
  documentId: string
  routeIndex: string
  name: string
}

export type ProductionDetailPicture = {
  id: number
  url: string
  alternativeText?: string
  caption?: string
}

export type ProductionDetailData = {
  id: number
  documentId: string
  slug?: string
  name: string
  intro?: string
  keywords?: string[]
  seoTitle?: string
  seoDescription?: string
  content: string
  picture?: ProductionDetailPicture[]
  categories?: ProductionDetailCategory[]
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type ProductionPageData = {
  production: ProductionDetailData | null
  recommendedProductions: Production[]
  error?: string
}

export type FrontendRouteContext = {
  siteVariant: SiteVariant
  categories: NavCategory[]
  contactInformation: ContactInformation
  homeData: HomePageData | null
  categoryData: CategoryPageData | null
  productionData: ProductionPageData | null
  productionsListData: ProductionsListPageData | null
  newsListData: NewsListPageData | null
  newsData: NewsPageData | null
}
