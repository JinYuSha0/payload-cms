import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'

import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import ProductionCards from '@/components/blocks/production-cards'
import { getProductionsListRouteContext } from '@/frontend/server/get-frontend-route-context'
import { createAbsoluteURL } from '@/frontend/server/seo'

type ProductionsListPageProps = {
  searchParams: Promise<{
    page?: string
  }>
}

const normalizePage = (value: string | undefined): number => {
  const parsed = Number.parseInt(value || '1', 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

const getPageHref = (targetPage: number): string => {
  if (targetPage <= 1) {
    return '/productions'
  }

  return `/productions?page=${targetPage}`
}

const resolveHost = async (): Promise<string | null> => {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await resolveHost()
  const title = 'All Products | Kitchen Utensils'
  const description = 'Browse the full production catalog with product introductions and category details.'
  const canonical = createAbsoluteURL('/productions', host)

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

export default async function ProductionsListPage({ searchParams }: ProductionsListPageProps) {
  const host = await resolveHost()
  const resolvedSearchParams = await searchParams
  const page = normalizePage(resolvedSearchParams.page)
  const context = await getProductionsListRouteContext(host, page)
  const pagination = context.productionsListData?.pagination
  const productions = context.productionsListData?.productions || []
  const pageCount = pagination?.pageCount || 0
  const currentPage = pagination?.page || 1

  return (
    <>
      <Navbar categories={context.categories} siteVariant={context.siteVariant} />

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">Productions</p>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">All Productions</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Browse the full production catalog with product introductions and category details.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{pagination?.total || 0} productions total</p>
        <div className="mt-6 border-t" />

        <div className="mt-8">
          {productions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No productions found.</p>
            </div>
          ) : (
            <ProductionCards products={productions} />
          )}
        </div>

        {pageCount > 1 ? (
          <div className="mt-10 border-t pt-6 flex flex-wrap items-center justify-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={getPageHref(currentPage - 1)}
                className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-accent"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">
                Previous
              </span>
            )}

            {Array.from({ length: pageCount }, (_, index) => {
              const pageNumber = index + 1
              const isActive = pageNumber === currentPage

              return (
                <Link
                  key={pageNumber}
                  href={getPageHref(pageNumber)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm ${
                    isActive ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                  }`}
                >
                  {pageNumber}
                </Link>
              )
            })}

            {currentPage < pageCount ? (
              <Link
                href={getPageHref(currentPage + 1)}
                className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-accent"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">
                Next
              </span>
            )}
          </div>
        ) : null}
      </section>

      <Contact contactInformation={context.contactInformation} />
      <Footer siteVariant={context.siteVariant} />
    </>
  )
}
