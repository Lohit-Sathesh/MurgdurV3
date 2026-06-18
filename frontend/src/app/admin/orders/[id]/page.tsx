import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface AdminOrderDetail {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: string
  tax: string
  shippingFee: string
  total: string
  createdAt: string
  user: { firstName: string; lastName: string; email: string }
  items: Array<{
    id: string
    quantity: number
    unitPrice: string
    totalPrice: string
    product: { name: string }
  }>
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  let order: AdminOrderDetail | null = null
  try {
    const res = await api.get(`/admin/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    order = res.data
  } catch {}

  if (!order) return <p className="text-luxury-muted">Order not found.</p>

  return (
    <section className="max-w-3xl">
      <Link href="/admin/orders" className="text-luxury-muted text-xs uppercase tracking-luxury hover:text-luxury-gold transition-colors">
        &larr; All Orders
      </Link>
      <div className="flex items-center justify-between mt-4 mb-10">
        <div>
          <h1 className="font-serif text-3xl tracking-luxury">{order.orderNumber}</h1>
          <p className="text-luxury-muted text-sm mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="border border-luxury-gray p-6">
          <h2 className="text-luxury-muted tracking-luxury text-xs uppercase mb-3">Customer</h2>
          <p className="text-luxury-white">{order.user.firstName} {order.user.lastName}</p>
          <p className="text-luxury-muted text-sm">{order.user.email}</p>
        </div>
        <div className="border border-luxury-gray p-6">
          <h2 className="text-luxury-muted tracking-luxury text-xs uppercase mb-3">Payment</h2>
          <p className="text-luxury-white">{order.paymentMethod}</p>
          <div className="mt-2"><StatusBadge status={order.paymentStatus} /></div>
        </div>
      </div>

      <div className="space-y-4 border-t border-luxury-gray pt-8">
        <h2 className="text-luxury-muted tracking-luxury text-xs uppercase mb-2">Items</h2>
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between items-center py-3 border-b border-luxury-gray/50">
            <div>
              <p className="text-luxury-white text-sm tracking-wide">{item.product?.name}</p>
              <p className="text-luxury-muted text-xs mt-1">Qty: {item.quantity} x {formatPrice(item.unitPrice)}</p>
            </div>
            <p className="text-luxury-gold">{formatPrice(item.totalPrice)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-luxury-gray pt-6 max-w-xs ml-auto mt-8">
        <div className="flex justify-between text-sm">
          <span className="text-luxury-muted">Subtotal</span>
          <span className="text-luxury-white">{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-luxury-muted">Tax</span>
          <span className="text-luxury-white">{formatPrice(order.tax)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-luxury-muted">Shipping</span>
          <span className="text-luxury-white">{formatPrice(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between font-serif text-lg border-t border-luxury-gray pt-3 mt-3">
          <span className="text-luxury-white">Total</span>
          <span className="text-luxury-gold">{formatPrice(order.total)}</span>
        </div>
      </div>
    </section>
  )
}
