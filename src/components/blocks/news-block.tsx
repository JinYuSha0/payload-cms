'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { NewsItem } from '@/frontend/types'

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

const NewsBlock = ({ news }: { news: NewsItem[] }) => {
  if (news.length === 0) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">News</p>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Latest News</h2>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <Link href="/news">
            View All
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {news.map((item) => (
          <Link key={item.documentId} href={`/news/${item.routeIndex}`} className="group">
            <Card className="h-full overflow-hidden rounded-xl border p-0 transition-shadow hover:shadow-md">
              {item.picture?.url ? (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.picture.url}
                    alt={item.picture.alternativeText || item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-linear-to-br from-primary/20 via-primary/10 to-background" />
              )}
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                <h3 className="mt-2 text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {item.excerpt}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default NewsBlock
