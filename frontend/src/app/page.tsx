import { HeroSlider }            from '@/components/cinematic/HeroSlider'
import { ScrollVideoPlayer }      from '@/components/cinematic/ScrollVideoPlayer'
import { ScrollGallery }          from '@/components/cinematic/ScrollGallery'
import { EditorialSection }       from '@/components/cinematic/EditorialSection'
import { HomepageSectionHeading } from '@/components/cinematic/HomepageSectionHeading'
import { ProductGrid }            from '@/components/shop/ProductGrid'
import { NewsletterForm }         from '@/components/ui/NewsletterForm'
import { api }                    from '@/lib/api'
import type { HeroSlide }         from '@/components/cinematic/HeroSlider'
import type { HomepageSection }   from '@/context/SiteConfigContext'

export const revalidate = 30

async function getProducts(query: string) {
  try {
    const res = await api.get(`/products?${query}`)
    return res.data?.products ?? res.data ?? []
  } catch { return [] }
}

async function getHomepageSlides(): Promise<HeroSlide[]> {
  try {
    const res = await api.get('/homepage/slides')
    return res.data ?? []
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

// ── Generic renderers ─────────────────────────────────────────────────────────

// Generic editorial-style section (used for custom sections + philosophy)
function GenericSection({ sec, gradient = false }: { sec: HomepageSection; gradient?: boolean }) {
  return (
    <section className={`py-32 ${gradient ? 'border-t border-b border-luxury-gray bg-gradient-to-b from-luxury-black to-luxury-gray' : 'border-t border-luxury-gray'}`}>
      <div className="max-w-5xl mx-auto px-8 text-center">
        {sec.eyebrow && (
          <p className="text-luxury-gold uppercase tracking-[0.4em] text-xs mb-6">{sec.eyebrow}</p>
        )}
        {sec.headline && (
          <h2 className="font-serif text-5xl text-luxury-white leading-tight mb-8 whitespace-pre-line">
            {sec.headline}
          </h2>
        )}
        {sec.description && (
          <p className="text-luxury-muted max-w-2xl mx-auto text-lg">{sec.description}</p>
        )}
        {sec.buttonLabel && sec.buttonUrl && (
          <a href={sec.buttonUrl}
            className="mt-10 inline-block border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase px-10 py-4 hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500">
            {sec.buttonLabel}
          </a>
        )}
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [newArrivals, featured, slides, cfg] = await Promise.all([
    getProducts('newArrivals=true&limit=8'),
    getProducts('featured=true&limit=8'),
    getHomepageSlides(),
    getSiteConfig(),
  ])

  const DEFAULT_SECTIONS: HomepageSection[] = [
    { id: 'new-arrivals', isActive: true, eyebrow: 'Latest Collection',   headline: 'New Arrivals', description: '', buttonLabel: '', buttonUrl: '' },
    { id: 'featured',     isActive: true, eyebrow: 'Curated Pieces',      headline: 'The Selection', description: '', buttonLabel: '', buttonUrl: '' },
    { id: 'editorial',    isActive: true, eyebrow: 'Maison Murgdur',      headline: 'Crafted in silence, worn in confidence.', description: 'Every piece begins as an idea refined over months — patterns cut by hand, fabrics chosen for how they age, not just how they arrive. This is design built to outlast the season it was made for.', buttonLabel: 'Explore the Collection', buttonUrl: '/collections/new-arrivals' },
    { id: 'philosophy',   isActive: true, eyebrow: 'Philosophy',          headline: 'Crafted with patience.\nDesigned to endure.', description: 'True luxury is not rushed. Every detail, material, and finish is selected to create timeless pieces that remain relevant for years.', buttonLabel: '', buttonUrl: '' },
    { id: 'newsletter',   isActive: true, eyebrow: 'Exclusive Access',    headline: 'Join The Private List', description: 'Receive early access to new collections, limited releases, private events, and curated editorial stories.', buttonLabel: 'Subscribe', buttonUrl: '' },
  ]

  const sections: HomepageSection[] = (cfg?.homepageSections?.length ? cfg.homepageSections : DEFAULT_SECTIONS)
    .filter((s: HomepageSection) => s.isActive)

  const heroSlides   = slides.filter((s: HeroSlide) => (s.placement ?? 'hero') === 'hero')
  // ALL scroll slides (image AND video) go through ScrollGallery, which renders
  // videos with autoPlay/muted/loop — a normal looping video, not frame-scrubbing.
  const scrollSlides = slides.filter((s: HeroSlide) => s.placement === 'scroll')
  // ScrollVideoPlayer (cinematic scrub) only activates for a dedicated 'cinematic'
  // placement video — if none exists it is simply hidden.
  const videoSlide   = slides.find((s: HeroSlide)  => s.placement === 'cinematic' && s.mediaType === 'video')

  // Track how many scroll slides have been used
  let scrollUsed = 0

  return (
    <>
      <HeroSlider slides={heroSlides} />

      {sections.map((sec, idx) => {
        // After the 1st section, inject scroll[0]
        const injectScroll0 = idx === 1 && scrollSlides[scrollUsed] != null
        // After the 2nd section, inject video + scroll[1]
        const injectVideo   = idx === 2
        const injectScroll1 = idx === 2 && scrollSlides[scrollUsed + (injectScroll0 ? 1 : 0)] != null

        const scroll0 = injectScroll0 ? scrollSlides[scrollUsed++] : null
        const scroll1 = injectScroll1 ? scrollSlides[scrollUsed++] : null

        return (
          <div key={sec.id}>
            {/* Inject scroll gallery after section 1 */}
            {scroll0 && <ScrollGallery slides={[scroll0]} />}

            {/* Inject video after section 2 */}
            {injectVideo && <ScrollVideoPlayer videoUrl={videoSlide?.mediaUrl} />}

            {/* Inject scroll gallery after video */}
            {scroll1 && <ScrollGallery slides={[scroll1]} />}

            {/* ── Render the section ── */}
            {sec.id === 'new-arrivals' && (
              <section className="px-8 py-24 md:py-32">
                <HomepageSectionHeading sec={sec} />
                <ProductGrid products={newArrivals.slice(0, 4)} />
              </section>
            )}

            {sec.id === 'featured' && (
              <section className="px-8 py-24 md:py-32">
                <HomepageSectionHeading sec={sec} />
                <ProductGrid products={(featured.length ? featured : newArrivals.slice(4, 8)).slice(0, 4)} />
              </section>
            )}

            {sec.id === 'editorial' && (
              <EditorialSection
                eyebrow={sec.eyebrow}
                heading={sec.headline}
                body={sec.description}
                linkLabel={sec.buttonLabel || 'Explore the Collection'}
                linkUrl={sec.buttonUrl   || '/collections/new-arrivals'}
              />
            )}

            {sec.id === 'philosophy' && (
              <GenericSection sec={sec} gradient />
            )}

            {sec.id === 'newsletter' && (
              <section className="py-32 border-t border-luxury-gray bg-gradient-to-b from-luxury-gray to-luxury-black">
                <div className="max-w-4xl mx-auto px-8">
                  <div className="bg-luxury-gray/40 backdrop-blur-xl border border-luxury-gray rounded-[32px] p-12 text-center shadow-2xl">
                    {sec.eyebrow && (
                      <p className="text-luxury-gold uppercase tracking-[0.3em] text-xs mb-4">{sec.eyebrow}</p>
                    )}
                    {sec.headline && (
                      <h2 className="font-serif text-5xl text-luxury-white mb-6">{sec.headline}</h2>
                    )}
                    {sec.description && (
                      <p className="text-luxury-muted max-w-xl mx-auto mb-10">{sec.description}</p>
                    )}
                    <NewsletterForm
                      layoutClassName="flex flex-col md:flex-row gap-4 justify-center"
                      inputClassName="bg-luxury-black border border-luxury-gray px-6 py-4 min-w-[320px] text-luxury-white rounded-full focus:border-luxury-gold focus:outline-none transition-all duration-500"
                      buttonClassName="px-8 py-4 border border-luxury-gold text-luxury-gold rounded-full hover:bg-luxury-gold hover:text-luxury-black transition-all duration-500"
                      buttonLabel={sec.buttonLabel || 'Subscribe'}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Custom sections — any id not matching the 5 built-in ones */}
            {!['new-arrivals','featured','editorial','philosophy','newsletter'].includes(sec.id) && (
              <GenericSection sec={sec} gradient={idx % 2 === 0} />
            )}
          </div>
        )
      })}

      {/* Any remaining scroll slides after all sections */}
      {scrollSlides.slice(scrollUsed).map((slide: HeroSlide, i: number) => (
        <ScrollGallery key={i} slides={[slide]} />
      ))}
    </>
  )
}
