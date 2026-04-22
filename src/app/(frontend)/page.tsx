import { headers } from 'next/headers'
import type { Metadata } from 'next'

import Articles from '@/components/blocks/articles'
import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import GalleryBlock from '@/components/blocks/gallery'
import Hero from '@/components/blocks/hero'
import Navbar from '@/components/blocks/navbar'
import Section01 from '@/components/blocks/section-01'
import { getHomeRouteContext } from '@/frontend/server/get-frontend-route-context'
import { createAbsoluteURL } from '@/frontend/server/seo'

const resolveHost = async (): Promise<string | null> => {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await resolveHost()
  const title = 'Premium Kitchen Utensils Manufacturer'
  const description =
    'Professional-grade kitchen utensils manufactured to exacting standards for restaurants, hotels, and retailers worldwide.'
  const canonical = createAbsoluteURL('/', host)

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function HomePage() {
  const host = await resolveHost()
  const context = await getHomeRouteContext(host)

  return (
    <>
      <Navbar categories={context.categories} siteVariant={context.siteVariant} />
      <Hero />
      <Articles products={context.homeData?.products || []} />
      <GalleryBlock />
      <Section01 />
      <Contact contactInformation={context.contactInformation} />
      <Footer siteVariant={context.siteVariant} />
    </>
  )
}
