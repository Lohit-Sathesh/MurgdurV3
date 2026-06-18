'use client'
import { useState } from 'react'
import { positionClasses } from '@/components/admin/TextPositionPicker'

interface Highlight {
  id: string
  imageUrl: string
  mediaType?: string
  title: string
  subheading?: string | null
  placement: string
  textTheme?: string
  textPosition?: string
}

interface CategoryHeroProps {
  category: {
    name: string
    description: string | null
    highlights?: Highlight[]
  }
}

export function CategoryHero({ category }: CategoryHeroProps) {
  const slides = (category.highlights ?? []).filter(h => h.placement === 'hero')
  const [activeIdx, setActiveIdx] = useState(0)

  // No hero image — show simple text header
  if (slides.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-20 md:pt-32 pb-6 md:pb-16 text-center">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-6xl tracking-luxury text-luxury-white mb-4 md:mb-6 capitalize">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-luxury-muted text-sm md:text-base tracking-wide leading-relaxed">
            {category.description}
          </p>
        )}
      </div>
    )
  }

  const active = slides[activeIdx]
  const light = active.textTheme === 'light'

  return (
    <div>
      {/* Tab bar only when multiple hero slides */}
      {slides.length > 1 && (
        <div className="flex gap-4 sm:gap-8 overflow-x-auto px-4 sm:px-8 md:px-16 pt-6 sm:pt-10 pb-4 sm:pb-6 border-b border-luxury-gray scrollbar-none">
          {slides.map((slide, i) => (
            <button key={slide.id} onClick={() => setActiveIdx(i)}
              className={`whitespace-nowrap text-[10px] sm:text-xs md:text-sm tracking-[0.1em] sm:tracking-luxury uppercase pb-2 border-b-2 transition-colors shrink-0 ${
                i === activeIdx
                  ? 'text-luxury-white border-luxury-gold'
                  : 'text-luxury-muted border-transparent hover:text-luxury-white'
              }`}>
              {slide.title}
            </button>
          ))}
        </div>
      )}

      {/* Hero — full screen on desktop, 70vh on mobile so it fits without scrolling */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-screen overflow-hidden">
        {slides.map((slide, i) => (
          slide.mediaType === 'video' ? (
            <video key={slide.id} src={slide.imageUrl} muted loop autoPlay playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === activeIdx ? 'opacity-100' : 'opacity-0'}`} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={slide.id} src={slide.imageUrl} alt={slide.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === activeIdx ? 'opacity-100' : 'opacity-0'}`} />
          )
        ))}

        {/* Scrim overlay */}
        <div className={`absolute inset-0 pointer-events-none ${
          light ? 'bg-white/10' : 'bg-gradient-to-t from-black/50 via-black/15 to-black/30'
        }`} />

        {/* Text overlay — position driven by textPosition field */}
        <div className={`absolute inset-0 flex flex-col ${positionClasses(active.textPosition)}`}>
          {active.title && (
            <h1 className={`font-serif text-xl sm:text-3xl md:text-5xl lg:text-7xl tracking-[0.08em] sm:tracking-luxury capitalize mb-2 md:mb-4 ${
              light ? 'text-luxury-black' : 'text-luxury-white'
            }`}>
              {active.title}
            </h1>
          )}
          {active.subheading && (
            <p className={`text-sm md:text-base tracking-wide leading-relaxed max-w-xl ${
              light ? 'text-luxury-black/70' : 'text-luxury-white/80'
            }`}>
              {active.subheading}
            </p>
          )}
          {!active.title && !active.subheading && category.name && (
            <h1 className={`font-serif text-5xl md:text-7xl tracking-luxury capitalize mb-4 ${
              light ? 'text-luxury-black' : 'text-luxury-white'
            }`}>
              {category.name}
            </h1>
          )}
        </div>
      </div>
    </div>
  )
}
