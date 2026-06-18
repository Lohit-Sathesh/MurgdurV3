'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface ColorOption {
  name: string
  hex: string | null
}

export function FilterSidebar({ category }: { category?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [minPrice, setMinPrice] = useState(params.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '')
  const [colors, setColors] = useState<ColorOption[]>([])
  const [sizes, setSizes] = useState<string[]>([])

  useEffect(() => {
    api.get('/products/filters', { params: category ? { category } : {} })
      .then(res => {
        setColors(res.data?.colors ?? [])
        setSizes(res.data?.sizes ?? [])
      })
      .catch(() => {})
  }, [category])

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    p.get(key) === value ? p.delete(key) : p.set(key, value)
    router.push(`?${p.toString()}`)
  }

  function applyPriceRange() {
    const p = new URLSearchParams(params.toString())
    minPrice ? p.set('minPrice', minPrice) : p.delete('minPrice')
    maxPrice ? p.set('maxPrice', maxPrice) : p.delete('maxPrice')
    router.push(`?${p.toString()}`)
  }

  return (
    <aside className="w-full space-y-10">
      {colors.length > 0 && (
        <div>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-4">Color</p>
          <div className="space-y-2">
            {colors.map(c => (
              <button key={c.name} onClick={() => setFilter('color', c.name.toLowerCase())}
                className={`flex items-center gap-2 text-xs tracking-wide transition-colors ${
                  params.get('color') === c.name.toLowerCase()
                    ? 'text-luxury-gold' : 'text-luxury-muted hover:text-luxury-white'
                }`}>
                {c.hex && (
                  <span className="w-3 h-3 rounded-full border border-luxury-gray inline-block" style={{ backgroundColor: c.hex }} />
                )}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-4">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map(s => (
              <button key={s} onClick={() => setFilter('size', s)}
                className={`w-10 h-10 text-xs tracking-wide border transition-all ${
                  params.get('size') === s
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-luxury-gray text-luxury-muted hover:border-luxury-white hover:text-luxury-white'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-luxury-white text-xs tracking-luxury uppercase mb-4">Price (₹)</p>
        <div className="flex flex-col gap-2">
          <input type="number" min={0} value={minPrice} placeholder="Min"
            onChange={e => setMinPrice(e.target.value)} onBlur={applyPriceRange}
            onKeyDown={e => e.key === 'Enter' && applyPriceRange()}
            className="w-full bg-transparent border border-luxury-gray text-luxury-white text-xs px-2 py-2 focus:border-luxury-gold outline-none" />
          <input type="number" min={0} value={maxPrice} placeholder="Max"
            onChange={e => setMaxPrice(e.target.value)} onBlur={applyPriceRange}
            onKeyDown={e => e.key === 'Enter' && applyPriceRange()}
            className="w-full bg-transparent border border-luxury-gray text-luxury-white text-xs px-2 py-2 focus:border-luxury-gold outline-none" />
        </div>
      </div>
    </aside>
  )
}