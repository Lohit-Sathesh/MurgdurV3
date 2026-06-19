import type { Metadata } from 'next'
import { cache } from 'react'
import {
  Playfair_Display, Inter, Montserrat, Cormorant_Garamond,
  EB_Garamond, Lato, Oswald, Josefin_Sans, Raleway, Cinzel, Bodoni_Moda,
} from 'next/font/google'
import { Providers }          from '@/components/providers'
import { Navbar }             from '@/components/layout/Navbar'
import { Footer }             from '@/components/layout/Footer'
import { SiteChrome }         from '@/components/layout/SiteChrome'
import { CartDrawer }         from '@/components/ui/CartDrawer'
import { LocalizationPrompt } from '@/components/ui/LocalizationPrompt'
import { FONT_MAP, hexToRgbChannels } from '@/lib/site-config'
import '@/app/globals.css'

// ── Font loading ─────────────────────────────────────────────────────────────
// Every font exposed in FONT_OPTIONS must be loaded here so its CSS variable
// is available before the page paints.
// next/font/google functions are evaluated at build time and don't support spread.
// display:'swap' + preload:false makes failures non-blocking (fallback font used instead of error).
const serif      = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: false, weight: ['400','500','600','700','800','900'], variable: '--font-playfair' })
const sans       = Inter({            subsets: ['latin'], display: 'swap', preload: false, weight: ['300','400','500','600','700'],       variable: '--font-inter'      })
const montserrat = Montserrat({       subsets: ['latin'], display: 'swap', preload: false, weight: ['300','400','500','600','700','800'], variable: '--font-montserrat' })
const cormorant  = Cormorant_Garamond({subsets:['latin'], display: 'swap', preload: false, weight: ['300','400','500','600','700'],       variable: '--font-cormorant'  })
const ebGaramond = EB_Garamond({      subsets: ['latin'], display: 'swap', preload: false, weight: ['400','500','600','700','800'],       variable: '--font-eb-garamond'})
const lato       = Lato({             subsets: ['latin'], display: 'swap', preload: false, weight: ['300','400','700','900'],             variable: '--font-lato'       })
const oswald     = Oswald({           subsets: ['latin'], display: 'swap', preload: false, weight: ['300','400','500','600','700'],       variable: '--font-oswald'     })
const josefin    = Josefin_Sans({     subsets: ['latin'], display: 'swap', preload: false, weight: ['300','400','600','700'],             variable: '--font-josefin'    })
const raleway    = Raleway({          subsets: ['latin'], display: 'swap', preload: false, weight: ['300','400','500','600','700','800'], variable: '--font-raleway'    })
const cinzel     = Cinzel({           subsets: ['latin'], display: 'swap', preload: false, weight: ['400','500','600','700','800','900'], variable: '--font-cinzel'     })
// adjustFontFallback:false — Next.js has no sizing data for Bodoni Moda, suppresses the warning
const bodoni     = Bodoni_Moda({      subsets: ['latin'], display: 'swap', preload: false, weight: ['400','500','600','700','800','900'], variable: '--font-bodoni', adjustFontFallback: false })

