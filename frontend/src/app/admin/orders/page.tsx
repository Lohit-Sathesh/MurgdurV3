import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { TempOrderActivator } from '@/components/admin/TempOrderActivator'

interface AdminOrder {
  id: string
  orderNumber: string
  status: string
  total: string
  createdAt: string
  user: { firstName: string; lastName: string; email: string }
}

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions)
  let orders: AdminOrder[] = []
  try {
    const res = await api.get('/admin/orders', {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    orders = res.data ?? []
  } catch {}

  return (
    <section className="space-y-10">
      <h1 className="font-serif text-4xl tracking-luxury">Orders</h1>

      {/* ── Temp order activation panel ── */}
      <TempOrderActivator />

      {/* ── Real orders list ── */}
      {orders.length === 0 ? (
        <p className="text-luxury-muted border border-luxury-gray p-8 text-center">No confirmed orders yet.</p>
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
              {orders.map(o => (
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
    </section>
  )
}
