'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface TempOrderPreview {
  id:          string
  customerName: string
  total:       number
  createdAt:   string
  expiresAt:   string
  items:       Array<{ productName: string; quantity: number; unitPrice: number }>
}

export function TempOrderActivator() {
  const router = useRouter()
  const [tempId,   setTempId]   = useState('')
  const [preview,  setPreview]  = useState<TempOrderPreview | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  async function lookup() {
    if (!tempId.trim()) return
    setLoading(true); setError(null); setPreview(null); setSuccess(null)
    try {
      const res  = await api.get(`/temp-orders/${tempId.trim()}`)
      const data = res.data?.data ?? res.data
      setPreview(data)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Temp order not found.')
    } finally {
      setLoading(false)
    }
  }

  async function activate() {
    if (!preview) return
    setLoading(true); setError(null)
    try {
      const res   = await api.post(`/temp-orders/${preview.id}/activate`)
      const order = res.data?.data ?? res.data
      setSuccess(`Order created: ${order.orderNumber}`)
      setPreview(null)
      setTempId('')
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to activate order.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-luxury-gold/30 rounded-xl p-6 bg-luxury-gold/5 space-y-4 max-w-2xl">
      <div>
        <h2 className="text-luxury-white text-sm tracking-luxury uppercase mb-1">Activate WhatsApp Order</h2>
        <p className="text-luxury-muted text-xs">
          Enter the 6-digit Temp ID from the customer's WhatsApp message to create a confirmed order.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          value={tempId}
          onChange={e => setTempId(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="6-digit Temp ID (e.g. 483291)"
          maxLength={6}
          className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-4 py-2.5 outline-none focus:border-luxury-gold rounded font-mono tracking-widest"
        />
        <button onClick={lookup} disabled={loading || tempId.length < 6}
          className="px-5 py-2.5 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all disabled:opacity-40 rounded">
          {loading ? 'Looking up…' : 'Look Up'}
        </button>
      </div>

      {error   && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}

      {preview && (
        <div className="border border-luxury-gray rounded-lg p-4 space-y-3 bg-luxury-black">
          <div className="flex items-center justify-between">
            <p className="text-luxury-gold text-xs tracking-luxury uppercase">Temp Order Found</p>
            <p className="text-luxury-muted text-[10px]">Expires: {new Date(preview.expiresAt).toLocaleDateString()}</p>
          </div>
          <p className="text-luxury-white text-sm font-medium">{preview.customerName}</p>
          <div className="space-y-1">
            {(preview.items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs text-luxury-muted">
                <span>{item.productName} × {item.quantity}</span>
                <span>₹{(item.unitPrice * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-luxury-gray/30 pt-2">
            <span className="text-luxury-white text-xs tracking-luxury uppercase">Total</span>
            <span className="text-luxury-gold text-sm font-serif">₹{Number(preview.total).toLocaleString()}</span>
          </div>
          <button onClick={activate} disabled={loading}
            className="w-full py-3 bg-luxury-gold text-luxury-black text-xs tracking-luxury uppercase hover:opacity-90 disabled:opacity-50 transition-all rounded font-medium">
            {loading ? 'Creating Order…' : 'Confirm & Create Order'}
          </button>
        </div>
      )}
    </div>
  )
}
