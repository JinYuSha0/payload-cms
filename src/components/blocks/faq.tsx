'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface FAQItem {
  question: string
  answer: string
}

export function FAQ({ faqData }: { faqData: FAQItem[] }) {
  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">FAQ</h2>
      <Accordion type="single" collapsible className="w-full rounded-lg border px-4">
        {faqData.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-semibold text-base hover:no-underline py-5">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <p className="text-sm sm:text-base text-left text-foreground/90 leading-7">{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
