import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import ProductionDetail from '@/components/blocks/production-detail'
import { getProductionRouteContext } from '@/frontend/server/get-frontend-route-context'

export default async function ProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const context = await getProductionRouteContext(host, id)

  if (!context.productionData) {
    notFound()
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
