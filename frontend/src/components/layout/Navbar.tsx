'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Search, User, LogOut, ShoppingBag, Menu } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { SearchOverlay } from '@/components/ui/SearchOverlay'
import { CategoryDrawer } from '@/components/layout/CategoryDrawer'
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher'
import { api } from '@/lib/api'
import { useHeroTheme } from '@/context/HeroThemeContext'
import { useSiteConfig, useTextStyle } from '@/context/SiteConfigContext'

export function Navbar() {
  const { siteTitle, siteMotto } = useSiteConfig()
  const navTitleStyle = useTextStyle('navTitle')
  const navMottoStyle = useTextStyle('navMotto')
  const navLinksStyle = useTextStyle('navLinks')
  const { data: session } = useSession()
  const { items, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme } = useHeroTheme()
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  // Adaptive color only on the homepage — all other pages always use white text on dark navbar
  const alwaysScrolled = !isHomepage
  const light = isHomepage && !scrolled && theme === 'light'
  const textClass = light ? 'text-luxury-black' : 'text-luxury-white'

  // Fetch categories — ONE useEffect, using api client only
  useEffect(() => {
    api.get('/products/categories')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]))
  }, [])

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {menuOpen && <CategoryDrawer categories={categories} onClose={() => setMenuOpen(false)} />}
     <nav className={`fixed top-0 left-0 right-0 z-30 transition-all duration-700 ${
  scrolled || alwaysScrolled
    ? 'bg-luxury-black/80 backdrop-blur-xl border-b border-luxury-gray shadow-lg'
    : 'bg-transparent'
}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 grid grid-cols-3 items-center">
          <div className="flex items-center justify-start">
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className={`${textClass} hover:text-luxury-gold transition-colors`}>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <Link href="/" className="text-center group">
  <div className={`font-serif font-bold text-base sm:text-xl md:text-3xl tracking-[0.08em] sm:tracking-[0.15em] md:tracking-[0.25em] group-hover:text-luxury-gold transition-all duration-500 ${textClass}`}
    style={navTitleStyle}>
    {siteTitle}
  </div>

  <div className={`hidden sm:block text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] mt-0.5 ${light ? 'text-luxury-black/60' : 'text-luxury-muted'}`}
    style={navMottoStyle}>
    {siteMotto}
  </div>
</Link>

          <div className="flex items-center justify-end gap-3 md:gap-6">
            <button onClick={() => setSearchOpen(true)} aria-label="Search"
              className={`${textClass} hover:text-luxury-gold transition-colors`}>
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {/* Currency switcher — hidden on mobile to save space */}
            <span className="hidden md:block">
              <CurrencySwitcher textClass={textClass} />
            </span>
            {session
              ? <>
                  <Link href="/profile" aria-label="Account" className={`${textClass} hover:text-luxury-gold transition-colors`}>
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </Link>
                  {/* Logout hidden on mobile — accessible via profile page */}
                  <button onClick={() => signOut({ callbackUrl: '/' })} aria-label="Logout"
                    className={`hidden md:block ${textClass} hover:text-luxury-gold transition-colors`}>
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              : <Link href="/login" aria-label="Sign In" className={`${textClass} hover:text-luxury-gold transition-colors`}>
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                </Link>
            }
            <button onClick={openCart} aria-label="Bag"
              className={`relative ${textClass} hover:text-luxury-gold transition-colors`}>
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-luxury-gold text-luxury-black text-[10px] w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
