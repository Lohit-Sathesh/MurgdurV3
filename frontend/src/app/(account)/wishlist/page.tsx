import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WishlistGrid } from '@/components/account/WishlistGrid'
import { api } from '@/lib/api'

export default async function WishlistPage() {
  const session = await getServerSession(authOptions)
  let items = []
  try {
    const res = await api.get('/wishlist', {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    items = res.data
  } catch {}

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-luxury mb-12">Wishlist</h1>
      <WishlistGrid items={items} />
    </div>
  )
}