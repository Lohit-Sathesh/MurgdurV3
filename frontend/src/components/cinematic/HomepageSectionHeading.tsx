'use client'
import { useTextStyle } from '@/context/SiteConfigContext'
import type { HomepageSection } from '@/context/SiteConfigContext'

export function HomepageSectionHeading({ sec }: { sec: HomepageSection }) {
  const headingStyle = useTextStyle('homepageSection')
  const bodyStyle    = useTextStyle('sectionBody')

  return (
    <div className="text-center mb-16">
      {sec.eyebrow && (
        <p className="text-luxury-gold uppercase tracking-[0.3em] text-xs mb-4">{sec.eyebrow}</p>
      )}
      {sec.headline && (
        <h2 className="font-serif text-3xl md:text-5xl text-luxury-white mb-4 whitespace-pre-line" style={headingStyle}>
          {sec.headline}
        </h2>
      )}
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-luxury-gold to-transparent mx-auto" />
      {sec.description && (
        <p className="text-luxury-muted mt-6 max-w-xl mx-auto text-sm" style={bodyStyle}>
          {sec.description}
        </p>
      )}
      {sec.buttonLabel && sec.buttonUrl && (
        <a href={sec.buttonUrl}
          className="mt-8 inline-block border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase px-10 py-4 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500">
          {sec.buttonLabel}
        </a>
      )}
    </div>
  )
}
