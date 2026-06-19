'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { FONT_MAP, hexToRgbChannels } from '@/lib/site-config'

export { FONT_MAP } from '@/lib/site-config'

// ── Button / Footer types ────────────────────────────────────────────────────

export interface SiteButton  { id: string; label: string; href: string }
export interface FooterLink  { label: string; href: string }
export interface FooterColumn { title: string; links: FooterLink[] }
export interface ProductAccordion { title: string; content: string }
export interface HomepageSection {
  id:          string
  isActive:    boolean
  eyebrow:     string
  headline:    string
  description: string
  buttonLabel: string
  buttonUrl:   string
}

// ── Per-section text style ───────────────────────────────────────────────────

export interface TextStyle {
  fontFamily:      string   // key in FONT_MAP; '' / 'default' = inherit
  fontSize:        number   // px; 0 = inherit component default
  fontWeight:      string   // '400'|'500'|'600'|'700'|'800'|'900'; '' = inherit
  letterSpacing:   number   // em; 0 = inherit (e.g. 0.15 for 0.15em)
  color:           string   // hex; '' = inherit
  shadowIntensity: number   // 0–10
  glowIntensity:   number   // 0–10
}

export type TextStyleKey =
  | 'navTitle'         // Navbar wordmark
  | 'navMotto'         // Navbar tagline / subheading (e.g. "Maison Murgdur")
  | 'navLinks'         // Nav menu / drawer links
  | 'heroHeadline'     // Hero slider big headline
  | 'heroSubheading'   // Hero slider sub-line
  | 'scrollGallery'    // Scroll gallery headline + sub
  | 'sectionHeading'   // Editorial / page section headings
  | 'sectionBody'      // Editorial / page body paragraphs
  | 'editorialHeading' // "Crafted in silence…" editorial block heading
  | 'editorialBody'    // Editorial block body text
  | 'homepageSection'  // Homepage section headings (New Arrivals, The Selection…)
  | 'productCard'      // Product name on grid cards
  | 'productPage'      // Product name on detail page
  | 'footer'           // Footer text
  | 'profile'          // Profile page text
  | 'bodyText'         // General body / paragraph text site-wide

export type TextStyles = Record<TextStyleKey, TextStyle>

const BLANK_STYLE: TextStyle = { fontFamily: 'default', fontSize: 0, fontWeight: '', letterSpacing: 0, color: '', shadowIntensity: 0, glowIntensity: 0 }

export const DEFAULT_TEXT_STYLES: TextStyles = {
  navTitle:         { ...BLANK_STYLE },
  navMotto:         { ...BLANK_STYLE },
  navLinks:         { ...BLANK_STYLE },
  heroHeadline:     { ...BLANK_STYLE },
  heroSubheading:   { ...BLANK_STYLE },
  scrollGallery:    { ...BLANK_STYLE },
  sectionHeading:   { ...BLANK_STYLE },
  sectionBody:      { ...BLANK_STYLE },
  editorialHeading: { ...BLANK_STYLE },
  editorialBody:    { ...BLANK_STYLE },
  homepageSection:  { ...BLANK_STYLE },
  productCard:      { ...BLANK_STYLE },
  productPage:      { ...BLANK_STYLE },
  footer:           { ...BLANK_STYLE },
  profile:          { ...BLANK_STYLE },
  bodyText:         { ...BLANK_STYLE },
}

// ── SiteConfig ───────────────────────────────────────────────────────────────

