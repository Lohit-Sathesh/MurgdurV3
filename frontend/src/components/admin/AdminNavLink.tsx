'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNavLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  const pathname = usePathname()
  const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <Link href={href}
      className={`flex items-center gap-3 px-3 py-2.5 -mx-3 rounded-r-full transition-all duration-300 ${
        active
          ? 'text-luxury-gold border-l-2 border-luxury-gold bg-luxury-gold/5'
          : 'text-luxury-white border-l-2 border-transparent hover:text-luxury-gold hover:bg-luxury-white/[0.03]'
      }`}>
      {icon}
      {label}
    </Link>
  )
}
