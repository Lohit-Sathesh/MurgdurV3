'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { currencyForCountry, formatPrice, type CurrencyCode } from '@/lib/currency'

const COOKIE_NAME = 'murgdur-currency'
const COUNTRY_COOKIE_NAME = 'murgdur-country'

interface CurrencyContextType {
  currency: CurrencyCode
  country: string | null
  setCurrency: (currency: CurrencyCode) => void
  setCountry: (country: string) => void
  format: (amountInINR: number | string) => string
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}`
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR')
  const [country, setCountryState] = useState<string | null>(null)

  useEffect(() => {
    const savedCountry = readCookie(COUNTRY_COOKIE_NAME)
    const savedCurrency = readCookie(COOKIE_NAME)

    if (savedCountry) setCountryState(savedCountry)

    if (savedCurrency === 'INR' || savedCurrency === 'USD' || savedCurrency === 'EUR') {
      setCurrencyState(savedCurrency)
      return
    }

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const detectedCountry = data?.country_code ?? 'IN'
        const detected = currencyForCountry(detectedCountry)
        setCurrencyState(detected)
        writeCookie(COOKIE_NAME, detected)
        if (!savedCountry) {
          setCountryState(detectedCountry)
          writeCookie(COUNTRY_COOKIE_NAME, detectedCountry)
        }
      })
      .catch(() => {})
  }, [])

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next)
    writeCookie(COOKIE_NAME, next)
  }

  function setCountry(next: string) {
    setCountryState(next)
    writeCookie(COUNTRY_COOKIE_NAME, next)
    setCurrency(currencyForCountry(next))
  }

  return (
    <CurrencyContext.Provider value={{
      currency, country, setCurrency, setCountry,
      format: (amountInINR) => formatPrice(amountInINR, currency),
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
