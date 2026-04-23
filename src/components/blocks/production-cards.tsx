'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Production } from '@/type'

const normalizeIntro = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

type ProductionCardsProps = {
  products: Production[]
  gridClassName?: string
}

const ProductionCards = ({ products, gridClassName }: ProductionCardsProps) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8', gridClassName)}>
      {products.map((product) => {
        const productionRouteIndex = product.routeIndex || product.slug || String(product.id)
        const intro = normalizeIntro(product.intro)

        return (
          <Link key={product.documentId} href={`/production/${productionRouteIndex}`} className="flex flex-col">
            <Card className="group flex flex-col shadow-none overflow-hidden rounded-md border h-full hover:shadow-md transition-shadow">
              <div className="w-full aspect-video bg-muted/40 rounded-t-lg overflow-hidden p-2">
                {product.picture && product.picture.length > 0 && (
                  <img
                    src={product.picture[0].url}
                    alt={product.name}
                    className="w-full h-full object-contain transition-opacity duration-300"
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

                {intro ? <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{intro}</p> : null}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export default ProductionCards
