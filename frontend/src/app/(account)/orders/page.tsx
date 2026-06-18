import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrderCard } from '@/components/account/OrderCard'
import { api } from '@/lib/api'
import type { Order } from '@/types/order'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  let orders: Order[] = []
  try {
    const res = await api.get('/orders', {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    orders = res.data
  } catch {}

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-luxury mb-12">Order History</h1>
      {orders.length === 0
        ? <p className="text-luxury-muted tracking-wide">No orders yet.</p>
        : <div className="space-y-4">{orders.map(o => <OrderCard key={o.id} order={o} />)}</div>
      }
    </div>
  )
}