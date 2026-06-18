import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/account/LogoutButton'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-white pt-24">
      <div className="max-w-7xl mx-auto px-8 flex gap-16">
        <nav className="w-48 shrink-0">
          <p className="text-luxury-muted text-xs tracking-luxury mb-6 uppercase">My Account</p>
          {[
            { href: '/profile',   label: 'Profile'   },
            { href: '/orders',    label: 'Orders'    },
            { href: '/invoices',  label: 'Invoices'  },
            { href: '/wishlist',  label: 'Wishlist'  },
            { href: '/addresses', label: 'Addresses' },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="block py-2 text-sm tracking-wide text-luxury-white hover:text-luxury-gold transition-colors">
              {label}
            </Link>
          ))}
          {(session.user as any)?.role === 'ADMIN' && (
            <Link href="/admin"
              className="block py-2 text-sm tracking-wide text-luxury-gold hover:text-luxury-white transition-colors">
              Admin Portal
            </Link>
          )}
          <div className="mt-6 pt-6 border-t border-luxury-gray">
            <LogoutButton className="block py-2 text-sm tracking-wide text-luxury-white hover:text-luxury-gold transition-colors" />
          </div>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}