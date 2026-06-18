'use client'
import { useEffect, useRef, useState } from 'react'
import { ProductCard } from '@/components/ui/ProductCard'
import { ScrollGallery }  from '@/components/cinematic/ScrollGallery'
import { positionClasses } from '@/components/admin/TextPositionPicker'
import { api } from '@/lib/api'
import type { Product } from '@/types/product'
import type { HeroSlide } from '@/components/cinematic/HeroSlider'

const PAGE_SIZE   = 24
const COLS_DESKTOP = 4   // products per row at lg breakpoint

export interface GallerySlide extends HeroSlide {
  showAfterRows?: number   // inject after this many product rows (default 1)
  // layout values: full | split-left-image-products | split-right-image-products
  //                    | split-left-image-text      | split-right-image-text
  // (legacy 'half' treated as split-left-image-products)
}

interface ProductGridProps {
  products:      Product[]
  total?:        number
  query?:        Record<string, string | undefined>
  gallerySlides?: GallerySlide[]
}

// ── Segment builder: respects showAfterRows ───────────────────────────────────

type Segment =
  | { type: 'grid';         products: Product[] }
  | { type: 'full-image';   slide: GallerySlide }
  | { type: 'split';        slide: GallerySlide; products: Product[]; imageLeft: boolean; content: 'products' | 'text' }

function buildSegments(products: Product[], gallerySlides: GallerySlide[]): Segment[] {
  const PRODS_PER_ROW = COLS_DESKTOP

  // Map showAfterRows → slide (sorted so row 1 comes before row 3, etc.)
  const sorted = [...gallerySlides].sort((a, b) => (a.showAfterRows ?? 1) - (b.showAfterRows ?? 1))
  const slidesByRow = new Map<number, GallerySlide>()
  sorted.forEach(s => slidesByRow.set(s.showAfterRows ?? 1, s))

  const segments: Segment[] = []
  let rowIdx = 0
  let pIdx   = 0

  while (pIdx < products.length) {
    const row = products.slice(pIdx, pIdx + PRODS_PER_ROW)
    rowIdx++
    pIdx += row.length

    // Add this row's products (we batch adjacent rows into one grid segment below)
    segments.push({ type: 'grid', products: row })

    // Inject gallery slide after this row if one is configured here
    const slide = slidesByRow.get(rowIdx)
    if (slide) {
      slidesByRow.delete(rowIdx)
      const layout: string = slide.layout ?? 'full'

      if (layout === 'full') {
        segments.push({ type: 'full-image', slide })
      } else {
        const imageLeft = ['split-left-image-products', 'split-left-image-text', 'half'].includes(layout)
        const content: 'products' | 'text' = ['split-left-image-text', 'split-right-image-text'].includes(layout) ? 'text' : 'products'

        // For product splits, grab next 4 products
        let splitProducts: Product[] = []
        if (content === 'products') {
          splitProducts = products.slice(pIdx, pIdx + 4)
          pIdx += splitProducts.length
        }

        segments.push({ type: 'split', slide, products: splitProducts, imageLeft, content })
      }
    }
  }

  // Any slides not yet injected (e.g., showAfterRows > total rows) → append at end
  slidesByRow.forEach(slide => {
    const layout: string = slide.layout ?? 'full'
    if (layout === 'full') {
      segments.push({ type: 'full-image', slide })
    } else {
      const imageLeft = ['split-left-image-products', 'split-left-image-text', 'half'].includes(layout)
      const content: 'products' | 'text' = ['split-left-image-text', 'split-right-image-text'].includes(layout) ? 'text' : 'products'
      segments.push({ type: 'split', slide, products: [], imageLeft, content })
    }
  })

  // Merge consecutive grid segments into one
  return segments.reduce<Segment[]>((acc, seg) => {
    if (seg.type === 'grid' && acc.length > 0 && acc[acc.length - 1].type === 'grid') {
      const prev = acc[acc.length - 1] as { type: 'grid'; products: Product[] }
      prev.products = [...prev.products, ...seg.products]
      return acc
    }
    return [...acc, seg]
  }, [])
}

// ── Media half ────────────────────────────────────────────────────────────────

