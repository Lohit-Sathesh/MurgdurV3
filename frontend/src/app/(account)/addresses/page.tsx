import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AddressBook } from '@/components/account/AddressBook'
import { api } from '@/lib/api'
import type { Address } from '@/types/user'

export default async function AddressesPage() {
  const session = await getServerSession(authOptions)
  let addresses: Address[] = []
  try {
    const res = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    addresses = res.data?.addresses ?? []
  } catch {}

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-luxury mb-12">Address Book</h1>
      <AddressBook initialAddresses={addresses} />
    </div>
  )
}
