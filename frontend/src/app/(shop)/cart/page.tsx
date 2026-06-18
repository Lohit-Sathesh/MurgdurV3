'use client'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import Link from 'next/link'
import { useCurrency } from '@/context/CurrencyContext'
import { useSiteConfig } from '@/context/SiteConfigContext'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const { format } = useCurrency()
  const { shippingCost, taxRate, taxLabel } = useSiteConfig()

  const tax        = total * (taxRate / 100)
  const shipping   = items.length > 0 ? shippingCost : 0
  const grandTotal = total + tax + shipping

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-luxury-white">
      <h1 className="font-serif text-4xl tracking-luxury mb-8">Your bag is empty</h1>
      <Link href="/collections/men">
        <Button>Continue Shopping</Button>
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-16">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <h1 className="font-serif text-2xl md:text-4xl tracking-luxury text-luxury-white">Shopping Bag</h1>
        <button onClick={() => clearCart()}
          className="text-luxury-muted text-xs tracking-luxury uppercase hover:text-red-400 transition-colors border border-luxury-gray/40 px-4 py-2 rounded-full">
          Clear Bag
        </button>
      </div>
      <div className="space-y-8 mb-12">
        {items.map(item => (
          <div key={`${item.productId}-${item.variantId}`}
            className="flex gap-3 border-b border-luxury-gray pb-4 md:pb-8">
            <div className="relative w-16 sm:w-24 h-24 sm:h-32 shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-sm sm:text-lg tracking-[0.03em] sm:tracking-wide text-luxury-white">{item.name}</h3>
              {item.color && <p className="text-luxury-muted text-sm mt-1">{item.color} · {item.size}</p>}
              <div className="flex items-center gap-4 mt-4">
                <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                  className="w-8 h-8 border border-luxury-gray text-luxury-white hover:border-luxury-gold">−</button>
                <span className="text-luxury-white">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                  className="w-8 h-8 border border-luxury-gray text-luxury-white hover:border-luxury-gold">+</button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-luxury-gold">{format(item.price * item.quantity)}</p>
              <button onClick={() => removeItem(item.productId, item.variantId)}
                className="text-luxury-muted text-xs tracking-luxury mt-4 hover:text-luxury-white">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-luxury-gray pt-8 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-luxury-muted text-sm tracking-luxury">
            <span>Subtotal</span><span>{format(total)}</span>
          </div>
          <div className="flex justify-between text-luxury-muted text-sm tracking-luxury">
            <span>Shipping</span>
            <span>{shipping > 0 ? format(shipping) : 'Free'}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-luxury-muted text-sm tracking-luxury">
              <span>{taxLabel} ({taxRate}%)</span><span>{format(tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-luxury-gray pt-3">
            <p className="text-luxury-muted text-sm tracking-luxury">Total</p>
            <p className="font-serif text-3xl text-luxury-white">{format(grandTotal)}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Link href="/checkout"><Button>Proceed to Checkout</Button></Link>
        </div>
      </div>
    </div>
  )
}