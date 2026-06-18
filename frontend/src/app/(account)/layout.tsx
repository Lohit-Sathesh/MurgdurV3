import { getServerSession } from 'next-auth'
import { redirect }        from 'next/navigation'
import { authOptions }     from '@/lib/auth'
import Link                from 'next/link'
import { LogoutButton }    from '@/components/account/LogoutButton'

const NAV_LINKS = [
  { href: '/profile',   label: 'Profile'   },
  { href: '/orders',    label: 'Orders'    },
  { href: '/invoices',  label: 'Invoices'  },
  { href: '/wishlist',  label: 'Wishlist'  },
  { href: '/addresses', label: 'Addresses' },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const isAdmin = (session.user as any)?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-white pt-16 md:pt-24">

      {/* ── Mobile: horizontal scroll tab bar ───────────────────────────── */}
      <div className="md:hidden border-b border-luxury-gray overflow-x-auto">
        <div className="flex px-4 gap-0 min-w-max">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="px-4 py-3 text-xs tracking-[0.1em] uppercase text-luxury-muted hover:text-luxury-white whitespace-nowrap border-b-2 border-transparent hover:border-luxury-gold transition-colors">
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              className="px-4 py-3 text-xs tracking-[0.1em] uppercase text-luxury-gold whitespace-nowrap">
              Admin
            </Link>
          )}
          <LogoutButton className="px-4 py-3 text-xs tracking-[0.1em] uppercase text-luxury-muted hover:text-luxury-white whitespace-nowrap" />
        </div>
      </div>

      {/* ── Desktop: sidebar layout ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 md:py-0 md:flex md:gap-16">
        <nav className="hidden md:block w-48 shrink-0 pt-12">
          <p className="text-luxury-muted text-xs tracking-luxury mb-6 uppercase">My Account</p>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="block py-2 text-sm tracking-wide text-luxury-white hover:text-luxury-gold transition-colors">
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              className="block py-2 text-sm tracking-wide text-luxury-gold hover:text-luxury-white transition-colors">
              Admin Portal
            </Link>
          )}
          <div className="mt-6 pt-6 border-t border-luxury-gray">
            <LogoutButton className="block py-2 text-sm tracking-wide text-luxury-white hover:text-luxury-gold transition-colors" />
          </div>
        </nav>
        <div className="flex-1 md:pt-12">{children}</div>
      </div>
    </div>
  )
}
