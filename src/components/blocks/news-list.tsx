'use client'

import Link from 'next/link'

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

const NewsList = ({ news }: { news: NewsItem[] }) => {
  if (news.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No news found.</p>
      </div>
    )
  }

  return (
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
  )
}

export default NewsList
