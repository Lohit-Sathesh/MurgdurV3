'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import { useHeroTheme } from '@/context/HeroThemeContext'
import { useButton, useTextStyle } from '@/context/SiteConfigContext'
import { positionClasses } from '@/components/admin/TextPositionPicker'

export interface HeroSlide {
  mediaUrl: string
  mediaType: 'image' | 'video'
  placement?: string
  layout?: 'full' | 'half'
  headline: string
  subheading?: string | null
  linkUrl?: string | null
  textTheme?: string
  textPosition?: string
}

const DEFAULT_SLIDES: HeroSlide[] = [
  { mediaType: 'image', mediaUrl: '', headline: 'Noir Collection', subheading: 'The art of darkness', linkUrl: '/collections/noir-series' },
  { mediaType: 'image', mediaUrl: '', headline: 'Summer 2026', subheading: 'Luminous. Effortless.', linkUrl: '/collections/summer-2026' },
  { mediaType: 'image', mediaUrl: '', headline: 'Maison Bags', subheading: 'Crafted for eternity', linkUrl: '/collections/handbags' },
]

const FALLBACK_BG = ['#f5f0eb', '#ece4d8', '#f0ece4']

export function HeroSlider({ slides }: { slides?: HeroSlide[] }) {
  const data = slides && slides.length ? slides : DEFAULT_SLIDES
  const sliderRef  = useRef<HTMLDivElement>(null)
  const currentRef = useRef(0)
  const [active, setActive] = useState(0)
  const { setTheme } = useHeroTheme()
  const isLight = data[active]?.textTheme === 'light'
  const exploreBtn      = useButton('hero_explore')
  const headlineStyle   = useTextStyle('heroHeadline')
  const subheadingStyle = useTextStyle('heroSubheading')

  useEffect(() => {
    setTheme(data[0]?.textTheme === 'light' ? 'light' : 'dark')

    const slideEls = sliderRef.current?.querySelectorAll<HTMLElement>('.slide')
    if (!slideEls?.length) return

    gsap.set(slideEls, { opacity: (i: number) => (i === 0 ? 1 : 0) })

    const goTo = (index: number) => {
      const prev = currentRef.current
      if (prev === index) return
      currentRef.current = index
      setActive(index)
      setTheme(data[index]?.textTheme === 'light' ? 'light' : 'dark')

      gsap.to(slideEls[prev], { opacity: 0, duration: 1.4, ease: 'power2.inOut' })
      gsap.fromTo(slideEls[index],
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }
      )
    }

    const interval = setInterval(() => {
      goTo((currentRef.current + 1) % slideEls.length)
    }, 6000)

    ;(sliderRef.current as any)._goTo = goTo

    return () => clearInterval(interval)
  }, [data.length])

  const handleDotClick = (i: number) => {
    const fn = (sliderRef.current as any)?._goTo
    if (fn) fn(i)
  }

  return (
    <div ref={sliderRef} className="relative w-full h-screen overflow-hidden bg-luxury-black">
      {data.map((slide, i) => (
        <div key={i} className="slide absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ opacity: i === 0 ? 1 : 0 }}>
          {slide.mediaUrl ? (
            slide.mediaType === 'video' ? (
              <video
                src={slide.mediaUrl}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover animate-kenburns"
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-top animate-kenburns"
                style={{ backgroundImage: `url(${slide.mediaUrl})` }}
              />
            )
          ) : (
            <div className="absolute inset-0 w-full h-full animate-kenburns" style={{ background: FALLBACK_BG[i % FALLBACK_BG.length] }} />
          )}


          <div className={`absolute inset-0 flex flex-col z-10 ${positionClasses(slide.textPosition)}`}>
            {slide.subheading && (
              <p className="text-luxury-gold text-[9px] sm:text-[10px] md:text-xs tracking-[0.1em] sm:tracking-[0.2em] md:tracking-luxury uppercase mb-2 sm:mb-4 md:mb-6"
                style={subheadingStyle}>
                {slide.subheading}
              </p>
            )}
            {slide.headline && (
              <h1 className={`font-serif text-xl sm:text-3xl md:text-5xl lg:text-7xl xl:text-8xl tracking-[0.05em] sm:tracking-wide md:tracking-luxury mb-4 md:mb-10 ${
                slide.textTheme === 'light' ? 'text-luxury-black' : 'text-luxury-white'
              }`}
                style={{
                  textShadow: slide.textTheme === 'light' ? '0 2px 12px rgba(255,255,255,0.4)' : '0 2px 20px rgba(0,0,0,0.5)',
                  ...headlineStyle,
                }}>
                {slide.headline}
              </h1>
            )}
            {slide.linkUrl && (
              <Link href={slide.linkUrl}
                className={`border text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-luxury uppercase px-4 sm:px-6 py-2.5 sm:py-3 md:px-10 md:py-4 transition-all duration-500 ${
                  slide.textTheme === 'light'
                    ? 'border-luxury-black text-luxury-black hover:bg-luxury-black hover:text-luxury-white'
                    : 'border-luxury-white text-luxury-white hover:bg-luxury-white hover:text-luxury-black'
                }`}>
                {exploreBtn.label}
              </Link>
            )}
          </div>
        </div>
      ))}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {data.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => handleDotClick(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === active
                ? 'w-8 bg-luxury-gold'
                : isLight ? 'w-1 bg-luxury-black/30 hover:bg-luxury-black/60' : 'w-1 bg-luxury-white/40 hover:bg-luxury-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