export interface SiteConfig {
  fontFamily:    string
  fontSize:      number
  fontWeight:    string
  fontStyle:     string
  siteTitle:     string
  siteMotto:     string
  buttons:       SiteButton[]
  colorGold:     string
  colorText:     string
  colorBg:       string
  colorMuted:    string
  footerTagline:     string
  footerNote:        string
  footerColumns:     FooterColumn[]
  textStyles:        TextStyles
  productAccordions:      ProductAccordion[]
  homepageSections:       HomepageSection[]
  sizeGuideContactText:   string
  sizeGuideContactLinkText: string
  sizeGuideContactLinkUrl:  string
  shippingCost:    number   // flat fee per order; 0 = free shipping
  taxRate:         number   // percentage, e.g. 18 for 18%
  taxLabel:        string   // shown to customer, e.g. "GST" or "VAT"
  whatsappNumber:          string
  whatsappMessageTemplate: string
  whatsappImageUrl:        string
  invoiceEmailSubject:     string
  invoiceEmailBody:        string
  faviconUrl:              string
  ogImageUrl:              string
  invoiceLogoUrl:          string
  invoiceCompanyName:      string
  invoiceCompanyAddress:   string
  invoiceFooterText:       string
}

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  { title: 'Collections', links: [{ label: 'Men', href: '/collections/men' }, { label: 'Women', href: '/collections/women' }, { label: 'Bags', href: '/collections/bags' }] },
  { title: 'Account',     links: [{ label: 'Orders', href: '/orders' }, { label: 'Wishlist', href: '/wishlist' }] },
  { title: 'Support',     links: [{ label: 'Contact', href: '/contact' }, { label: 'Shipping', href: '/shipping' }, { label: 'Returns', href: '/returns' }] },
  { title: 'Company',     links: [{ label: 'About Us', href: '/about' }] },
]

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  fontFamily:    'default',
  fontSize:      16,
  fontWeight:    '400',
  fontStyle:     'normal',
  siteTitle:     'MURGDUR',
  siteMotto:     'Maison Murgdur',
  colorGold:     '#c9a96e',
  colorText:     '#1a1a1a',
  colorBg:       '#ffffff',
  colorMuted:    '#6f6c64',
  footerTagline:     'Luxury fashion crafted for the extraordinary.',
  footerNote:        '© 2026 Murgdur. All rights reserved.',
  footerColumns:     DEFAULT_FOOTER_COLUMNS,
  textStyles:        DEFAULT_TEXT_STYLES,
  productAccordions: [
    { title: 'Find in Store',     content: 'Visit any Murgdur boutique to see this piece in person. Our stylists are available to assist with sizing and styling advice.' },
    { title: 'Delivery & Returns', content: 'Complimentary delivery on all orders. Returns accepted within 14 days of receipt in unworn, original condition with all tags attached.' },
    { title: 'Gifting',           content: 'Add a personalised gift message and complimentary gift wrap at checkout. Available on all orders.' },
  ],
  homepageSections: [
    { id: 'new-arrivals', isActive: true, eyebrow: 'Latest Collection',   headline: 'New Arrivals',                              description: '', buttonLabel: '', buttonUrl: '' },
    { id: 'featured',     isActive: true, eyebrow: 'Curated Pieces',      headline: 'The Selection',                             description: '', buttonLabel: '', buttonUrl: '' },
    { id: 'editorial',    isActive: true, eyebrow: 'Maison Murgdur',      headline: 'Crafted in silence, worn in confidence.',   description: 'Every piece begins as an idea refined over months — patterns cut by hand, fabrics chosen for how they age, not just how they arrive. This is design built to outlast the season it was made for.', buttonLabel: 'Explore the Collection', buttonUrl: '/collections/new-arrivals' },
    { id: 'philosophy',   isActive: true, eyebrow: 'Philosophy',           headline: 'Crafted with patience.\nDesigned to endure.', description: 'True luxury is not rushed. Every detail, material, and finish is selected to create timeless pieces that remain relevant for years.', buttonLabel: '', buttonUrl: '' },
    { id: 'newsletter',   isActive: true, eyebrow: 'Exclusive Access',    headline: 'Join The Private List',                     description: 'Receive early access to new collections, limited releases, private events, and curated editorial stories.', buttonLabel: 'Subscribe', buttonUrl: '' },
  ],
  sizeGuideContactText:     'Need help with sizing?',
  sizeGuideContactLinkText: 'Contact our stylists',
  sizeGuideContactLinkUrl:  '/contact',
  shippingCost:   0,
  taxRate:        0,
  taxLabel:       'Tax',
  whatsappNumber:          '',
  whatsappMessageTemplate: '',
  whatsappImageUrl:        '',
  invoiceEmailSubject:     '',
  invoiceEmailBody:        '',
  faviconUrl:              '',
  ogImageUrl:              '',
  invoiceLogoUrl:          '',
  invoiceCompanyName:      'Murgdur',
  invoiceCompanyAddress:   '',
  invoiceFooterText:       'Thank you for shopping with Murgdur!',
  buttons: [
    { id: 'hero_explore',   label: 'Explore',                href: '/collections/new-arrivals' },
    { id: 'editorial_cta',  label: 'Explore the Collection', href: '/collections/new-arrivals' },
    { id: 'newsletter_btn', label: 'Subscribe',              href: '' },
    { id: 'add_to_cart',    label: 'Add to Bag',             href: '' },
  ],
}

