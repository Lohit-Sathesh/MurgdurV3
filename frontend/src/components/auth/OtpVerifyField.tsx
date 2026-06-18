'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

interface OtpVerifyFieldProps {
  identifier: string
  purpose: 'email' | 'phone'
  valid: boolean
  verified: boolean
  onVerifiedChange: (verified: boolean) => void
}

export function OtpVerifyField({ identifier, purpose, valid, verified, onVerifiedChange }: OtpVerifyFieldProps) {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const label = purpose === 'email' ? 'email address' : 'phone number'

  async function sendOtp() {
    setSending(true)
    setError('')
    try {
      await api.post(`/auth/send-${purpose}-otp`, { [purpose]: identifier })
      setSent(true)
      setCode('')
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to send code to your ${label}`)
    } finally {
      setSending(false)
    }
  }

  async function verifyOtp() {
    setVerifying(true)
    setError('')
    try {
      await api.post(`/auth/verify-${purpose}-otp`, { [purpose]: identifier, code })
      onVerifiedChange(true)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid or expired code')
    } finally {
      setVerifying(false)
    }
  }

  if (verified) {
    return (
      <p className="text-xs tracking-luxury uppercase text-luxury-gold">
        ✓ {purpose === 'email' ? 'Email' : 'Phone'} verified
      </p>
    )
  }

  if (!valid) return null

  return (
    <div className="space-y-3">
      {!sent ? (
        <button type="button" onClick={sendOtp} disabled={sending}
          className="text-xs tracking-luxury uppercase text-luxury-gold hover:text-luxury-white transition-colors disabled:opacity-50">
          {sending ? 'Sending…' : `Send verification code to ${label}`}
        </button>
      ) : (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              maxLength={6}
              className="w-full bg-transparent border-b border-luxury-gray text-luxury-white pb-2 text-sm tracking-wide outline-none focus:border-luxury-gold transition-colors"
            />
          </div>
          <Button onClick={verifyOtp} loading={verifying} disabled={code.length !== 6}>Verify</Button>
        </div>
      )}
      {sent && (
        <button type="button" onClick={sendOtp} disabled={sending}
          className="text-xs tracking-luxury uppercase text-luxury-muted hover:text-luxury-gold transition-colors disabled:opacity-50">
          {sending ? 'Sending…' : 'Resend code'}
        </button>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
