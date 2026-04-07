import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import Category from '@/components/blocks/category'
import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import { getCategoryRouteContext } from '@/frontend/server/get-frontend-route-context'

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const context = await getCategoryRouteContext(host, id)

  if (!context.categoryData) {
    notFound()
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
