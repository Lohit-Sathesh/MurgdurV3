'use client'
import { useState } from 'react'
import { Button } from './Button'
import { useCart } from '@/hooks/useCart'
import type { Product, ProductVariant } from '@/types/product'

export function AddToCartButton({
  product,
  selectedVariant,
  onSelectVariant,
}: {
  product: Product
  selectedVariant?: ProductVariant
  onSelectVariant?: (v: ProductVariant) => void
}) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const exceedsStock = !!selectedVariant && quantity > selectedVariant.stock

  function selectVariant(v: ProductVariant) {
    onSelectVariant?.(v)
    setQuantity(1)
  }

  function changeQuantity(delta: number) {
    setQuantity(q => Math.max(1, q + delta))
  }

  function handleAdd() {
    if (!selectedVariant || exceedsStock) return
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: Number(selectedVariant.price ?? product.price),
      image: product.images?.[0]?.url ?? '',
      color: selectedVariant.color ?? undefined,
      size: selectedVariant.size ?? undefined,
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-4">
      {product.variants && product.variants.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {product.variants.map(v => (
            <button key={v.id} onClick={() => selectVariant(v)}
              className={`px-4 py-2 text-xs tracking-luxury border transition-all ${
                selectedVariant?.id === v.id
                  ? 'border-luxury-gold text-luxury-gold'
                  : 'border-luxury-gray text-luxury-muted hover:border-luxury-white'
              } ${v.stock === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              disabled={v.stock === 0}>
              {v.color} {v.size}
              {v.stock > 0 && v.stock < 10 && <span className="ml-1 text-amber-400">·{v.stock}</span>}
            </button>
          ))}
        </div>
      )}
      {selectedVariant && selectedVariant.stock > 0 && (
        <div className="space-y-2">
          <span className="block text-xs tracking-luxury uppercase text-luxury-muted">Quantity</span>
          <div className="inline-flex items-center border border-luxury-gray">
            <button onClick={() => changeQuantity(-1)} disabled={quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-luxury-white hover:text-luxury-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              −
            </button>
            <span className="w-10 text-center text-sm text-luxury-white tabular-nums">{quantity}</span>
            <button onClick={() => changeQuantity(1)}
              className="w-9 h-9 flex items-center justify-center text-luxury-white hover:text-luxury-gold transition-colors">
              +
            </button>
          </div>
          {exceedsStock && (
            <p className="text-xs text-red-400 tracking-wide">Selected quantity exceeds stock</p>
          )}
        </div>
      )}
      <Button onClick={handleAdd} fullWidth disabled={!selectedVariant || selectedVariant.stock === 0 || exceedsStock}>
        {added ? 'Added to Bag' : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
      </Button>
    </div>
  )
}
