'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode() {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setStep('reset')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { email, code, newPassword })
      setStep('done')
    } catch (err: any) {
      setError(err?.message ?? 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl tracking-luxury text-luxury-white text-center mb-12">
          Reset Password
        </h1>

        {step === 'email' && (
          <div className="space-y-6">
            <p className="text-luxury-muted text-sm tracking-wide text-center">
              Enter your account email and we'll send you a verification code.
            </p>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            {error && <p className="text-red-400 text-sm tracking-wide">{error}</p>}
            <Button onClick={handleSendCode} loading={loading} fullWidth>
              Send Code
            </Button>
            <p className="text-luxury-muted text-center text-sm tracking-wide">
              <Link href="/login" className="text-luxury-gold hover:underline">Back to sign in</Link>
            </p>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-6">
            <p className="text-luxury-muted text-sm tracking-wide text-center">
              If an account exists for {email}, a 6-digit code has been sent. Enter it below with your new password.
            </p>
            <Input label="Verification Code" value={code} onChange={e => setCode(e.target.value)} />
            <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            {error && <p className="text-red-400 text-sm tracking-wide">{error}</p>}
            <Button onClick={handleResetPassword} loading={loading} fullWidth>
              Reset Password
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-6 text-center">
            <p className="text-luxury-white text-sm tracking-wide">
              Your password has been reset successfully.
            </p>
            <Link href="/login">
              <Button fullWidth>Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
