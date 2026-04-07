'use client'

import React from 'react'

import { NavMenu } from '@/components/ui/nav-menu'
import type { NavCategory } from '@/frontend/types'

interface NavMenuNewProps extends React.ComponentProps<typeof NavMenu> {
  categories: NavCategory[]
}

export function NavMenuNew({ categories, ...props }: NavMenuNewProps) {
  return <NavMenu categories={categories} {...props} />
}
