export interface Small {
  url: string
  width?: number
  height?: number
  [key: string]: unknown
}

export interface Thumbnail {
  url: string
  width?: number
  height?: number
  [key: string]: unknown
}

export interface Formats {
  small?: Small
  thumbnail?: Thumbnail
  [key: string]: unknown
}

export interface Picture {
  id: number
  documentId?: string
  name?: string
  alternativeText?: string | null
  caption?: string | null
  width?: number
  height?: number
  formats?: Formats
  url: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  [key: string]: unknown
}

export interface LeafCategory {
  id: number
  documentId: string
  name: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  locale?: string
  sortOrder?: number
  productionCount?: number
}

export interface Production {
  id: number
  documentId: string
  slug?: string
  routeIndex?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  locale?: string
  name: string
  intro?: string
  keywords?: string[]
  seoTitle?: string
  seoDescription?: string
  content?: string
  sortOrder?: number
  leaf_category?: LeafCategory
  picture?: Picture[]
  categories?: Category[]
  [key: string]: unknown
}

export interface Category {
  id: number
  documentId: string
  slug?: string
  routeIndex?: string
  name: string
  seoTitle?: string
  seoDescription?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  locale?: string
  sortOrder?: number
  picture?: Picture
  productionCount: number
}

export interface CategoryTree {
  category: Category
  children: Category[]
}
