'use client'
import Link from 'next/link'
import { useSiteConfig } from '@/context/SiteConfigContext'

export function AdminSidebarLogo() {
  const { siteTitle } = useSiteConfig()
  return (
    <div>
      <Link href="/admin" className="font-serif font-bold text-2xl tracking-luxury text-luxury-gold hover:text-luxury-white transition-colors duration-500">
        {siteTitle}
      </Link>
      <p className="text-luxury-muted text-xs tracking-luxury uppercase mt-1">Admin Console</p>
    </div>
  )
}
