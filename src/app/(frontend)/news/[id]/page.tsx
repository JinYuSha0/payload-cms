import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

import Contact from '@/components/blocks/contact'
import Footer from '@/components/blocks/footer'
import Navbar from '@/components/blocks/navbar'
import NewsDetail from '@/components/blocks/news-detail'
import { getNewsRouteContext } from '@/frontend/server/get-frontend-route-context'
import { createAbsoluteURL, stripHTML, truncateText } from '@/frontend/server/seo'
import type { NewsItem } from '@/frontend/types'

type NewsPageProps = {
  params: Promise<{ id: string }>
}

const resolveDescription = (news: NewsItem): string => {
  const seoDescription = news.seoDescription?.trim()
  if (seoDescription) {
    return truncateText(seoDescription, 160)
  }

  return truncateText(stripHTML(news.content || ''), 160)
}

const resolveHost = async (): Promise<string | null> => {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { id } = await params
  const host = await resolveHost()
  const context = await getNewsRouteContext(host, id)
  const news = context.newsData?.news

  if (!news) {
    return {
      title: 'News Not Found | Kitchen Utensils',
    }
  }

  const routeIndex = news.slug || String(news.id)
  const canonical = createAbsoluteURL(`/news/${routeIndex}`, host)
  const title = news.seoTitle?.trim() || news.title
  const description = resolveDescription(news)
  const imageURL = news.picture?.url
  const keywords = (news.seoKeywords || []).filter((keyword) => typeof keyword === 'string' && keyword.trim())

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
      type: 'article',
      url: canonical,
      images: imageURL ? [{ url: imageURL, alt: news.picture?.alternativeText || title }] : undefined,
    },
    twitter: {
      card: imageURL ? 'summary_large_image' : 'summary',
      title,
      description: description || undefined,
      images: imageURL ? [imageURL] : undefined,
    },
  }
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { id } = await params
  const host = await resolveHost()
  const context = await getNewsRouteContext(host, id)

  if (!context.newsData?.news) {
    notFound()
  }

  const news = context.newsData.news
  const preferredRouteIndex = news.slug || String(news.id)
  if (id !== preferredRouteIndex) {
    redirect(`/news/${preferredRouteIndex}`)
  }

  return (
    <>
      <Navbar categories={context.categories} siteVariant={context.siteVariant} />
      <NewsDetail data={context.newsData} />
      <Contact contactInformation={context.contactInformation} />
      <Footer siteVariant={context.siteVariant} />
    </>
  )
}
