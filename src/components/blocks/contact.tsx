'use client'

import { useCallback } from 'react'
import { MailIcon, MapPinIcon, MessageCircle, PhoneIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContactInformation } from '@/frontend/types'

const Contact = ({ contactInformation }: { contactInformation: ContactInformation }) => {
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/frontend/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to submit contact form')
      }

      alert('Thank you for contacting us!')
      e.currentTarget.reset()
    } catch {
      alert('Failed to contact us')
    }
  }, [])

  return (
    <div id="contact" className="flex items-center justify-center py-8 md:py-12 lg:py-16">
      <div className="w-full max-w-(--breakpoint-xl) mx-auto px-4 md:px-6 xl:px-0">
        <b className="text-muted-foreground uppercase font-semibold text-xs md:text-sm">Contact Us</b>
        <h2 className="mt-2 md:mt-3 text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
          Chat with our friendly team!
        </h2>
        <p className="mt-2 md:mt-3 text-sm md:text-base lg:text-lg text-muted-foreground">
          We&apos;d love to hear from you. Please fill out this form or shoot us an email.
        </p>
        <div className="mt-8 md:mt-16 lg:mt-24 grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-16">
          <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-6 md:gap-y-12">
            <div className="flex flex-col items-center text-center max-w-full">
              <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full shrink-0">
                <MailIcon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h3 className="mt-4 md:mt-6 font-semibold text-lg md:text-xl w-full">Email</h3>
              <p className="my-2 text-sm md:text-base text-muted-foreground w-full">Our friendly team is here to help.</p>
              <a className="font-medium text-sm md:text-base text-primary wrap-break-word w-full" href={`mailto:${contactInformation?.email || ''}`}>
                {contactInformation?.email}
              </a>
            </div>
            <div className="flex flex-col items-center text-center max-w-full">
              <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full shrink-0">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h3 className="mt-4 md:mt-6 font-semibold text-lg md:text-xl w-full">Live chat</h3>
              <p className="my-2 text-sm md:text-base text-muted-foreground w-full">Our friendly team is here to help.</p>
              <a className="font-medium text-sm md:text-base text-primary wrap-break-word w-full" href="#contact">
                Start new chat
              </a>
            </div>
            <div className="flex flex-col items-center text-center max-w-full">
              <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full shrink-0">
                <MapPinIcon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h3 className="mt-4 md:mt-6 font-semibold text-lg md:text-xl w-full">Office</h3>
              <p className="my-2 text-sm md:text-base text-muted-foreground w-full">Come say hello at our office HQ.</p>
              <a className="font-medium text-sm md:text-base text-primary wrap-break-word w-full" href="https://map.google.com" target="_blank" rel="noreferrer">
                {contactInformation?.address}
              </a>
            </div>
            <div className="flex flex-col items-center text-center max-w-full">
              <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full shrink-0">
                <PhoneIcon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h3 className="mt-4 md:mt-6 font-semibold text-lg md:text-xl w-full">Phone</h3>
              <p className="my-2 text-sm md:text-base text-muted-foreground w-full">Mon-Fri from 8am to 5pm.</p>
              <a className="font-medium text-sm md:text-base text-primary wrap-break-word w-full" href={`tel:${contactInformation?.phone || ''}`}>
                {contactInformation?.phone}
              </a>
            </div>
          </div>

          <Card className="bg-accent shadow-none py-0">
            <CardContent className="p-4 md:p-6 lg:p-8">
              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-4 md:gap-y-6">
                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="firstName" className="text-sm md:text-base">
                      First Name
                    </Label>
                    <Input
                      name="firstName"
                      required
                      minLength={1}
                      maxLength={32}
                      placeholder="First name"
                      id="firstName"
                      className="mt-1.5 md:mt-2 bg-white h-9 md:h-10 shadow-none text-sm md:text-base"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="lastName" className="text-sm md:text-base">
                      Last Name
                    </Label>
                    <Input
                      name="lastName"
                      required
                      minLength={1}
                      maxLength={32}
                      placeholder="Last name"
                      id="lastName"
                      className="mt-1.5 md:mt-2 bg-white h-9 md:h-10 shadow-none text-sm md:text-base"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email" className="text-sm md:text-base">
                      Email
                    </Label>
                    <Input
                      name="email"
                      required
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      maxLength={64}
                      type="email"
                      placeholder="Email"
                      id="email"
                      className="mt-1.5 md:mt-2 bg-white h-9 md:h-10 shadow-none text-sm md:text-base"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="message" className="text-sm md:text-base">
                      Message
                    </Label>
                    <Textarea
                      name="message"
                      required
                      minLength={1}
                      maxLength={1024}
                      id="message"
                      placeholder="Message"
                      className="mt-1.5 md:mt-2 bg-white shadow-none text-sm md:text-base"
                      rows={5}
                    />
                  </div>
                </div>
                <Button className="mt-4 md:mt-6 w-full text-sm md:text-base" size="lg">
                  Submit
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Contact
