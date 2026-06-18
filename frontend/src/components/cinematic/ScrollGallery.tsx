'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import type { HeroSlide } from './HeroSlider'
import { useTextStyle } from '@/context/SiteConfigContext'
import { positionClasses } from '@/components/admin/TextPositionPicker'

gsap.registerPlugin(ScrollTrigger)

export function ScrollGallery({ slides }: { slides: HeroSlide[] }) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const galleryStyle    = useTextStyle('scrollGallery')

  useEffect(() => {
    // Use gsap.context() so each ScrollGallery instance only cleans up its own
    // triggers — multiple instances on the same page no longer interfere.
    const ctx = gsap.context(() => {
      const sections = containerRef.current?.querySelectorAll<HTMLElement>('.scroll-section')
      if (!sections?.length) return

      sections.forEach((section) => {
        const media = section.querySelector<HTMLElement>('.scroll-media')
        const text = section.querySelector<HTMLElement>('.scroll-text')

        if (media) {
          gsap.fromTo(media, { scale: 1.15 }, {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
        }

        if (text) {
          gsap.fromTo(text, { opacity: 0, y: 60 }, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          })
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [slides.length])

  if (!slides.length) return null

  return (
    <div ref={containerRef}>
      {slides.map((slide, i) => {
        const light = slide.textTheme === 'light'
        return (
          <div key={i} className="scroll-section relative h-[90vh] md:h-screen w-full overflow-hidden">
            {slide.mediaType === 'video' ? (
              <video
                src={slide.mediaUrl}
                autoPlay muted loop playsInline
                className="scroll-media absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="scroll-media absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.mediaUrl})` }}
              />
            )}

            {/* Protective scrim for readability */}
            {light ? (
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/30 pointer-events-none" />
            )}

            <div className={`scroll-text absolute inset-0 flex flex-col ${positionClasses((slide as any).textPosition)}`}>
              {slide.subheading && (
                <p className="text-luxury-gold text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-luxury uppercase mb-3 sm:mb-6"
                  style={galleryStyle}>{slide.subheading}</p>
              )}
              {slide.headline && (
                <h2 className={`font-serif text-xl sm:text-3xl md:text-5xl lg:text-7xl tracking-[0.08em] sm:tracking-luxury mb-4 md:mb-10 ${light ? 'text-luxury-black' : 'text-luxury-white'}`}
                  style={galleryStyle}>
                  {slide.headline}
                </h2>
              )}
              {slide.linkUrl && (
                <Link href={slide.linkUrl}
                  className={`border text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-luxury uppercase px-4 sm:px-6 py-2.5 md:px-10 md:py-4 transition-all duration-500 ${
                    light
                      ? 'border-luxury-black text-luxury-black hover:bg-luxury-black hover:text-luxury-white'
                      : 'border-luxury-white text-luxury-white hover:bg-luxury-white hover:text-luxury-black'
                  }`}>
                  Discover
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
