'use client'
import { useState } from 'react'
import type { ProductVariant } from '@/types/product'

export function SizeGuide({ variants }: { variants: ProductVariant[] }) {
  const [open, setOpen] = useState(false)
  const sizes = [...new Set(variants?.map(v => v.size).filter(Boolean))]
  if (!sizes.length) return null

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="text-luxury-muted text-xs tracking-luxury uppercase hover:text-luxury-gold transition-colors">
        Size Guide
      </button>
      {open && (
        <div className="mt-4 border border-luxury-gray p-6">
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-4">Available Sizes</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-luxury-muted">
            <span className="font-semibold text-luxury-white">Size</span>
            <span className="font-semibold text-luxury-white">Chest</span>
            <span className="font-semibold text-luxury-white">Waist</span>
            {sizes.map(s => (
              <>
                <span key={s}>{s}</span>
                <span>{s === 'XS' ? '82cm' : s === 'S' ? '86cm' : s === 'M' ? '90cm' : s === 'L' ? '96cm' : '102cm'}</span>
                <span>{s === 'XS' ? '62cm' : s === 'S' ? '66cm' : s === 'M' ? '70cm' : s === 'L' ? '76cm' : '82cm'}</span>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}