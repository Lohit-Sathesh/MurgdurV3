'use client'
import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { FilterSidebar } from './FilterSidebar'
import { SortDropdown } from './SortDropdown'

export function FilterPanel({ category }: { category?: string }) {
  const [open, setOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      return
    }

    // Lock native page scroll
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    // Stop wheel events from bubbling to window where Lenis listens.
    // lenis.stop() is harmful — Lenis still calls preventDefault() when stopped,
    // blocking ALL native scroll. stopPropagation() is the correct solution.
    const stopProp = (e: WheelEvent) => e.stopPropagation()
    const el = panelRef.current
    el?.addEventListener('wheel', stopProp, { passive: true })

    return () => {
      el?.removeEventListener('wheel', stopProp)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-luxury-black text-luxury-white border border-luxury-gray rounded-full px-6 py-3 text-xs tracking-luxury uppercase hover:border-luxury-gold transition-colors shadow-lg">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div ref={panelRef} className="fixed top-0 right-0 h-screen w-full max-w-sm bg-luxury-black border-l border-luxury-gray flex flex-col">
            <div className="flex items-center justify-between px-8 h-20 border-b border-luxury-gray flex-shrink-0">
              <span className="font-serif text-xl tracking-luxury text-luxury-white uppercase">Filters</span>
              <button onClick={() => setOpen(false)} aria-label="Close filters" className="text-luxury-white hover:text-luxury-gold transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
              <SortDropdown />
              <FilterSidebar category={category} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
