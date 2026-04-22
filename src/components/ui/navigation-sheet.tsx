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

          {categories.map((item) => (
            <div key={item.documentId} className="space-y-2">
              <Link href={`/category/${item.routeIndex}`} className="block font-semibold">
                {item.name}
              </Link>
              {item.children.length > 0 && (
                <div className="ml-3 border-l pl-3 space-y-2">
                  {item.children.map((child) => (
                    <Link key={child.documentId} href={`/category/${child.routeIndex}`} className="block text-sm">
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
