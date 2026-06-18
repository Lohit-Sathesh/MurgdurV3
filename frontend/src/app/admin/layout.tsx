import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LogoutButton } from '@/components/account/LogoutButton'
import { AdminNavLink } from '@/components/admin/AdminNavLink'
import { AdminSidebarLogo } from '@/components/admin/AdminSidebarLogo'
import { AdminToastProvider } from '@/components/admin/AdminToast'
import { LayoutDashboard, Package, ShoppingBag, Image as ImageIcon, Users, FolderTree, Palette, Ruler, FileText } from 'lucide-react'

const NAV = [
  { href: '/admin',              label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/orders',       label: 'Orders',      icon: Package         },
  { href: '/admin/invoices',     label: 'Invoices',    icon: FileText        },
  { href: '/admin/catalog',      label: 'Catalog',     icon: ShoppingBag     },
  { href: '/admin/categories',   label: 'Categories',  icon: FolderTree      },
  { href: '/admin/homepage',     label: 'Homepage',    icon: ImageIcon       },
  { href: '/admin/size-guides',  label: 'Size Guides', icon: Ruler           },
  { href: '/admin/users',        label: 'Users',       icon: Users           },
  { href: '/admin/theme',        label: 'Theme',       icon: Palette         },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  // Server-side role guard — catches stale-JWT edge case where middleware
  // let the user through with an old CUSTOMER role baked into the JWT cookie.
  // By the time layout renders, the jwt callback has already re-fetched the
  // role from /auth/me, so `user.role` here reflects the DB value.
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
    redirect('/')
  }

  const nav = user.role === 'SUPPORT' ? NAV.filter(({ href }) => href === '/admin/orders') : NAV

  return (
    <AdminToastProvider>
    <div className="grid min-h-screen md:grid-cols-[260px_1fr] bg-luxury-black text-luxury-white">
      <aside className="border-r border-luxury-gray p-8 flex flex-col md:fixed md:h-screen md:w-[260px]">
        <AdminSidebarLogo />

        <nav className="mt-12 flex flex-col gap-1 text-sm uppercase tracking-luxury">
          {nav.map(({ href, label, icon: Icon }) => (
            <AdminNavLink key={href} href={href} label={label} icon={<Icon className="w-4 h-4" />} />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-luxury-gray space-y-3">
          {user && (
            <div className="mb-2">
              <p className="text-luxury-white text-sm">{user.name ?? user.email}</p>
              <p className="text-luxury-muted text-xs">{user.email}</p>
            </div>
          )}
          <Link href="/" className="block text-sm tracking-wide text-luxury-muted hover:text-luxury-gold transition-colors duration-300">
            Back to Site
          </Link>
          <LogoutButton className="block text-sm tracking-wide text-luxury-white hover:text-luxury-gold transition-colors duration-300" />
        </div>
      </aside>
      <div className="p-8 md:p-12 max-w-6xl md:col-start-2">{children}</div>
    </div>
    </AdminToastProvider>
  )
}
