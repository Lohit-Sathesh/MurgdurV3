'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const ROLES = ['CUSTOMER', 'ADMIN', 'SUPPORT']

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter()
  const [value, setValue] = useState(role)
  const [loading, setLoading] = useState(false)

  async function handleChange(newRole: string) {
    setValue(newRole)
    setLoading(true)
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <select value={value} disabled={loading} onChange={e => handleChange(e.target.value)}
      className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 tracking-wide focus:border-luxury-gold outline-none">
      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  )
}