// ── CSS helpers ──────────────────────────────────────────────────────────────

export function buildConfigCss(config: Partial<SiteConfig>): string {
  const lines: string[] = []

  const family = FONT_MAP[config.fontFamily ?? 'default'] ?? ''
  const size   = `${config.fontSize   ?? 16}px`
  const weight =  config.fontWeight   ?? '400'
  const style  =  config.fontStyle    ?? 'normal'
  if (family) {
    lines.push(`html{--font-serif:${family};--font-sans:${family};}`)
    lines.push(`:root body *{font-family:${family};}`)
    lines.push(`html{font-size:${size};}`)
    lines.push(`body{font-weight:${weight};font-style:${style};}`)
  }

  const DEFAULTS: Record<string, string> = { colorGold: '#c9a96e', colorText: '#1a1a1a', colorBg: '#ffffff', colorMuted: '#6f6c64' }
  const VARS:     Record<string, string> = { colorGold: '--color-gold-rgb', colorText: '--color-text-rgb', colorBg: '--color-bg-rgb', colorMuted: '--color-muted-rgb' }
  const cv: string[] = []
  for (const [key, cssVar] of Object.entries(VARS)) {
    const hex = (config as any)[key] ?? DEFAULTS[key]
    if (hex && hex.toLowerCase() !== DEFAULTS[key].toLowerCase()) {
      const rgb = hexToRgbChannels(hex)
      if (rgb) cv.push(`${cssVar}:${rgb}`)
    }
  }
  if (cv.length) lines.push(`:root{${cv.join(';')};}`)

  return lines.join('')
}

/** Convert a TextStyle object → React inline CSS properties. */
export function buildTextStyle(s: TextStyle | undefined): React.CSSProperties {
  if (!s) return {}
  const css: React.CSSProperties = {}

  const family = FONT_MAP[s.fontFamily ?? 'default'] ?? ''
  if (family) css.fontFamily = family
  if ((s.fontSize ?? 0) > 0) {
    const px = s.fontSize
    // clamp() ensures the admin-configured size only applies at desktop width
    // and scales down proportionally so it never overflows small screens.
    // At 375px (iPhone SE): ~35% of target. At 1440px: 100% of target.
    const minPx = Math.max(14, Math.round(px * 0.35))
    const vw    = (px / 1440 * 100).toFixed(2)
    css.fontSize = `clamp(${minPx}px, ${vw}vw, ${px}px)`
  }
  if (s.fontWeight) css.fontWeight = s.fontWeight
  if ((s.letterSpacing ?? 0) !== 0) css.letterSpacing = `${s.letterSpacing}em`
  if (s.color) css.color = s.color

  const shadows: string[] = []
  if ((s.shadowIntensity ?? 0) > 0) {
    const n = s.shadowIntensity
    const blur    = n * 2
    const opacity = Math.min(n * 0.07, 0.7).toFixed(2)
    shadows.push(`1px 2px ${blur}px rgba(0,0,0,${opacity})`)
    if (n > 4) shadows.push(`3px 5px ${n * 4}px rgba(0,0,0,${(n * 0.035).toFixed(2)})`)
  }
  if ((s.glowIntensity ?? 0) > 0) {
    const n = s.glowIntensity
    const c = s.color || '#c9a96e'
    shadows.push(
      `0 0 ${n * 2}px ${c}cc`,
      `0 0 ${n * 6}px ${c}77`,
      `0 0 ${n * 14}px ${c}33`,
    )
  }
  if (shadows.length) css.textShadow = shadows.join(', ')

  return css
}

