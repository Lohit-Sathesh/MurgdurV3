'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export function SortDropdown() {
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find(o => o.value === params.get('sort')) ?? OPTIONS[0]

  function select(value: string) {
    const p = new URLSearchParams(params.toString())
    p.set('sort', value)
    router.push(`?${p.toString()}`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 text-xs tracking-luxury text-luxury-muted hover:text-luxury-white uppercase transition-colors">
        Sort: {current.label}
        <span className="text-luxury-gold">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 bg-luxury-black border border-luxury-gray w-48 z-10">
          {OPTIONS.map(o => (
            <button key={o.value} onClick={() => select(o.value)}
              className={`block w-full text-left px-4 py-3 text-xs tracking-wide transition-colors ${
                o.value === current.value
                  ? 'text-luxury-gold' : 'text-luxury-muted hover:text-luxury-white'
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}