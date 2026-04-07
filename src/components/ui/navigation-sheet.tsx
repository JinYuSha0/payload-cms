'use client'

import Link from 'next/link'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { NavCategory } from '@/frontend/types'
import { Menu } from 'lucide-react'

export function NavigationSheet({
  categories,
  isXinzhuolian,
}: {
  categories: NavCategory[]
  isXinzhuolian: boolean
}) {
  return (
    <Sheet>
      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="px-6 py-3">
        <Logo isXinzhuolian={isXinzhuolian} />

        <div className="mt-12 text-base space-y-4">
          <Link href="/" className="inline-block">
            Home
          </Link>

          <div>
            <div className="font-bold">Categories</div>
            <ul className="mt-2 space-y-3 ml-1 pl-4 border-l">
              {categories.map((item) => (
                <li key={item.documentId}>
                  <Link href={`/category/${item.documentId}`} className="flex items-center gap-2">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
