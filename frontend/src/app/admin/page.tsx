import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface DashboardData {
  totalOrders: number
  totalRevenue: number | string
  totalUsers: number
  totalProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    total: string
    createdAt: string
    user: { firstName: string; lastName: string; email: string }
  }>
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  let data: DashboardData | null = null
  try {
    const res = await api.get('/admin/analytics/dashboard', {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    data = res.data
  } catch {}

  const cards = [
    { label: 'Total Revenue', value: data ? formatPrice(data.totalRevenue) : '--' },
    { label: 'Total Orders', value: data?.totalOrders ?? '--' },
    { label: 'Total Users', value: data?.totalUsers ?? '--' },
    { label: 'Total Products', value: data?.totalProducts ?? '--' },
  ]

  return (
    <section>
      <h1 className="font-serif text-4xl tracking-luxury mb-10">Business Overview</h1>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
        {cards.map(c => (
          <article key={c.label} className="border border-luxury-gray p-6 hover:border-luxury-gold/40 transition-colors">
            <p className="text-xs uppercase tracking-luxury text-luxury-muted">{c.label}</p>
            <strong className="mt-4 block text-3xl font-serif text-luxury-gold">{c.value}</strong>
          </article>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-luxury-white tracking-luxury text-sm uppercase">Recent Orders</h2>
          <Link href="/admin/orders" className="text-luxury-gold text-xs uppercase tracking-luxury hover:underline">View All</Link>
        </div>
        {!data || data.recentOrders.length === 0 ? (
          <p className="text-luxury-muted border border-luxury-gray p-8 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto border border-luxury-gray">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-luxury-muted uppercase text-xs tracking-luxury border-b border-luxury-gray bg-luxury-white/[0.02]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-luxury-gray/50 last:border-0 hover:bg-luxury-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-luxury-gold hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="py-3 px-4 text-luxury-white">{o.user.firstName} {o.user.lastName}</td>
                    <td className="py-3 px-4 text-luxury-muted">{formatDate(o.createdAt)}</td>
                    <td className="py-3 px-4"><StatusBadge status={o.status} /></td>
                    <td className="py-3 px-4 text-right text-luxury-gold">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
