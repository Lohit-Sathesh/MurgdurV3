'use client'
import { useSiteConfig } from '@/context/SiteConfigContext'

export default function Loading() {
  const { siteTitle } = useSiteConfig()
  return (
    <div className="h-screen bg-luxury-black flex items-center justify-center">
      <div className="text-center">
        <div className="font-serif font-bold text-5xl tracking-[0.25em] text-luxury-white mb-6">
          {siteTitle}
        </div>
        <div className="w-32 h-px bg-luxury-gold mx-auto animate-pulse" />
      </div>
    </div>
  )
}
