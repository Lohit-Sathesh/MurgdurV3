'use client'
import { useEffect, useState } from 'react'
import { Input }       from '@/components/ui/Input'
import { Button }      from '@/components/ui/Button'
import { PhoneInput }  from '@/components/ui/PhoneInput'
import { api }         from '@/lib/api'

export function ProfileForm({ user }: { user: any }) {
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    phone:     user?.phone     ?? '',
  })
  const [phoneValid, setPhoneValid] = useState(true)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/users/me').then(res => {
      setForm(f => ({
        ...f,
        firstName: res.data.firstName ?? f.firstName,
        lastName:  res.data.lastName  ?? f.lastName,
        phone:     res.data.phone     ?? '',
      }))
    }).catch(() => {})
  }, [])

  function onPhoneChange(full: string, valid: boolean) {
    setForm(f => ({ ...f, phone: full }))
    setPhoneValid(valid || full === '' || full === '+91')
  }

  async function handleSave() {
    if (form.phone && !phoneValid) { setError('Please enter a valid phone number.'); return }
    setLoading(true); setError('')
    try {
      await api.patch('/users/me', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
        <Input label="Last Name"  value={form.lastName}  onChange={e => setForm(f => ({ ...f, lastName:  e.target.value }))} />
      </div>

      <PhoneInput label="Phone" value={form.phone} onChange={onPhoneChange} />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button onClick={handleSave} loading={loading} disabled={!!form.phone && !phoneValid}>
        {saved ? 'Saved ✓' : 'Save Changes'}
      </Button>
    </div>
  )
}
