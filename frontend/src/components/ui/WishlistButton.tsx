'use client'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { isInWishlist, toggle } = useWishlist()
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const inWishlist = isInWishlist(productId)

  function handleClick() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    toggle(productId)
  }

  return (
    <button onClick={handleClick} aria-label="Toggle wishlist"
      className={className ?? 'inline-flex items-center gap-3 border border-luxury-gray text-luxury-white text-xs tracking-luxury uppercase px-6 py-4 hover:border-luxury-gold transition-colors'}>
      <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-luxury-gold text-luxury-gold' : 'text-luxury-white'}`} />
      {inWishlist ? 'Saved' : 'Add to Wishlist'}
    </button>
  )
}
