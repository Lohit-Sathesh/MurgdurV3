'use client'
import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { HeroThemeProvider } from '@/context/HeroThemeContext'
import { SiteConfigProvider, type SiteConfig } from '@/context/SiteConfigContext'
import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenisStore } from '@/lib/lenis'

gsap.registerPlugin(ScrollTrigger)

export function Providers({ children, siteConfig }: { children: React.ReactNode; siteConfig?: Partial<SiteConfig> }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenisStore.instance = lenisRef.current

    lenisRef.current.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenisRef.current?.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenisRef.current?.destroy()
      lenisStore.instance = null
    }
  }, [])

  return (
    <SessionProvider>
      <SiteConfigProvider initialConfig={siteConfig}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <HeroThemeProvider>
                {children}
              </HeroThemeProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </SiteConfigProvider>
    </SessionProvider>
  )
}