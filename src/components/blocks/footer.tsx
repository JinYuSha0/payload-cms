'use client'

import Link from 'next/link'
import { DribbbleIcon, GithubIcon, TwitchIcon, TwitterIcon } from 'lucide-react'
import { useCallback } from 'react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { SiteVariant } from '@/frontend/types'

const footerLinks = [
  { title: 'Overview', href: '#' },
  { title: 'Features', href: '#' },
  { title: 'Pricing', href: '#' },
  { title: 'Careers', href: '#' },
  { title: 'Help', href: '#' },
  { title: 'Privacy', href: '#' },
]

const Footer = ({ siteVariant }: { siteVariant: SiteVariant }) => {
  const isXinzhuolian = siteVariant === 'xinzhuolian'

  const handleSubscribe = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/frontend/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      alert('Thank you for subscribing!')
      e.currentTarget.reset()
    } catch {
      alert('Failed to subscribe')
    }
  }, [])

  return (
    <div className="flex flex-col">
      <div className="grow bg-muted" />
      <footer className="border-t">
        <div className="max-w-(--breakpoint-xl) mx-auto">
          <div className="py-12 flex flex-col sm:flex-row items-start justify-between gap-x-8 gap-y-10 px-6 xl:px-0">
            <div>
              <Logo isXinzhuolian={isXinzhuolian} />

              <ul className="mt-6 flex items-center gap-4 flex-wrap">
                {footerLinks.map(({ title, href }) => (
                  <li key={title}>
                    <a href={href} className="text-muted-foreground hover:text-foreground">
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="max-w-xs w-full">
              <h6 className="font-medium">Stay up to date</h6>
              <form className="mt-6 flex items-center gap-2" onSubmit={handleSubscribe}>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          </div>
          <Separator />
          <div className="hidden py-8 flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()} <Link href="/">Shadcn UI Blocks</Link>. All rights reserved.
            </span>

            <div className="flex items-center gap-5 text-muted-foreground">
              <a href="#" target="_blank" rel="noreferrer">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" target="_blank" rel="noreferrer">
                <DribbbleIcon className="h-5 w-5" />
              </a>
              <a href="#" target="_blank" rel="noreferrer">
                <TwitchIcon className="h-5 w-5" />
              </a>
              <a href="#" target="_blank" rel="noreferrer">
                <GithubIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Footer
