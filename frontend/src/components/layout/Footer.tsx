'use client'
import Link from 'next/link'
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react'
import { NewsletterForm } from '@/components/ui/NewsletterForm'
import { useSiteConfig, useTextStyle } from '@/context/SiteConfigContext'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/murgdur', icon: Instagram },
  { label: 'Facebook',  href: 'https://facebook.com/murgdur',  icon: Facebook  },
  { label: 'Twitter',   href: 'https://twitter.com/murgdur',   icon: Twitter   },
  { label: 'YouTube',   href: 'https://youtube.com/@murgdur',  icon: Youtube   },
]

export function Footer() {
  const { siteTitle, footerTagline, footerNote, footerColumns } = useSiteConfig()
  const footerStyle = useTextStyle('footer')

  return (
    <footer className="bg-luxury-black border-t border-luxury-gray mt-16 md:mt-32 py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-12" style={footerStyle}>
        {/* Brand column */}
        <div>
          <p className="font-serif font-bold text-lg sm:text-2xl tracking-[0.1em] sm:tracking-luxury text-luxury-white mb-4 sm:mb-6">
            {siteTitle}
          </p>
          <p className="text-luxury-muted text-xs leading-relaxed tracking-wide mb-6">
            {footerTagline}
          </p>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-luxury-gold mb-4">
              Private Access
            </p>
            <NewsletterForm
              layoutClassName="flex gap-2"
              inputClassName="bg-luxury-black border border-luxury-gray px-4 py-3 text-sm text-luxury-white rounded-full flex-1 focus:border-luxury-gold focus:outline-none"
              buttonClassName="px-6 py-3 border border-luxury-gold text-luxury-gold rounded-full hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500"
              buttonLabel="Join"
            />
          </div>
          <div className="flex gap-4">
            {SOCIAL_LINKS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="text-luxury-muted hover:text-luxury-gold transition-colors">
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Dynamic columns from DB */}
        {footerColumns.map(col => (
          <div key={col.title}>
            <p className="text-luxury-white text-xs tracking-luxury uppercase mb-6">{col.title}</p>
            <div className="space-y-3">
              {col.links.map(l => (
                <Link key={l.href + l.label} href={l.href}
                  className="block text-luxury-muted text-xs tracking-wide hover:text-luxury-gold transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="max-w-7xl mx-auto mt-8 md:mt-16 pt-6 md:pt-8 border-t border-luxury-gray text-center">
        <p className="text-luxury-muted text-xs tracking-luxury">{footerNote}</p>
      </div>
    </footer>
  )
}
