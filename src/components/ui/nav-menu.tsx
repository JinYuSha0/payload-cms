'use client'

import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import type { NavCategory } from '@/frontend/types'
import { cn } from '@/lib/utils'

interface NavMenuProps extends React.ComponentProps<typeof NavigationMenu> {
  categories: NavCategory[]
}

export function NavMenu({ categories, ...props }: NavMenuProps) {
  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="gap-1 space-x-0 text-sm">
        <NavigationMenuItem>
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
        </NavigationMenuItem>
        {categories.length > 0 && (
          <NavigationMenuItem>
            <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-1 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {categories.map((category) => (
                  <ListItem
                    key={category.documentId}
                    title={category.name}
                    href={`/category/${category.documentId}`}
                  >
                    {category.name}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            'block select-none space-y-2 rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className,
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none">{title}</div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})

ListItem.displayName = 'ListItem'
