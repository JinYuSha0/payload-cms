'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type GalleryItem = {
  id: string | number
  image: string
  alt?: string
  title?: string
}

type GalleryProps = {
  items: GalleryItem[]
  speed?: number
  gap?: string
  className?: string
  itemWidth?: number | string
  itemHeight?: number | string
}

function Gallery({
  items,
  speed = 30,
  gap = '1rem',
  className,
  itemWidth = '280px',
  itemHeight = '200px',
}: GalleryProps) {
  const duplicatedItems = React.useMemo(() => [...items, ...items, ...items, ...items], [items])
  const animationId = React.useId()
  const translatePercent = 25

  return (
    <>
      <style>{`
        @keyframes scroll-left-${animationId} {
          from { transform: translateX(0); }
          to { transform: translateX(-${translatePercent}%); }
        }

        @keyframes scroll-right-${animationId} {
          from { transform: translateX(-${translatePercent}%); }
          to { transform: translateX(0); }
        }

        .gallery-row-left-${animationId} {
          animation: scroll-left-${animationId} ${speed}s linear infinite;
          will-change: transform;
        }

        .gallery-row-right-${animationId} {
          animation: scroll-right-${animationId} ${speed}s linear infinite;
          will-change: transform;
        }

        .gallery-row-left-${animationId},
        .gallery-row-right-${animationId} {
          backface-visibility: hidden;
          perspective: 1000px;
          transform-style: preserve-3d;
        }

        @media (prefers-reduced-motion: reduce) {
          .gallery-row-left-${animationId},
          .gallery-row-right-${animationId} {
            animation: none;
          }
        }
      `}</style>
      <div
        className={cn(
          'relative w-full overflow-hidden py-4 sm:py-6 md:py-8 lg:py-12',
          'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-16 sm:before:w-24 md:before:w-32 before:z-10 before:pointer-events-none',
          'before:bg-gradient-to-r before:from-background before:to-transparent',
          'after:absolute after:right-0 after:top-0 after:bottom-0 after:w-16 sm:after:w-24 md:after:w-32 after:z-10 after:pointer-events-none',
          'after:bg-gradient-to-l after:from-background after:to-transparent',
          className,
        )}
      >
        <div className={cn('flex mb-3 sm:mb-4', `gallery-row-left-${animationId}`)} style={{ gap: `var(--gap, ${gap})` }}>
          {duplicatedItems.map((item, index) => (
            <GalleryCard key={`top-${item.id}-${index}`} item={item} width={itemWidth} height={itemHeight} />
          ))}
        </div>

        <div className={cn('flex', `gallery-row-right-${animationId}`)} style={{ gap: `var(--gap, ${gap})` }}>
          {duplicatedItems.map((item, index) => (
            <GalleryCard key={`bottom-${item.id}-${index}`} item={item} width={itemWidth} height={itemHeight} />
          ))}
        </div>
      </div>
    </>
  )
}

function GalleryCard({
  item,
  width,
  height,
}: {
  item: GalleryItem
  width: number | string
  height: number | string
}) {
  const widthValue = typeof width === 'number' ? `${width}px` : width
  const heightValue = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className="relative group shrink-0 overflow-hidden rounded-lg shadow-md sm:shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
      style={{
        width: `var(--item-width, ${widthValue})`,
        height: `var(--item-height, ${heightValue})`,
      }}
    >
      <img
        src={item.image}
        alt={item.alt || item.title || 'Gallery image'}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        decoding="async"
      />
      {item.title && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
            <p className="text-xs sm:text-sm font-medium line-clamp-2">{item.title}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export { Gallery, type GalleryProps, type GalleryItem }
