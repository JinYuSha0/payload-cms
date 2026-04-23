'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import ProductionCards from '@/components/blocks/production-cards'
import { Button } from '@/components/ui/button'
import type { Production } from '@/type'

const Articles = ({ products, viewAllHref }: { products: Production[]; viewAllHref: string }) => {
  if (products.length === 0) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">Products</p>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            Featured Products
          </h2>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <Link href={viewAllHref}>
            View All
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <ProductionCards products={products} />
    </section>
  )
}

export default Articles
