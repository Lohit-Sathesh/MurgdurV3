import { HeroSlider }               from '@/components/cinematic/HeroSlider'
import { ScrollGallery }             from '@/components/cinematic/ScrollGallery'
import { EditorialSection }          from '@/components/cinematic/EditorialSection'
import { HomepageSectionHeading }    from '@/components/cinematic/HomepageSectionHeading'
import { ProductGrid }               from '@/components/shop/ProductGrid'
import { NewsletterForm }            from '@/components/ui/NewsletterForm'
import { api }                       from '@/lib/api'
import type { HeroSlide }            from '@/components/cinematic/HeroSlider'
import type { HomepageSection }      from '@/context/SiteConfigContext'

export const revalidate = 30

async function getSlides(): Promise<HeroSlide[]> {
  try {
    const res = await api.get('/homepage/slides')
    return res.data ?? []
  } catch { return [] }
}

async function getBlocks(): Promise<any[]> {
  try {
    const res = await api.get('/homepage/blocks')
    const data = res.data?.data ?? res.data
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

async function getProductsByIds(ids: string[]): Promise<any[]> {
  if (!ids?.length) return []
  try {
    const res = await api.get('/products', { params: { ids: ids.join(','), limit: ids.length } })
    const products = res.data?.products ?? res.data ?? []
    // Re-order to match the stored ids order
    const map = new Map(products.map((p: any) => [p.id, p]))
    return ids.map(id => map.get(id)).filter(Boolean)
  } catch { return [] }
}

async function getSiteConfig() {
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
}

export default async function HomePage() {
  const [slides, blocks, cfg] = await Promise.all([
    getSlides(),
    getBlocks(),
    getSiteConfig(),
  ])

  const heroSlides   = slides.filter((s: HeroSlide) => (s.placement ?? 'hero') === 'hero')
  const scrollSlides = slides.filter((s: HeroSlide) => s.placement === 'scroll')

  // Build a map of scrollSlide id → slide for quick lookup
  const scrollMap = new Map(scrollSlides.map((s: HeroSlide & { id?: string }) => [s.id, s]))

  // Prefetch products for all product blocks
  const allProductIds = blocks
    .filter((b: any) => b.type === 'products')
    .flatMap((b: any) => b.content?.productIds ?? [])
  const allProducts = await getProductsByIds([...new Set(allProductIds)])
  const productMap = new Map(allProducts.map(p => [p.id, p]))

  // Newsletter config
  const newsletterSec = (cfg?.homepageSections as HomepageSection[] | undefined)
    ?.find(s => s.id === 'newsletter')

  return (
    <>
      {/* ── Hero Slider ── always first ──────────────────────────────────── */}
      <HeroSlider slides={heroSlides} />

      {/* ── Page blocks ──────────────────────────────────────────────────── */}
      {blocks.map((block: any) => {
        const c = block.content ?? {}

        // ── Scroll section ──────────────────────────────────────────────
        if (block.type === 'scroll') {
          const slide = scrollMap.get(c.slideId)
          if (!slide) return null
          return <ScrollGallery key={block.id} slides={[slide as HeroSlide]} />
        }

        // ── Product block ───────────────────────────────────────────────
        if (block.type === 'products') {
          const products = (c.productIds ?? []).map((id: string) => productMap.get(id)).filter(Boolean)
          const sec: HomepageSection = {
            id: block.id, isActive: true,
            eyebrow: c.eyebrow ?? '', headline: c.heading ?? '',
            description: c.subheading ?? '', buttonLabel: '', buttonUrl: '',
          }
          return (
            <section key={block.id} className="px-8 py-24 md:py-32">
              {(sec.eyebrow || sec.headline) && <HomepageSectionHeading sec={sec} />}
              <ProductGrid products={products} />
            </section>
          )
        }

        // ── Editorial block ─────────────────────────────────────────────
        if (block.type === 'editorial') {
          if (c.eyebrow === 'Philosophy' || (!c.buttonLabel && !c.buttonUrl)) {
            // Philosophy-style: gradient bg centred text
            return (
              <section key={block.id} className="py-16 md:py-32 border-t border-b border-luxury-gray bg-gradient-to-b from-luxury-black to-luxury-gray">
                <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
                  {c.eyebrow && <p className="text-luxury-gold uppercase tracking-[0.2em] sm:tracking-[0.4em] text-xs mb-4 md:mb-6">{c.eyebrow}</p>}
                  {c.headline && <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-luxury-white leading-tight mb-5 md:mb-8 whitespace-pre-line">{c.headline}</h2>}
                  {c.description && <p className="text-luxury-muted max-w-2xl mx-auto text-base md:text-lg">{c.description}</p>}
                </div>
              </section>
            )
          }
          // Editorial-style: brand statement with link
          return (
            <EditorialSection key={block.id}
              eyebrow={c.eyebrow}
              heading={c.headline}
              body={c.description}
              linkLabel={c.buttonLabel || 'Explore'}
              linkUrl={c.buttonUrl || '/collections/new-arrivals'}
            />
          )
        }

        return null
      })}

      {/* ── Newsletter ── fixed footer element ───────────────────────────── */}
      <section className="py-32 border-t border-luxury-gray bg-gradient-to-b from-luxury-gray to-luxury-black">
        <div className="max-w-4xl mx-auto px-8">
          <div className="bg-luxury-gray/40 backdrop-blur-xl border border-luxury-gray rounded-[32px] p-12 text-center shadow-2xl">
            <p className="text-luxury-gold uppercase tracking-[0.3em] text-xs mb-4">
              {newsletterSec?.eyebrow || 'Exclusive Access'}
            </p>
            <h2 className="font-serif text-5xl text-luxury-white mb-6">
              {newsletterSec?.headline || 'Join The Private List'}
            </h2>
            {(newsletterSec?.description || 'Receive early access to new collections, limited releases, private events, and curated editorial stories.') && (
              <p className="text-luxury-muted max-w-xl mx-auto mb-10">
                {newsletterSec?.description || 'Receive early access to new collections, limited releases, private events, and curated editorial stories.'}
              </p>
            )}
            <NewsletterForm
              layoutClassName="flex flex-col md:flex-row gap-4 justify-center"
              inputClassName="bg-luxury-black border border-luxury-gray px-4 sm:px-6 py-3 sm:py-4 w-full sm:min-w-[280px] md:min-w-[320px] text-luxury-white rounded-full focus:border-luxury-gold focus:outline-none transition-all duration-500"
              buttonClassName="px-8 py-4 border border-luxury-gold text-luxury-gold rounded-full hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500"
              buttonLabel={newsletterSec?.buttonLabel || 'Subscribe'}
            />
          </div>
        </div>
      </section>
    </>
  )
}
