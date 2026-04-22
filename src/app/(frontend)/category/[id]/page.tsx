import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import Category from '@/components/blocks/category'
import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import { getCategoryRouteContext } from '@/frontend/server/get-frontend-route-context'
import { createAbsoluteURL, truncateText } from '@/frontend/server/seo'
import type { CategoryPageData } from '@/frontend/types'

type CategoryPageProps = {
  params: Promise<{ id: string }>
}

const resolveDescription = (data: CategoryPageData): string => {
  const category = data.categoryTree.category
  const seoDescription = category.seoDescription?.trim()
  if (seoDescription) {
    return truncateText(seoDescription, 160)
  }

  return truncateText(`${category.name} category with ${category.productionCount} products.`, 160)
}

const resolveHost = async (): Promise<string | null> => {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params
  const host = await resolveHost()
  const context = await getCategoryRouteContext(host, id)
  const data = context.categoryData

  if (!data) {
    return {
      title: 'Category Not Found | Kitchen Utensils',
    }
  }

  const category = data.categoryTree.category
  const routeIndex = category.routeIndex || category.slug || category.documentId
  const canonical = createAbsoluteURL(`/category/${routeIndex}`, host)
  const title = category.seoTitle?.trim() || category.name
  const description = resolveDescription(data)
  const imageURL = category.picture?.url

  return {
    title,
    description: description || undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: description || undefined,
      type: 'website',
      url: canonical,
      images: imageURL ? [{ url: imageURL, alt: category.name }] : undefined,
    },
    twitter: {
      card: imageURL ? 'summary_large_image' : 'summary',
      title,
      description: description || undefined,
      images: imageURL ? [imageURL] : undefined,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params
  const host = await resolveHost()
  const context = await getCategoryRouteContext(host, id)

  if (!context.categoryData) {
    notFound()
  }

  const category = context.categoryData.categoryTree.category
  const preferredRouteIndex = category.routeIndex || category.slug || category.documentId
  if (id !== preferredRouteIndex) {
    redirect(`/category/${preferredRouteIndex}`)
  }

  return (
    <>
      <Navbar categories={context.categories} siteVariant={context.siteVariant} />
      <Category data={context.categoryData} />
      <Contact contactInformation={context.contactInformation} />
      <Footer siteVariant={context.siteVariant} />
    </>
  )
}
