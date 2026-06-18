'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import { X, ChevronRight } from 'lucide-react'
import { useSiteConfig } from '@/context/SiteConfigContext'

interface CategoryHighlight {
  id: string
  imageUrl: string
  title: string
  subheading?: string | null
  linkUrl?: string | null
  placement: string
}

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
  highlights?: CategoryHighlight[]
}

function getBestImage(cat: Category): CategoryHighlight | undefined {
  return cat.highlights?.find(h => h.placement === 'menu')
    ?? cat.highlights?.find(h => h.placement === 'hero')
    ?? cat.highlights?.[0]
}

// Single-column vertical list of image cards.
// Vertical layout prevents the diagonal-crossing bug: moving the mouse
// rightward from any card exits directly into the next flyout panel
// without crossing sibling cards below.
function CategoryGrid({
  items,
  activeSub,
  onHoverItem,
  onClose,
}: {
  items: Category[]
  activeSub: Category | null
  onHoverItem: (cat: Category) => void
  onClose: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto py-4 px-5">
      <div className="flex flex-col gap-3">
        {items.map(item => {
          const img = getBestImage(item)
          const hasSubs = !!item.children?.length
          const isActive = activeSub?.id === item.id

          if (img) {
            // Image card — full-width landscape; clicking navigates, hover expands L2
            return (
              <div key={item.id} onMouseEnter={() => onHoverItem(item)} className="group">
                <Link href={`/collections/${item.slug}`} onClick={onClose} className="block">
                  <div className={`relative h-40 overflow-hidden transition-all duration-300 ${isActive ? 'ring-1 ring-luxury-gold' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {/* Subtle label scrim */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                      <p className={`text-[10px] tracking-luxury uppercase transition-colors ${
                        isActive ? 'text-luxury-gold' : 'text-white group-hover:text-luxury-gold'
                      }`}>
                        {item.name}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )
          }

          if (hasSubs) {
            // Non-leaf with no image — outlined card, hover expands L2
            return (
              <button key={item.id} onMouseEnter={() => onHoverItem(item)} onClick={() => onHoverItem(item)}
                className="group w-full text-left">
                <div className={`h-14 flex items-center justify-between px-4 border transition-colors duration-200 ${
                  isActive ? 'border-luxury-gold' : 'border-luxury-gray group-hover:border-luxury-gold'
                }`}>
                  <span className={`text-[11px] tracking-luxury uppercase transition-colors ${
                    isActive ? 'text-luxury-gold' : 'text-luxury-muted group-hover:text-luxury-gold'
                  }`}>
                    {item.name}
                  </span>
                  <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-colors ${
                    isActive ? 'text-luxury-gold' : 'text-luxury-muted group-hover:text-luxury-gold'
                  }`} />
                </div>
              </button>
            )
          }

          // Leaf with no image yet — text link row
          return (
            <div key={item.id} onMouseEnter={() => onHoverItem(item)} className="group">
              <Link href={`/collections/${item.slug}`} onClick={onClose} className="block">
                <div className="h-14 flex items-center px-4 border border-luxury-gray group-hover:border-luxury-gold transition-colors duration-200">
                  <span className="text-[11px] tracking-luxury uppercase text-luxury-muted group-hover:text-luxury-gold transition-colors">
                    {item.name}
                  </span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CategoryDrawer({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const { siteTitle } = useSiteConfig()
  const backdropRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const flyout1Ref = useRef<HTMLDivElement>(null)
  const flyout2Ref = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState<Category | null>(null)
  const [activeSub, setActiveSub] = useState<Category | null>(null)

  useEffect(() => {
    gsap.set(navRef.current, { xPercent: -100 })
    gsap.set(backdropRef.current, { opacity: 0 })
    gsap.to(backdropRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    gsap.to(navRef.current, { xPercent: 0, duration: 0.7, ease: 'power3.out' })
  }, [])

  // Animate Level 1 flyout when active category changes
  useEffect(() => {
    const el = flyout1Ref.current
    if (!el || !active) return
    gsap.fromTo(el, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.38, ease: 'power3.out' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  // Animate Level 2 flyout when sub-category changes
  useEffect(() => {
    const el = flyout2Ref.current
    if (!el || !activeSub) return
    gsap.fromTo(el, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSub?.id])

  function handleClose() {
    gsap.to(navRef.current, { xPercent: -100, duration: 0.5, ease: 'power3.in' })
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: onClose })
  }

  function hoverTop(cat: Category) {
    if (!cat.children?.length) {
      setActive(null)
      setActiveSub(null)
      return
    }
    if (active?.id !== cat.id) {
      setActive(cat)
      setActiveSub(null)
    }
  }

  function hoverSub(cat: Category) {
    if (cat.children?.length) {
      setActiveSub(cat)
    } else {
      setActiveSub(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div ref={backdropRef} onClick={handleClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="absolute top-0 left-0 h-full flex"
        onMouseLeave={() => { setActive(null); setActiveSub(null) }}
      >
        {/* ── Left nav panel ── */}
        <div ref={navRef}
          className="h-full w-72 bg-luxury-black border-r border-luxury-gray flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between px-8 h-20 border-b border-luxury-gray flex-shrink-0">
            <Link href="/" onClick={handleClose}
              className="font-serif font-bold text-xl tracking-luxury text-luxury-white hover:text-luxury-gold transition-colors">
              {siteTitle}
            </Link>
            <button onClick={handleClose} aria-label="Close menu"
              className="text-luxury-muted hover:text-luxury-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-8 py-10">
            {categories.map(cat => {
              const hasChildren = !!cat.children?.length
              const isActive = active?.id === cat.id
              return hasChildren ? (
                <button key={cat.id}
                  onMouseEnter={() => hoverTop(cat)}
                  onClick={() => hoverTop(cat)}
                  className={`w-full flex items-center justify-between py-4 border-b border-luxury-gray/40 text-left transition-colors duration-200 ${
                    isActive ? 'text-luxury-gold' : 'text-luxury-white hover:text-luxury-gold'
                  }`}>
                  <span className="text-base tracking-wide">{cat.name}</span>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
                    isActive ? 'text-luxury-gold translate-x-0.5' : 'text-luxury-muted'
                  }`} />
                </button>
              ) : (
                <Link key={cat.id} href={`/collections/${cat.slug}`} onClick={handleClose}
                  onMouseEnter={() => hoverTop(cat)}
                  className="block py-4 border-b border-luxury-gray/40 text-base tracking-wide text-luxury-white hover:text-luxury-gold transition-colors duration-200">
                  {cat.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* ── Level-1 flyout: children of hovered top-level category ── */}
        {active && (
          <div ref={flyout1Ref}
            className="h-full w-80 bg-luxury-black border-r border-luxury-gray flex flex-col flex-shrink-0 overflow-hidden">
            <div className="flex items-center px-8 h-20 border-b border-luxury-gray flex-shrink-0">
              <span className="font-serif text-lg tracking-luxury text-luxury-gold uppercase">
                {active.name}
              </span>
            </div>
            <CategoryGrid
              items={active.children ?? []}
              activeSub={activeSub}
              onHoverItem={hoverSub}
              onClose={handleClose}
            />
          </div>
        )}

        {/* ── Level-2 flyout: sub-subcategories (e.g. Shirts inside Ready to Wear) ── */}
        {activeSub && (
          <div ref={flyout2Ref}
            className="h-full w-80 bg-luxury-black border-r border-luxury-gray flex flex-col flex-shrink-0 overflow-hidden">
            <div className="flex items-center px-8 h-20 border-b border-luxury-gray flex-shrink-0">
              <span className="font-serif text-lg tracking-luxury text-luxury-gold uppercase">
                {activeSub.name}
              </span>
            </div>
            <CategoryGrid
              items={activeSub.children ?? []}
              activeSub={null}
              onHoverItem={() => {}}
              onClose={handleClose}
            />
          </div>
        )}
      </div>
    </div>
  )
}
