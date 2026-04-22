import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import ProductionDetail from '@/components/blocks/production-detail'
import { getProductionRouteContext } from '@/frontend/server/get-frontend-route-context'
import { createAbsoluteURL, stripHTML, truncateText } from '@/frontend/server/seo'
import type { ProductionDetailData } from '@/frontend/types'

type ProductionPageProps = {
  params: Promise<{ id: string }>
}

const resolveDescription = (production: ProductionDetailData): string => {
  const seoDescription = production.seoDescription?.trim()
  if (seoDescription) {
    return truncateText(seoDescription, 160)
  }

  return truncateText(stripHTML(production.content || ''), 160)
}

const resolveHost = async (): Promise<string | null> => {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
}

export async function generateMetadata({ params }: ProductionPageProps): Promise<Metadata> {
  const { id } = await params
  const host = await resolveHost()
  const context = await getProductionRouteContext(host, id)
  const production = context.productionData?.production

  if (!production) {
    return {
      title: 'Product Not Found | Kitchen Utensils',
    }
  }

  const routeIndex = production.slug || String(production.id)
  const canonical = createAbsoluteURL(`/production/${routeIndex}`, host)
  const title = production.seoTitle?.trim() || production.name
  const description = resolveDescription(production)
  const keywords = (production.keywords || []).filter((keyword) => typeof keyword === 'string' && keyword.trim())
  const imageURL = production.picture?.[0]?.url

  return {
    title,
    description: description || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: description || undefined,
      images: imageURL ? [imageURL] : undefined,
      type: 'article',
      url: canonical,
    },
    twitter: {
      card: imageURL ? 'summary_large_image' : 'summary',
      title,
      description: description || undefined,
      images: imageURL ? [imageURL] : undefined,
    },
  }
}

export default async function ProductionPage({ params }: ProductionPageProps) {
  const { id } = await params
  const host = await resolveHost()
  const context = await getProductionRouteContext(host, id)

  if (!context.productionData?.production) {
    notFound()
  }

  const production = context.productionData.production
  const preferredRouteIndex = production.slug || String(production.id)
  if (id !== preferredRouteIndex) {
    redirect(`/production/${preferredRouteIndex}`)
  }

  return (
    <>
      <Navbar categories={context.categories} siteVariant={context.siteVariant} />
      <ProductionDetail data={context.productionData} />
      <Contact contactInformation={context.contactInformation} />
      <Footer siteVariant={context.siteVariant} />
    </>
  )
}
