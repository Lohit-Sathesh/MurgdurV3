'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Badge } from './Badge'
import { PriceDisplay } from './PriceDisplay'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import type { Product } from '@/types/product'
import { useTextStyle } from '@/context/SiteConfigContext'

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export function ProductCard({ product, onClick, onWishlistChange }: { product: Product; onClick?: () => void; onWishlistChange?: (productId: string, inWishlist: boolean) => void }) {
  const cardStyle       = useTextStyle('productCard')
  // null variants = no stock data (e.g. search results) → hide all stock badges
  // []   variants = product has no variants defined   → treat as out of stock
  const hasVariantData  = product.variants != null
  const totalStock      = hasVariantData ? product.variants!.reduce((s, v) => s + v.stock, 0) : null
  const { isInWishlist, toggle } = useWishlist()
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const inWishlist = isInWishlist(product.id)
  const isNew = !!product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < NEW_WINDOW_MS

  const colors: { color: string; colorHex: string | null }[] = []
  for (const v of product.variants ?? []) {
    if (v.color && !colors.some(c => c.color === v.color)) {
      colors.push({ color: v.color, colorHex: v.colorHex })
    }
  }
  const visibleColors = colors.slice(0, 3)
  const extraColors = colors.length - visibleColors.length

  async function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    const nowInWishlist = await toggle(product.id)
    onWishlistChange?.(product.id, !!nowInWishlist)
  }

  return (
    <Link
  href={`/products/${product.slug}`}
  onClick={onClick}
  className="group block transition-all duration-500 hover:-translate-y-3"
>
      <div className="relative aspect-[3/4] overflow-hidden bg-luxury-gray border border-transparent group-hover:border-luxury-gold group-hover:shadow-[0_0_30px_rgba(212,175,55,0.25)] transition-all duration-700">
        {product.images?.[0] && (
          <Image src={product.images[0].url} alt={product.name} fill
            className={`object-cover transition-opacity duration-700 ${product.images?.[1] ? 'group-hover:opacity-0' : 'group-hover:scale-110 transition-transform duration-1000'}`} />
        )}
        {product.images?.[1] && (
          <Image src={product.images[1].url} alt={product.name} fill
            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        )}
        <div className="absolute top-3 left-3 space-y-1">
          {isNew && <Badge variant="new">New</Badge>}
          {hasVariantData && totalStock === 0 && <Badge variant="out-of-stock">Out of Stock</Badge>}
          {hasVariantData && totalStock !== null && totalStock > 0 && totalStock < 10 && <Badge variant="low-stock">Low Stock</Badge>}
        </div>
        <button onClick={handleWishlistClick} aria-label="Toggle wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-luxury-black/40 backdrop-blur-sm hover:bg-luxury-black/70 transition-colors">
          <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-luxury-gold text-luxury-gold' : 'text-luxury-white'}`} />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="text-luxury-white text-sm tracking-wide group-hover:text-luxury-gold transition-all duration-700 group-hover:tracking-[0.2em]"
          style={cardStyle}>
          {product.name}
        </h3>
        <PriceDisplay price={product.price} comparePrice={product.comparePrice} />
        {visibleColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {visibleColors.map(c => (
              <span key={c.color} title={c.color}
                className="w-3 h-3 rounded-full border border-luxury-gray"
                style={{ backgroundColor: c.colorHex ?? '#ccc' }} />
            ))}
            {extraColors > 0 && (
              <span className="text-luxury-muted text-[10px] tracking-wide">+{extraColors}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
