'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    if (!confirm('Cancel this order?')) return
    setLoading(true)
    setError(null)
    try {
      await api.patch(`/orders/${orderId}/cancel`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to cancel order.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={cancel} loading={loading}>Cancel Order</Button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
