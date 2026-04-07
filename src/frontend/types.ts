import type { CategoryTree, Production, Category } from '@/type'

export type SiteVariant = 'xinzhuolian' | 'icookingtech'

export type NavCategory = {
  documentId: string
  name: string
}

export type ContactInformation = {
  phone: string
  email: string
  address: string
} | null

export type HomePageData = {
  products: Production[]
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
  name: string
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
}
