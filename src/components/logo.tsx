'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Logo({ isXinzhuolian }: { isXinzhuolian: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center">
      <img
        src={isXinzhuolian ? '/logo2.jpg' : '/logo.png'}
        alt="Logo"
        className={cn({
          'h-14': !isXinzhuolian,
          'w-32': isXinzhuolian,
        })}
      />
    </Link>
  )
}
