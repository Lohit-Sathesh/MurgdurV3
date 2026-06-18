'use client'
import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '@/context/CurrencyContext'
import { COUNTRIES } from '@/lib/countries'
import { lenisStore } from '@/lib/lenis'

const STORAGE_KEY = 'murgdur-locale-prompted'

export function LocalizationPrompt() {
  const { country, setCountry } = useCurrency()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (open) {
      lenisStore.instance?.stop()
      document.body.style.overflow = 'hidden'
    } else {
      lenisStore.instance?.start()
      document.body.style.overflow = ''
    }
    return () => {
      lenisStore.instance?.start()
      document.body.style.overflow = ''
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q))
  }, [search])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  function choose(code: string) {
    setCountry(code)
    dismiss()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-luxury-black border border-luxury-gray p-8 max-h-[80vh] flex flex-col">
        <h2 className="font-serif text-2xl text-luxury-white tracking-luxury mb-2">
          Change country or region?
        </h2>
        <p className="text-luxury-muted text-sm leading-relaxed mb-6">
          Would you like to update your localization? Select your country to see pricing
          and delivery details tailored to your location
          {country ? <> — currently set to <span className="text-luxury-gold">{country}</span></> : null}.
        </p>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search countries..."
          className="w-full bg-transparent border border-luxury-gray px-4 py-2.5 text-sm text-luxury-white placeholder:text-luxury-muted focus:outline-none focus:border-luxury-gold transition-colors mb-4"
        />

        <div data-lenis-prevent className="flex-1 overflow-y-auto border border-luxury-gray/50 divide-y divide-luxury-gray/30">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-luxury-muted text-sm">No countries found.</p>
          )}
          {filtered.map(c => (
            <button
              key={c.code}
              onClick={() => choose(c.code)}
              className={`w-full text-left px-4 py-3 text-sm tracking-wide transition-colors hover:bg-luxury-white/[0.04] hover:text-luxury-gold ${
                c.code === country ? 'text-luxury-gold' : 'text-luxury-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="mt-6 text-luxury-muted text-xs uppercase tracking-luxury hover:text-luxury-white underline transition-colors self-center"
        >
          Keep current settings
        </button>
      </div>
    </div>
  )
}
