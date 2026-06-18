'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

// Status flow: PENDING → CONFIRMED → SHIPPED → IN_TRANSIT → DELIVERED
// CANCELLED available at any stage
const STATUSES = [
  { value: 'PENDING',    label: 'Pending'                     },
  { value: 'CONFIRMED',  label: 'Confirmed (payment received)' },
  { value: 'SHIPPED',    label: 'Shipped'                      },
  { value: 'IN_TRANSIT', label: 'In Transit'                   },
  { value: 'DELIVERED',  label: 'Delivered'                    },
  { value: 'CANCELLED',  label: 'Cancelled'                    },
]

const STATUS_COLOURS: Record<string, string> = {
  PENDING:    'text-amber-400',
  CONFIRMED:  'text-green-400',
  SHIPPED:    'text-blue-400',
  IN_TRANSIT: 'text-purple-400',
  DELIVERED:  'text-emerald-400',
  CANCELLED:  'text-red-400',
}

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router  = useRouter()
  const [value,   setValue]   = useState(status)
  const [loading, setLoading] = useState(false)

  async function handleChange(newStatus: string) {
    setValue(newStatus)
    setLoading(true)
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const colourClass = STATUS_COLOURS[value] ?? 'text-luxury-muted'

  return (
    <select
      value={value}
      disabled={loading}
      onChange={e => handleChange(e.target.value)}
      className={`bg-luxury-black border border-luxury-gray text-sm px-3 py-2 tracking-wide focus:border-luxury-gold outline-none ${colourClass}`}
    >
      {STATUSES.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}
