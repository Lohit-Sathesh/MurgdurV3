'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { useTextStyle } from '@/context/SiteConfigContext'

gsap.registerPlugin(ScrollTrigger)

interface EditorialSectionProps {
  eyebrow?: string
  heading: string
  body: string
  linkUrl?: string
  linkLabel?: string
}

export function EditorialSection({ eyebrow, heading, body, linkUrl, linkLabel = 'Discover' }: EditorialSectionProps) {
  const ref             = useRef<HTMLDivElement>(null)
  const headingStyle    = useTextStyle('editorialHeading')
  const bodyStyle       = useTextStyle('editorialBody')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 75%', toggleActions: 'play none none reverse' },
    })
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <section className="px-4 md:px-8 py-16 md:py-32 lg:py-40 flex items-center justify-center">
      <div ref={ref} className="max-w-2xl text-center relative">
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-luxury-gold to-transparent mx-auto mb-6 md:mb-8" />
        {eyebrow && (
          <p className="text-luxury-gold text-xs tracking-luxury uppercase mb-4 md:mb-6">{eyebrow}</p>
        )}
        <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl tracking-[0.08em] sm:tracking-luxury text-luxury-white mb-4 md:mb-8 leading-snug"
          style={headingStyle}>
          {heading}
        </h2>
        <p className="text-luxury-muted text-sm md:text-base tracking-wide leading-relaxed mb-6 md:mb-10"
          style={bodyStyle}>
          {body}
        </p>
        {linkUrl && (
          <Link href={linkUrl}
            className="inline-block border border-luxury-white text-luxury-white text-xs tracking-luxury uppercase px-6 py-3 md:px-10 md:py-4 hover:bg-luxury-gold hover:text-luxury-black hover:border-luxury-gold transition-all duration-700">
            {linkLabel}
          </Link>
        )}
      </div>
    </section>
  )
}
