'use client'

import Link from 'next/link'
import * as React from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center flex-nowrap space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground overflow-hidden',
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={index}>
            {item.to && !isLast ? (
              <Link
                href={item.to}
                className="hover:text-foreground transition-colors py-1 px-1.5 sm:py-0 sm:px-0 -mx-1 sm:mx-0 rounded sm:rounded-none shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast && 'text-foreground font-medium',
                  isLast && 'truncate min-w-0',
                  !isLast && 'shrink-0',
                  'py-1 px-1.5 sm:py-0 sm:px-0 -mx-1 sm:mx-0',
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="size-3.5 sm:size-4 text-muted-foreground shrink-0" />}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export { Breadcrumb, type BreadcrumbItem }
