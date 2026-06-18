'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useButton } from '@/context/SiteConfigContext'

const STORAGE_KEY = 'murgdur_newsletter_subscribed'
const STORAGE_EMAIL_KEY = 'murgdur_newsletter_email'

interface NewsletterFormProps {
  inputClassName: string
  buttonClassName: string
  buttonLabel?: string
  layoutClassName: string
}

export function NewsletterForm({ inputClassName, buttonClassName, buttonLabel, layoutClassName }: NewsletterFormProps) {
  const newsletterBtn = useButton('newsletter_btn')
  const resolvedLabel = buttonLabel ?? newsletterBtn.label ?? 'Subscribe'
  const { isLoggedIn, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribedEmail, setSubscribedEmail] = useState('')
  const [checked, setChecked] = useState(false)
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [justUnsubscribed, setJustUnsubscribed] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (isLoggedIn) {
      api.get('/users/me')
        .then(res => {
          setSubscribed(!!res.data?.newsletterSubscribed)
          setSubscribedEmail(res.data?.email ?? '')
        })
        .catch(() => {})
        .finally(() => setChecked(true))
    } else {
      setSubscribed(localStorage.getItem(STORAGE_KEY) === 'true')
      setSubscribedEmail(localStorage.getItem(STORAGE_EMAIL_KEY) ?? '')
      setChecked(true)
    }
  }, [isLoggedIn, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      await api.post('/newsletter/subscribe', { email })
      setStatus('success')
      setMessage('Thank you for subscribing! Check your inbox.')
      setSubscribed(true)
      setSubscribedEmail(email)
      setJustUnsubscribed(false)
      if (!isLoggedIn) {
        localStorage.setItem(STORAGE_KEY, 'true')
        localStorage.setItem(STORAGE_EMAIL_KEY, email)
      }
      setEmail('')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  const handleUnsubscribe = async () => {
    setUnsubscribing(true)
    try {
      await api.post('/newsletter/unsubscribe', { email: subscribedEmail })
      setSubscribed(false)
      setJustUnsubscribed(true)
      setStatus('idle')
      if (!isLoggedIn) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_EMAIL_KEY)
      }
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setUnsubscribing(false)
    }
  }

  if (!checked) return null

  if (subscribed || status === 'success') {
    return (
      <div className="text-sm space-y-2">
        <p className="text-luxury-gold">{status === 'success' ? message : 'You are subscribed to the Murgdur Private List.'}</p>
        <button onClick={handleUnsubscribe} disabled={unsubscribing}
          className="text-luxury-muted text-xs uppercase tracking-luxury hover:text-luxury-white underline transition-colors disabled:opacity-50">
          {unsubscribing ? 'Unsubscribing…' : 'Unsubscribe'}
        </button>
      </div>
    )
  }

  return (
    <div>
      {justUnsubscribed && (
        <p className="text-luxury-muted text-sm mb-3">
          We're sorry to see you go. You've been removed from the Murgdur Private List — our doors are always open should you wish to return.
        </p>
      )}
      <form onSubmit={handleSubmit} className={layoutClassName}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className={inputClassName}
        />
        <button type="submit" disabled={status === 'loading'} className={buttonClassName}>
          {status === 'loading' ? 'Subscribing...' : resolvedLabel}
        </button>
        {status === 'error' && (
          <p className="text-red-400 text-xs mt-2 w-full text-center">{message}</p>
        )}
      </form>
    </div>
  )
}
