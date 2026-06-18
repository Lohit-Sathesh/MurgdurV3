'use client'
import { useState } from 'react'
import { ProductCard } from '@/components/ui/ProductCard'

export function WishlistGrid({ items }: { items: any[] }) {
  const [list, setList] = useState(items)

  function handleWishlistChange(productId: string, inWishlist: boolean) {
    if (!inWishlist) {
      setList(prev => prev.filter(item => item.product.id !== productId))
    }
  }

  if (!list?.length) return (
    <div className="text-center py-24">
      <p className="text-luxury-muted tracking-luxury text-sm uppercase">No saved items yet</p>
    </div>
  )
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {list.map(item => <ProductCard key={item.id} product={item.product} onWishlistChange={handleWishlistChange} />)}
    </div>
  )
}