function MediaHalf({ slide }: { slide: GallerySlide }) {
  return slide.mediaType === 'video'
    ? <video src={slide.mediaUrl} muted loop autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={slide.mediaUrl} alt={slide.headline ?? ''} className="absolute inset-0 w-full h-full object-cover" />
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProductGrid({ products: initialProducts, total, query, gallerySlides = [] }: ProductGridProps) {
  const [products, setProducts] = useState(initialProducts)
  const [loading,  setLoading]  = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setProducts(initialProducts) }, [initialProducts])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || total === undefined) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '600px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [products, loading, total])

  async function loadMore() {
    if (loading || total === undefined || products.length >= total) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(query ?? {}).forEach(([k, v]) => { if (v) params.set(k, v) })
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(products.length))
      const res = await api.get(`/products?${params.toString()}`)
      setProducts(prev => [...prev, ...(res.data.products ?? [])])
    } catch {}
    finally { setLoading(false) }
  }

  if (!products?.length) return (
    <div className="text-center py-24">
      <p className="text-luxury-muted tracking-luxury text-sm uppercase">No products found</p>
    </div>
  )

  const segments = buildSegments(products, gallerySlides)

  return (
    <div>
      {segments.map((seg, i) => {

        // ── Full product grid row ──────────────────────────────────────
        if (seg.type === 'grid') {
          return (
            <div key={`grid-${i}`}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
              {seg.products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        }

        // ── Full-width cinematic image ─────────────────────────────────
        if (seg.type === 'full-image') {
          return <ScrollGallery key={`img-${i}`} slides={[seg.slide]} />
        }

        // ── Split layouts ──────────────────────────────────────────────
        const { slide, imageLeft, content } = seg as Extract<Segment, { type: 'split' }>
        const light = slide.textTheme === 'light'

        const imageSide = (
          <div className="relative h-full overflow-hidden">
            <MediaHalf slide={slide} />
          </div>
        )

        const productsSide = content === 'text' ? (
          // Text panel
          <div className={`h-full bg-luxury-black flex flex-col ${positionClasses(slide.textPosition)} px-4 sm:px-8 md:px-12`}>
            {slide.headline && (
              <h2 className={`font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.08em] sm:tracking-luxury mb-3 md:mb-4 ${light ? 'text-luxury-black' : 'text-luxury-white'}`}>
                {slide.headline}
              </h2>
            )}
            {slide.subheading && (
              <p className={`text-sm tracking-wide leading-relaxed max-w-md ${light ? 'text-luxury-black/70' : 'text-luxury-white/70'}`}>
                {slide.subheading}
              </p>
            )}
            {slide.linkUrl && (
              <a href={slide.linkUrl}
                className={`mt-8 inline-block border text-xs tracking-luxury uppercase px-8 py-3 transition-all duration-500 ${
                  light ? 'border-luxury-black text-luxury-black hover:bg-luxury-black hover:text-luxury-white'
                        : 'border-luxury-white text-luxury-white hover:bg-luxury-white hover:text-luxury-black'
                }`}>
                Explore
              </a>
            )}
          </div>
        ) : (
          // Products panel — 2×2 grid
          <div className="h-full bg-luxury-black grid grid-cols-2 gap-4 p-8 content-start overflow-hidden">
            {seg.products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )

        // ── Mobile: stack image then products; Desktop: side-by-side ──────────
        const mobileImage = (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <MediaHalf slide={slide} />
          </div>
        )
        const mobileProducts = content === 'products'
          ? <div className="grid grid-cols-2 gap-3 px-4 py-6">{seg.products.map(p => <ProductCard key={p.id} product={p} />)}</div>
          : (
            <div className="px-6 py-8 flex flex-col justify-center">
              {slide.headline && <h2 className={`font-serif text-xl tracking-wide mb-3 ${light ? 'text-luxury-black' : 'text-luxury-white'}`}>{slide.headline}</h2>}
              {slide.subheading && <p className={`text-sm leading-relaxed ${light ? 'text-luxury-black/70' : 'text-luxury-white/70'}`}>{slide.subheading}</p>}
              {slide.linkUrl && <a href={slide.linkUrl} className="mt-4 text-xs tracking-luxury uppercase border border-luxury-gold text-luxury-gold px-6 py-2 inline-block hover:bg-luxury-gold hover:text-luxury-black transition-all">Explore</a>}
            </div>
          )

        return (
          <div key={`split-${i}`}>
            {/* Mobile: image on top, content below */}
            <div className="md:hidden">
              {mobileImage}
              {mobileProducts}
            </div>
            {/* Desktop: side-by-side */}
            <div className="hidden md:grid md:grid-cols-2 md:h-[75vh]">
              {imageLeft ? <>{imageSide}{productsSide}</> : <>{productsSide}{imageSide}</>}
            </div>
          </div>
        )
      })}

      {total !== undefined && products.length < total && (
        <div ref={sentinelRef} className="py-12 text-center">
          <p className="text-luxury-muted text-xs uppercase tracking-luxury">{loading ? 'Loading more…' : ''}</p>
        </div>
      )}
    </div>
  )
}
