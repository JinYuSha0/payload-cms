import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'

import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import NewsList from '@/components/blocks/news-list'
import { getNewsListRouteContext } from '@/frontend/server/get-frontend-route-context'
import { createAbsoluteURL } from '@/frontend/server/seo'

type NewsListPageProps = {
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
    return '/news'
  }

  return `/news?page=${targetPage}`
}

const resolveHost = async (): Promise<string | null> => {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await resolveHost()
  const title = 'Latest News | Kitchen Utensils'
  const description = 'Product updates, technical insights, and company announcements.'
  const canonical = createAbsoluteURL('/news', host)

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

export default async function NewsListPage({ searchParams }: NewsListPageProps) {
  const host = await resolveHost()
  const resolvedSearchParams = await searchParams
  const page = normalizePage(resolvedSearchParams.page)
  const context = await getNewsListRouteContext(host, page)
  const pagination = context.newsListData?.pagination
  const pageCount = pagination?.pageCount || 0
  const currentPage = pagination?.page || 1

  return (
    <>
      <Navbar categories={context.categories} siteVariant={context.siteVariant} />

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">News</p>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">All News</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Product updates, technical insights, and company announcements.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{pagination?.total || 0} news total</p>
        <div className="mt-6 border-t" />

        <div className="mt-8">
          <NewsList news={context.newsListData?.news || []} />
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