// ── Config fetch ─────────────────────────────────────────────────────────────
// cache() deduplicates: generateMetadata + RootLayout share ONE fetch.
const getSiteConfig = cache(async (): Promise<any> => {
  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL ?? 'http://localhost:3001'}/site-config`,
      { cache: 'no-store' },
    )
    if (res.ok) {
      const json = await res.json()
      return (json?.success && json?.data) ? json.data : json
    }
  } catch {}
  return null
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://murgdur.com'

export async function generateMetadata(): Promise<Metadata> {
  const config      = await getSiteConfig()
  const title       = config?.siteTitle    ?? 'Murgdur'
  const description = config?.footerTagline ?? 'Luxury fashion crafted for the extraordinary.'
  const ogImage     = config?.ogImageUrl  || null
  const favicon     = config?.faviconUrl  || null

  return {
    metadataBase: new URL(SITE_URL),
    ...(favicon && { icons: { icon: favicon, shortcut: favicon, apple: favicon } }),
    title:        { default: title, template: `%s | ${title}` },
    description,
    keywords:     ['luxury fashion', 'luxury clothing', 'designer wear', 'premium fashion India', 'Murgdur'],
    authors:      [{ name: 'Murgdur' }],
    robots: process.env.NODE_ENV === 'production'
      ? { index: true,  follow: true,  googleBot: { index: true,  follow: true  } }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      type:        'website',
      locale:      'en_IN',
      url:         SITE_URL,
      siteName:    title,
      title,
      description,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: { canonical: SITE_URL },
  }
}

// ── Server-side CSS injection ─────────────────────────────────────────────────
function buildCss(config: any): string {
  if (!config) return ''
  const lines: string[] = []

  const family = FONT_MAP[config.fontFamily ?? 'default'] ?? ''
  const size   = `${config.fontSize ?? 16}px`
  const weight =  config.fontWeight ?? '400'
  const style  =  config.fontStyle  ?? 'normal'
  if (family) {
    // Override CSS variables so font-serif / font-sans Tailwind classes pick up the new font
    lines.push(`html{--font-serif:${family};--font-sans:${family};}`)
    // :root body * has specificity 0-1-1 which beats Tailwind class selectors (0-1-0),
    // ensuring the global font truly applies to every visible text element.
    // font-weight is intentionally NOT in this rule — headings need their own weight
    // from globals.css / Tailwind (e.g. font-bold) which would otherwise be overridden.
    lines.push(`:root body *{font-family:${family};}`)
    // Use clamp() so the global font size scales from mobile to desktop
    // At 375px: ~87.5% of configured size; at 1440px: 100%
    const pxVal   = parseFloat(size)
    const minSize = Math.max(14, Math.round(pxVal * 0.875))
    lines.push(`html{font-size:clamp(${minSize}px,${(pxVal/1440*100).toFixed(2)}vw + ${minSize * 0.1}px,${size});}`)
    lines.push(`body{font-weight:${weight};font-style:${style};}`)
  }

  const DEFAULTS: Record<string,string> = { colorGold:'#c9a96e', colorText:'#1a1a1a', colorBg:'#ffffff', colorMuted:'#6f6c64' }
  const VARS:     Record<string,string> = { colorGold:'--color-gold-rgb', colorText:'--color-text-rgb', colorBg:'--color-bg-rgb', colorMuted:'--color-muted-rgb' }
  const cv: string[] = []
  for (const [key, cssVar] of Object.entries(VARS)) {
    const hex = config[key] ?? DEFAULTS[key]
    if (hex && hex.toLowerCase() !== DEFAULTS[key].toLowerCase()) {
      const rgb = hexToRgbChannels(hex)
      if (rgb) cv.push(`${cssVar}:${rgb}`)
    }
  }
  if (cv.length) lines.push(`:root{${cv.join(';')};}`)

  return lines.join('')
}

const fontVars = [
  serif, sans, montserrat, cormorant, ebGaramond,
  lato, oswald, josefin, raleway, cinzel, bodoni,
].map(f => f.variable).join(' ')

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config     = await getSiteConfig()
  const dynamicCss = buildCss(config)
  const siteTitle  = config?.siteTitle  ?? 'Murgdur'
  const ogImage    = config?.ogImageUrl || null

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name:    siteTitle,
    url:     SITE_URL,
    ...(ogImage && { logo: ogImage }),
    sameAs:  [
      'https://instagram.com/murgdur',
      'https://facebook.com/murgdur',
    ],
    contactPoint: {
      '@type':             'ContactPoint',
      contactType:         'customer service',
      availableLanguage:   'English',
      url:                 `${SITE_URL}/contact`,
    },
  }

  const websiteSchema = {
    '@context':        'https://schema.org',
    '@type':           'WebSite',
    name:              siteTitle,
    url:               SITE_URL,
    potentialAction: {
      '@type':       'SearchAction',
      target:        { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/collections/new-arrivals?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {dynamicCss && <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />}
        <Providers siteConfig={config ?? undefined}>
          <SiteChrome>
            <Navbar />
            <CartDrawer />
            <LocalizationPrompt />
          </SiteChrome>
          <main>{children}</main>
          <SiteChrome>
            <Footer />
          </SiteChrome>
        </Providers>
      </body>
    </html>
  )
}
