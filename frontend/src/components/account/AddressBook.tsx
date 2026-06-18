'use client'
import { useState } from 'react'
import { AddressCard } from './AddressCard'
import { AddressForm } from './AddressForm'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import type { Address } from '@/types/user'

export function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [editing, setEditing] = useState<Address | null>(null)
  const [adding, setAdding] = useState(false)

  async function refresh() {
    const res = await api.get('/users/me')
    setAddresses(res.data?.addresses ?? [])
    setAdding(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this address?')) return
    await api.delete(`/users/me/addresses/${id}`)
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-8">
      {!adding && !editing && (
        <Button onClick={() => setAdding(true)}>Add Address</Button>
      )}

      {adding && (
        <AddressForm onSaved={refresh} onCancel={() => setAdding(false)} />
      )}

      {editing && (
        <AddressForm address={editing} onSaved={refresh} onCancel={() => setEditing(null)} />
      )}

      {addresses.length === 0
        ? <p className="text-luxury-muted tracking-wide">No saved addresses.</p>
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map(a => (
              <AddressCard key={a.id} address={a}
                onEdit={() => setEditing(a)}
                onDelete={() => handleDelete(a.id)} />
            ))}
          </div>
      }
    </div>
  )
}
