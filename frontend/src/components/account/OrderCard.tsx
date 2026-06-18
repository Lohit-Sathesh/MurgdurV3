import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/types/order'

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'text-amber-400',
  CONFIRMED:  'text-blue-400',
  PROCESSING: 'text-blue-400',
  SHIPPED:    'text-purple-400',
  DELIVERED:  'text-green-400',
  CANCELLED:  'text-red-400',
  REFUNDED:   'text-gray-400',
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`}
      className="block border border-luxury-gray p-6 hover:border-luxury-gold transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-luxury-white text-sm tracking-wide">{order.orderNumber}</p>
          <p className="text-luxury-muted text-xs mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs tracking-luxury uppercase ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-luxury-muted text-xs">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
        <p className="text-luxury-gold">{formatPrice(order.total)}</p>
      </div>
    </Link>
  )
}