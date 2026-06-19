'use client'
import { useState } from 'react'
import { Input }       from '@/components/ui/Input'
import { Button }      from '@/components/ui/Button'
import { PhoneInput }  from '@/components/ui/PhoneInput'
import { api }         from '@/lib/api'
import type { Address } from '@/types/user'

interface Props {
  address?: Address
  onSaved:  () => void
  onCancel: () => void
}

export function AddressForm({ address, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    label:      address?.label      ?? '',
    firstName:  address?.firstName  ?? '',
    lastName:   address?.lastName   ?? '',
    line1:      address?.line1      ?? '',
    line2:      address?.line2      ?? '',
    city:       address?.city       ?? '',
    state:      address?.state      ?? '',
    postalCode: address?.postalCode ?? '',
    country:    address?.country    ?? 'India',
    phone:      address?.phone      ?? '',
    isDefault:  address?.isDefault  ?? false,
  })
  const [phoneValid, setPhoneValid] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function onPhoneChange(full: string, valid: boolean) {
    setForm(f => ({ ...f, phone: full }))
    setPhoneValid(valid || full === '' || full.length <= 3)
  }

  // Auto-fill country from the phone country code selection
  function onCountryChange(countryName: string) {
    setForm(f => ({ ...f, country: countryName }))
  }

  async function handleSubmit() {
    if (form.phone && !phoneValid) { setError('Please enter a valid phone number.'); return }
    setLoading(true); setError('')
    try {
      if (address) {
        await api.patch(`/users/me/addresses/${address.id}`, form)
      } else {
        await api.post('/users/me/addresses', form)
      }
      onSaved()
    } catch (e: any) {
      setError(e?.message || 'Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-luxury-gray p-6 space-y-4">
      <Input label="Label (e.g. Home, Work)" value={form.label} onChange={update('label')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" value={form.firstName} onChange={update('firstName')} />
        <Input label="Last Name"  value={form.lastName}  onChange={update('lastName')}  />
      </div>
      <Input label="Address Line 1" value={form.line1} onChange={update('line1')} />
      <Input label="Address Line 2 (optional)" value={form.line2} onChange={update('line2')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City"  value={form.city}  onChange={update('city')}  />
        <Input label="State" value={form.state} onChange={update('state')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Postal Code" value={form.postalCode} onChange={update('postalCode')} />
        {/* Country auto-fills when phone country code is selected; still manually editable */}
        <Input label="Country" value={form.country} onChange={update('country')} />
      </div>

      <PhoneInput label="Phone" value={form.phone}
        onChange={onPhoneChange}
        onCountryChange={onCountryChange} />

      <label className="flex items-center gap-2 text-sm text-luxury-muted tracking-wide cursor-pointer">
        <input type="checkbox" checked={form.isDefault}
          onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
          className="accent-luxury-gold" />
        Set as default address
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-4">
        <Button onClick={handleSubmit} loading={loading} disabled={!!form.phone && !phoneValid}>
          Save Address
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
