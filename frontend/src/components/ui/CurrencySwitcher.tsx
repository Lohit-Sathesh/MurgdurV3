'use client'
import { useState } from 'react'
import { useCurrency } from '@/context/CurrencyContext'
import type { CurrencyCode } from '@/lib/currency'

const OPTIONS: CurrencyCode[] = ['INR', 'USD', 'EUR']

export function CurrencySwitcher({ textClass = 'text-luxury-white' }: { textClass?: string }) {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`${textClass} hover:text-luxury-gold transition-colors text-xs tracking-luxury uppercase`}>
        {currency}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 bg-luxury-black border border-luxury-gray w-24 z-50">
          {OPTIONS.map(o => (
            <button key={o} onClick={() => { setCurrency(o); setOpen(false) }}
              className={`block w-full text-left px-4 py-2 text-xs tracking-wide transition-colors ${
                o === currency ? 'text-luxury-gold' : 'text-luxury-muted hover:text-luxury-white'
              }`}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
