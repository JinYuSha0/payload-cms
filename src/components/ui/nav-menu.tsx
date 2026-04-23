'use client'

import Link from 'next/link'
import React from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  return (
    <NavigationMenu viewport={false} {...props}>
      <NavigationMenuList className="gap-1 space-x-0 text-sm">
        <NavigationMenuItem>
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
        </NavigationMenuItem>
        {categories.map((category) => {
          if (category.children.length === 0) {
            return (
              <NavigationMenuItem key={category.documentId}>
                <Button variant="ghost" asChild>
                  <Link href={`/category/${category.routeIndex}`}>{category.name}</Link>
                </Button>
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={category.documentId}>
              <NavigationMenuTrigger onClick={() => router.push(`/category/${category.routeIndex}`)}>
                {category.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[320px] gap-2 p-3 md:w-[420px] md:grid-cols-2">
                  {category.children.map((child) => (
                    <ListItem key={child.documentId} title={child.name} href={`/category/${child.routeIndex}`} />
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )
        })}
        <NavigationMenuItem>
          <Button variant="ghost" asChild>
            <Link href="/news">News</Link>
          </Button>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { title: string }
>(({ className, title, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            'block select-none rounded-md p-3 text-sm font-medium leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className,
          )}
          {...props}
        >
          {title}
        </Link>
      </NavigationMenuLink>
    </li>
  )
})

ListItem.displayName = 'ListItem'
