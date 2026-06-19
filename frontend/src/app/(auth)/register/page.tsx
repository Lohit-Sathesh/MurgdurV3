'use client'
import { useEffect, useState } from 'react'
import { signIn }    from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input }     from '@/components/ui/Input'
import { Button }    from '@/components/ui/Button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { OtpVerifyField } from '@/components/auth/OtpVerifyField'
import { api }       from '@/lib/api'
import Link          from 'next/link'
import { useAuth }   from '@/hooks/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const router = useRouter()
  const { isLoggedIn, isLoading } = useAuth()
  const [form, setForm]           = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' })
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneValid,    setPhoneValid]    = useState(true)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace('/')
  }, [isLoading, isLoggedIn, router])

  const emailValid = EMAIL_REGEX.test(form.email)
  // Can submit only when email is verified
  const canSubmit  = form.firstName && form.lastName && emailValid && emailVerified &&
                     form.password.length >= 8 && phoneValid

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setForm(f => ({ ...f, [field]: value }))
      if (field === 'email') setEmailVerified(false)
    }
  }

  function onPhoneChange(full: string, valid: boolean) {
    setForm(f => ({ ...f, phone: full }))
    setPhoneValid(valid || full === '' || full.length <= 3)
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      await api.post('/auth/register', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
        ...(form.phone && form.phone.length > 3 ? { phone: form.phone } : {}),
      })
      router.push('/login')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed')
      setLoading(false)
    }
  }

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'
  async function handleGoogle() {
    setGLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  if (isLoading || isLoggedIn) return null

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl tracking-[0.1em] sm:tracking-luxury text-luxury-white text-center mb-12">
          Create Account
        </h1>
        <div className="space-y-5">
          {googleEnabled && (
            <>
              <button onClick={handleGoogle} disabled={gLoading}
                className="w-full flex items-center justify-center gap-3 border border-luxury-gray py-3 text-luxury-white text-sm tracking-wide hover:border-luxury-gold transition-colors disabled:opacity-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {gLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-luxury-gray" />
                <span className="text-luxury-muted text-xs tracking-luxury uppercase">or</span>
                <div className="flex-1 h-px bg-luxury-gray" />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="First Name" value={form.firstName} onChange={update('firstName')} />
            <Input label="Last Name"  value={form.lastName}  onChange={update('lastName')}  />
          </div>

          {/* Email + OTP verification */}
          <div className="space-y-2">
            <Input label="Email" type="email" value={form.email} onChange={update('email')}
              error={form.email && !emailValid ? 'Enter a valid email address' : undefined} />
            <OtpVerifyField
              identifier={form.email}
              purpose="email"
              valid={emailValid}
              verified={emailVerified}
              onVerifiedChange={setEmailVerified}
            />
          </div>

          {/* Phone — no OTP, just country code + length validation */}
          <PhoneInput label="Phone (optional)" value={form.phone} onChange={onPhoneChange} />

          <Input label="Password" type="password" value={form.password} onChange={update('password')}
            error={form.password && form.password.length < 8 ? 'At least 8 characters' : undefined} />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button onClick={handleSubmit} loading={loading} fullWidth disabled={!canSubmit}>
            Create Account
          </Button>

          {!emailVerified && emailValid && (
            <p className="text-luxury-muted text-xs text-center tracking-luxury">
              Please verify your email address above before creating your account.
            </p>
          )}

          <p className="text-luxury-muted text-center text-sm tracking-wide">
            Already have an account?{' '}
            <Link href="/login" className="text-luxury-gold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
