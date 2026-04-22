'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { Calendar } from 'lucide-react'
import { useState } from 'react'

import { FAQ, type FAQItem } from '@/components/blocks/faq'
import { Card } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import type { ProductionPageData } from '@/frontend/types'

const faqData: FAQItem[] = [
  {
    question: 'What material is the product made of?',
    answer:
      'Our products are made from food-grade stainless steel, safe and hygienic, meeting national standards, and can be in direct contact with food.',
  },
  {
    question: 'Can the product be washed in a dishwasher?',
    answer:
      'Yes, this product can be safely placed in a dishwasher. We recommend using mild detergents and avoiding strong alkaline cleaners.',
  },
  {
    question: "How long is the product's shelf life?",
    answer:
      'With normal use and maintenance, our products can last for many years. Stainless steel material has excellent corrosion resistance and durability.',
  },
  {
    question: 'Is the product suitable for use in a microwave?',
    answer:
      'Do not use this product in a microwave for heating. Stainless steel material will create sparks in a microwave, which may cause danger.',
  },
  {
    question: 'How to maintain the product to extend its lifespan?',
    answer:
      'We recommend cleaning and drying promptly after use. Avoid using sharp objects to scrape the surface. Regularly check the product condition, and replace it promptly if damage is found. Store in a dry environment.',
  },
  {
    question: 'What sizes are available for the product?',
    answer:
      'We offer multiple size specifications to meet the needs of different households. For detailed size information, please refer to the product specifications or contact customer service.',
  },
  {
    question: 'How long after purchase can I receive the goods?',
    answer:
      'Usually after order confirmation, we will ship within 1-3 business days. Specific delivery time depends on your address, generally 5-7 business days for delivery.',
  },
  {
    question: 'Does the product support returns and exchanges?',
    answer:
      'We offer a 7-day no-questions-asked return and exchange service. If the product has quality issues or does not match the description, we will cover the return shipping costs. Please inspect the product carefully after receipt.',
  },
]

const ProductionDetail = ({ data }: { data: ProductionPageData }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const { production, recommendedProductions, error } = data

  if (error || !production) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground">
            {error || "The product you're looking for doesn't exist."}
          </p>
        </div>
      </div>
    )
  }

  const images = production.picture || []
  const categories = production.categories || []

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    ...categories.map((category) => ({
      label: category.name,
      to: `/category/${category.routeIndex || category.documentId}`,
    })),
    { label: production.name },
  ]

  const currentImage = images[selectedImageIndex] || images[0]

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {images.length > 0 && (
        <div className="w-full bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <div className="flex-1">
                <div className="relative w-full aspect-[16/10] lg:aspect-video overflow-hidden rounded-lg bg-muted border">
                  <img
                    src={currentImage?.url || ''}
                    alt={currentImage?.alternativeText || currentImage?.caption || production.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
                  {images.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`
                        relative w-16 h-16 lg:w-20 lg:h-20 shrink-0
                        rounded-lg overflow-hidden border-2 transition-all
                        ${
                          selectedImageIndex === index
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }
                      `}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={image.url}
                        alt={image.alternativeText || image.caption || `${production.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImageIndex === index && <div className="absolute inset-0 bg-primary/10" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article className="flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">{production.name}</h1>

            {production.createdAt && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{dayjs(production.createdAt).format('YYYY-MM-DD')}</span>
                </div>
              </div>
            )}
          </div>

          <Separator className="mb-8" />

          <div
            className="frontend-content prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: production.content || '' }}
          />
        </article>

        <div className="mt-16 pt-12 border-t">
          <FAQ faqData={faqData} />
        </div>

        {recommendedProductions.length > 0 && (
          <div className="mt-16 pt-12 border-t">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Recommended Products</h2>
              <p className="text-muted-foreground">Featured Products</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedProductions.map((product) => {
                const imageUrl = product.picture?.[0]?.url
                const imageError = imageErrors[product.documentId] || false
                const productionRouteIndex = product.routeIndex || product.slug || String(product.id)

                return (
                  <Link key={product.documentId} href={`/production/${productionRouteIndex}`} className="group">
                    <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full border hover:border-primary/50">
                      <div className="relative w-full aspect-video overflow-hidden bg-muted">
                        {imageUrl && !imageError ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={() =>
                              setImageErrors((prev) => ({
                                ...prev,
                                [product.documentId]: true,
                              }))
                            }
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <p className="text-center text-sm font-medium text-muted-foreground line-clamp-3">
                              {product.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="text-base font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{product.leaf_category?.name}</p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionDetail
