'use client'

import { ArrowUpRight } from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { NavMenu } from '@/components/ui/nav-menu'
import { NavigationSheet } from '@/components/ui/navigation-sheet'
import type { NavCategory, SiteVariant } from '@/frontend/types'

const Navbar = ({
  categories,
  siteVariant,
}: {
  categories: NavCategory[]
  siteVariant: SiteVariant
}) => {
  const isXinzhuolian = siteVariant === 'xinzhuolian'

  return (
    <nav className="sticky top-0 z-50 h-16 bg-background border-b">
      <div className="h-full flex items-center justify-between max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo isXinzhuolian={isXinzhuolian} />
          <div className="hidden md:block">
            <NavMenu categories={categories} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href="#contact">
            <Button>
              Contact Us <ArrowUpRight />
            </Button>
          </a>

          <div className="md:hidden">
            <NavigationSheet categories={categories} isXinzhuolian={isXinzhuolian} />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
