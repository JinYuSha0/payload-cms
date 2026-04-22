'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Production } from '@/type'

const Articles = ({ products }: { products: Production[] }) => {
  return (
    <div className="max-w-(--breakpoint-xl) mx-auto py-6 sm:py-10 lg:py-16 px-4 sm:px-6 xl:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {products.map((product) => {
          const productionRouteIndex = product.routeIndex || product.slug || product.documentId

          return (
            <Link key={product.documentId} href={`/production/${productionRouteIndex}`} className="flex flex-col">
              <Card className="group flex flex-col shadow-none overflow-hidden rounded-md border h-full hover:shadow-md transition-shadow">
                <div className="w-full aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {product.picture && product.picture.length > 0 && (
                    <img
                      src={product.picture[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(event) => {
                        const img = event.currentTarget
                        const fallback = product.picture?.[0]?.url
                        if (!fallback || img.src === fallback) return
                        img.src = fallback
                      }}
                    />
                  )}
                </div>
                <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {product.leaf_category && (
                      <Badge className="bg-primary/5 text-primary hover:bg-primary/5 shadow-none">
                        {product.leaf_category.name}
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-2 text-lg sm:text-xl font-semibold tracking-tight text-left line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-muted-foreground text-sm font-medium" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Articles