// ── Context + Provider ───────────────────────────────────────────────────────

const SiteConfigContext = createContext<SiteConfig>(DEFAULT_SITE_CONFIG)

export function useSiteConfig()                         { return useContext(SiteConfigContext) }
export function useButton(id: string): SiteButton {
  const { buttons } = useSiteConfig()
  return buttons.find(b => b.id === id) ?? DEFAULT_SITE_CONFIG.buttons.find(b => b.id === id) ?? { id, label: id, href: '/' }
}
export function useTextStyle(key: TextStyleKey): React.CSSProperties {
  const { textStyles } = useSiteConfig()
  return buildTextStyle(textStyles?.[key])
}

export const SITE_CONFIG_UPDATED_EVENT = 'site-config-updated'

function mergeConfig(src: Partial<SiteConfig> | null | undefined): SiteConfig {
  const rawStyles = (src as any)?.textStyles ?? {}
  const textStyles: TextStyles = { ...DEFAULT_TEXT_STYLES }
  for (const key of Object.keys(DEFAULT_TEXT_STYLES) as TextStyleKey[]) {
    if (rawStyles[key]) textStyles[key] = { ...BLANK_STYLE, ...rawStyles[key] }
  }
  return {
    ...DEFAULT_SITE_CONFIG,
    ...src,
    textStyles,
    buttons: ((src?.buttons as SiteButton[]) ?? []).length ? (src?.buttons as SiteButton[]) : DEFAULT_SITE_CONFIG.buttons,
    footerColumns:     ((src?.footerColumns     as FooterColumn[])     ?? []).length ? (src?.footerColumns     as FooterColumn[])     : DEFAULT_SITE_CONFIG.footerColumns,
    productAccordions: ((src?.productAccordions as ProductAccordion[]) ?? []).length ? (src?.productAccordions as ProductAccordion[]) : DEFAULT_SITE_CONFIG.productAccordions,
    homepageSections:  ((src?.homepageSections  as HomepageSection[])  ?? []).length ? (src?.homepageSections  as HomepageSection[])  : DEFAULT_SITE_CONFIG.homepageSections,
  }
}

export function SiteConfigProvider({ children, initialConfig }: { children: React.ReactNode; initialConfig?: Partial<SiteConfig> }) {
  const [liveConfig, setLiveConfig] = useState<Partial<SiteConfig> | null>(null)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

    function fetchConfig() {
      fetch(`${base}/site-config`)
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          const data = (json?.success && json?.data) ? json.data : json
          if (data) setLiveConfig(data)
        })
        .catch(() => {})
    }

    fetchConfig()
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, fetchConfig)
    return () => window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, fetchConfig)
  }, [])

  const config = mergeConfig(liveConfig ?? initialConfig)

  useEffect(() => {
    const css = buildConfigCss(config)
    let el = document.getElementById('site-cfg') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'site-cfg'
      document.head.appendChild(el)
    }
    el.textContent = css
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.fontFamily, config.fontSize, config.fontWeight, config.fontStyle,
      config.colorGold, config.colorText, config.colorBg, config.colorMuted])

  return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>
}
