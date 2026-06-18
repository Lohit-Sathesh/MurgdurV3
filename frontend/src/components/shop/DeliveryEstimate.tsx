'use client'
import { useState } from 'react'
import { estimateDelivery, type DeliveryEstimateResult } from '@/lib/delivery'

export function DeliveryEstimate() {
  const [pincode, setPincode] = useState('')
  const [result, setResult] = useState<DeliveryEstimateResult | null>(null)

  function check() {
    setResult(estimateDelivery(pincode))
  }

  return (
    <div className="space-y-2 pt-2">
      <span className="block text-xs tracking-luxury uppercase text-luxury-muted">Check Delivery Estimate</span>
      <div className="flex gap-3">
        <input value={pincode} maxLength={6}
          onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Enter pincode"
          className="w-40 bg-transparent border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none" />
        <button onClick={check}
          className="px-4 py-2 text-xs tracking-luxury uppercase border border-luxury-gray text-luxury-white hover:border-luxury-gold transition-colors">
          Check
        </button>
      </div>
      {result && (
        result.valid
          ? <p className="text-sm text-luxury-gold">Estimated delivery in {result.minDays}-{result.maxDays} business days</p>
          : <p className="text-sm text-red-400">Enter a valid 6-digit pincode</p>
      )}
    </div>
  )
}
