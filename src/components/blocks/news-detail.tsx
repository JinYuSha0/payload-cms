'use client'

import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import type { NewsPageData } from '@/frontend/types'

const formatDate = (value?: string): string => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

const NewsDetail = ({ data }: { data: NewsPageData }) => {
  if (!data.news) {
    return null
  }

  const { news, relatedNews } = data

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div>
          <p className="text-sm text-muted-foreground">{formatDate(news.createdAt)}</p>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">{news.title}</h1>
        </div>

        <div className="mt-6 border-t" />

        <article
          className="frontend-content prose prose-neutral mt-6 max-w-none prose-headings:font-semibold prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </div>

      {relatedNews.length > 0 ? (
        <div className="mx-auto mt-14 max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Related News</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedNews.map((item) => (
              <Link key={item.documentId} href={`/news/${item.routeIndex}`} className="group">
                <Card className="h-full rounded-xl transition-colors group-hover:border-primary/40">
                  <CardContent className="p-4 sm:p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default NewsDetail
