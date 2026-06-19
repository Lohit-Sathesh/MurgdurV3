import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

const DEFAULT_BUTTONS = [
  { id: 'hero_explore',   label: 'Explore',                href: '/collections/new-arrivals' },
  { id: 'editorial_cta',  label: 'Explore the Collection', href: '/collections/new-arrivals' },
  { id: 'newsletter_btn', label: 'Subscribe',              href: '' },
  { id: 'add_to_cart',    label: 'Add to Bag',             href: '' },
]

const DEFAULT_PRODUCT_ACCORDIONS = [
  { title: 'Find in Store',     content: 'Visit any Murgdur boutique to see this piece in person. Our stylists are available to assist with sizing and styling advice.' },
  { title: 'Delivery & Returns', content: 'Complimentary delivery on all orders. Returns accepted within 14 days of receipt in unworn, original condition with all tags attached.' },
  { title: 'Gifting',           content: 'Add a personalised gift message and complimentary gift wrap at checkout. Available on all orders.' },
]

const DEFAULT_FOOTER_COLUMNS = [
  { title: 'Collections', links: [{ label: 'Men', href: '/collections/men' }, { label: 'Women', href: '/collections/women' }, { label: 'Bags', href: '/collections/bags' }] },
  { title: 'Account',     links: [{ label: 'Orders', href: '/orders' }, { label: 'Wishlist', href: '/wishlist' }] },
  { title: 'Support',     links: [{ label: 'Contact', href: '/contact' }, { label: 'Shipping', href: '/shipping' }, { label: 'Returns', href: '/returns' }] },
  { title: 'Company',     links: [{ label: 'About Us', href: '/about' }] },
]

export const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'new-arrivals',
    isActive: true,
    eyebrow: 'Latest Collection',
    headline: 'New Arrivals',
    description: '',
    buttonLabel: '',
    buttonUrl: '',
  },
  {
    id: 'featured',
    isActive: true,
    eyebrow: 'Curated Pieces',
    headline: 'The Selection',
    description: '',
    buttonLabel: '',
    buttonUrl: '',
  },
  {
    id: 'editorial',
    isActive: true,
    eyebrow: 'Maison Murgdur',
    headline: 'Crafted in silence, worn in confidence.',
    description: 'Every piece begins as an idea refined over months — patterns cut by hand, fabrics chosen for how they age, not just how they arrive. This is design built to outlast the season it was made for.',
    buttonLabel: 'Explore the Collection',
    buttonUrl: '/collections/new-arrivals',
  },
  {
    id: 'philosophy',
    isActive: true,
    eyebrow: 'Philosophy',
    headline: 'Crafted with patience.\nDesigned to endure.',
    description: 'True luxury is not rushed. Every detail, material, and finish is selected to create timeless pieces that remain relevant for years.',
    buttonLabel: '',
    buttonUrl: '',
  },
  {
    id: 'newsletter',
    isActive: true,
    eyebrow: 'Exclusive Access',
    headline: 'Join The Private List',
    description: 'Receive early access to new collections, limited releases, private events, and curated editorial stories.',
    buttonLabel: 'Subscribe',
    buttonUrl: '',
  },
]

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.siteConfig.findUnique({ where: { id: 'main' } })
    if (!config) {
      return this.prisma.siteConfig.create({
        data: {
          id: 'main',
          buttons:           DEFAULT_BUTTONS,
          footerColumns:     DEFAULT_FOOTER_COLUMNS,
          homepageSections:  DEFAULT_HOMEPAGE_SECTIONS,
        },
      })
    }
    return {
      ...config,
      buttons:           (config.buttons           as any[])?.length ? config.buttons           : DEFAULT_BUTTONS,
      footerColumns:     (config.footerColumns     as any[])?.length ? config.footerColumns     : DEFAULT_FOOTER_COLUMNS,
      productAccordions: (config.productAccordions as any[])?.length ? config.productAccordions : DEFAULT_PRODUCT_ACCORDIONS,
      homepageSections:  (config.homepageSections  as any[])?.length ? config.homepageSections  : DEFAULT_HOMEPAGE_SECTIONS,
    }
  }

  async updateConfig(data: {
    fontFamily?:             string
    fontSize?:               number
    fontWeight?:             string
    fontStyle?:              string
    siteTitle?:              string
    siteMotto?:              string
    buttons?:                any[]
    colorGold?:              string
    colorText?:              string
    colorBg?:                string
    colorMuted?:             string
    footerTagline?:          string
    footerNote?:             string
    footerColumns?:          any[]
    textStyles?:             any
    productAccordions?:      any[]
    homepageSections?:       any[]
    sizeGuideContactText?:   string
    sizeGuideContactLinkText?: string
    sizeGuideContactLinkUrl?:  string
    shippingCost?:           number
    taxRate?:                number
    taxLabel?:               string
    whatsappNumber?:          string
    whatsappMessageTemplate?: string
    whatsappImageUrl?:        string
    invoiceEmailSubject?:     string
    invoiceEmailBody?:        string
    faviconUrl?:              string
    ogImageUrl?:              string
    invoiceLogoUrl?:          string
    invoiceCompanyName?:      string
    invoiceCompanyAddress?:   string
    invoiceFooterText?:       string
  }) {
    return this.prisma.siteConfig.upsert({
      where:  { id: 'main' },
      update: data,
      create: {
        id: 'main',
        ...data,
        buttons:          data.buttons          ?? DEFAULT_BUTTONS,
        footerColumns:    data.footerColumns    ?? DEFAULT_FOOTER_COLUMNS,
        productAccordions: data.productAccordions ?? DEFAULT_PRODUCT_ACCORDIONS,
        homepageSections: data.homepageSections ?? DEFAULT_HOMEPAGE_SECTIONS,
      },
    })
  }
}
