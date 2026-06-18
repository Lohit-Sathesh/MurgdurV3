import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { CancelOrderButton } from '@/components/account/CancelOrderButton'
import type { Order } from '@/types/order'

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  let order: Order | null = null
  try {
    const res = await api.get(`/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    order = res.data
  } catch {}

  if (!order) return (
    <div className="text-luxury-muted tracking-wide">Order not found.</div>
  )

  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl tracking-luxury mb-2">{order.orderNumber}</h1>
        <p className="text-luxury-muted text-sm">{formatDate(order.createdAt)}</p>
      </div>

      {/* Tracking timeline */}
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
              i <= currentStep ? 'bg-luxury-gold border-luxury-gold' : 'border-luxury-gray bg-transparent'
            }`} />
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < currentStep ? 'bg-luxury-gold' : 'bg-luxury-gray'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {STATUS_STEPS.map((step, i) => (
          <p key={step} className={`text-xs tracking-luxury capitalize ${
            i <= currentStep ? 'text-luxury-gold' : 'text-luxury-muted'
          }`}>
            {step.toLowerCase()}
          </p>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-4 border-t border-luxury-gray pt-8">
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between items-center py-3 border-b border-luxury-gray/50">
            <div>
              <p className="text-luxury-white text-sm tracking-wide">{item.snapshot.name}</p>
              <p className="text-luxury-muted text-xs mt-1">Qty: {item.quantity}</p>
            </div>
            <p className="text-luxury-gold">{formatPrice(item.totalPrice)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-luxury-gray pt-6 max-w-xs ml-auto">
        <div className="flex justify-between text-sm">
          <span className="text-luxury-muted">Subtotal</span>
          <span className="text-luxury-white">{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-luxury-muted">Tax (18%)</span>
          <span className="text-luxury-white">{formatPrice(order.tax)}</span>
        </div>
        <div className="flex justify-between font-serif text-lg border-t border-luxury-gray pt-3 mt-3">
          <span className="text-luxury-white">Total</span>
          <span className="text-luxury-gold">{formatPrice(order.total)}</span>
        </div>
      </div>

      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
        <div className="border-t border-luxury-gray pt-8">
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
    </div>
  )
}