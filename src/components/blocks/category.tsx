'use client'

import Link from 'next/link'
import dayjs from 'dayjs'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'
import type { CategoryPageData } from '@/frontend/types'

const extractTextFromHTML = (html: string) => {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const Category = ({ data }: { data: CategoryPageData }) => {
  const { productions, categoryTree, parentCategory } = data

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    ...parentCategory.map((category) => ({
      label: category.name,
      to: `/category/${category.documentId}`,
    })),
    { label: categoryTree.category.name },
  ]

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div className="w-full md:w-64 lg:w-80 h-48 md:h-64 bg-linear-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center shrink-0">
              <div className="text-6xl md:text-7xl font-bold text-primary/30">
                {categoryTree.category.name.charAt(0) || 'B'}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{categoryTree.category.name || 'Blog'}</h1>
              <p className="text-sm text-muted-foreground">{categoryTree.category.productionCount} productions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-32 space-y-2">
              <h2 className="text-lg font-semibold mb-4 hidden lg:block">Categories</h2>
              <nav className="space-y-1">
                {categoryTree.children.map((category) => (
                  <Link key={category.id} href={`/category/${category.documentId}`}>
                    <button className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{category.name}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', 'bg-muted text-muted-foreground')}>
                          {category.productionCount}
                        </span>
                      </div>
                    </button>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {productions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No productions found in this category.</p>
              </div>
            ) : (
              <div className="columns-1 lg:columns-2 gap-6">
                {productions.map((production) => {
                  const content = extractTextFromHTML(production.content || '')
                  const minutes = Math.max(Math.ceil(content.length / 225), 1)
                  return (
                    <Link key={production.documentId} href={`/production/${production.documentId}`}>
                      <Card className="mb-6 break-inside-avoid border hover:shadow-md transition-all duration-300 bg-card group overflow-hidden p-0">
                        <div className="w-full aspect-video bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 relative overflow-hidden rounded-t-xl">
                          {production.picture && production.picture.length > 0 ? (
                            <>
                              <img
                                src={production.picture[0].formats?.small?.url || production.picture[0].url}
                                alt={production.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-5xl font-bold text-primary/30">{production.name.charAt(0).toUpperCase()}</div>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-6 flex flex-col">
                          <p className="text-sm text-muted-foreground font-medium mb-2">
                            {dayjs(production.createdAt).format('YYYY-MM-DD')}
                          </p>

                          <h3 className="text-xl font-semibold leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {production.name}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{content.slice(0, 120)}</p>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-sm font-medium text-foreground">{`${minutes} min read`}</span>

                            <Button variant="ghost" size="sm" className="text-sm font-medium hover:underline">
                              Read
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Category
