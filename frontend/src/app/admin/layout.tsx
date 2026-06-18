import { redirect }        from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { AdminToastProvider } from '@/components/admin/AdminToast'
import { AdminShell }       from '@/components/admin/AdminShell'
import {
  LayoutDashboard, Package, ShoppingBag, Image as ImageIcon,
  Users, FolderTree, Palette, Ruler, FileText,
} from 'lucide-react'

const NAV_CONFIG = [
  { href: '/admin',             label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/admin/orders',      label: 'Orders',      Icon: Package         },
  { href: '/admin/invoices',    label: 'Invoices',    Icon: FileText        },
  { href: '/admin/catalog',     label: 'Catalog',     Icon: ShoppingBag     },
  { href: '/admin/categories',  label: 'Categories',  Icon: FolderTree      },
  { href: '/admin/homepage',    label: 'Homepage',    Icon: ImageIcon       },
  { href: '/admin/size-guides', label: 'Size Guides', Icon: Ruler           },
  { href: '/admin/users',       label: 'Users',       Icon: Users           },
  { href: '/admin/theme',       label: 'Theme',       Icon: Palette         },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user    = session?.user as any

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
    redirect('/')
  }

  const navItems = (user.role === 'SUPPORT'
    ? NAV_CONFIG.filter(n => n.href === '/admin/orders')
    : NAV_CONFIG
  ).map(({ href, label, Icon }) => ({
    href,
    label,
    icon: <Icon className="w-4 h-4" />,
  }))

  return (
    <AdminToastProvider>
      <AdminShell nav={navItems} user={{ name: user.name, email: user.email }}>
        {children}
      </AdminShell>
    </AdminToastProvider>
  )
}
