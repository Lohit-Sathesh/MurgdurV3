'use client'
import { useCart } from '@/hooks/useCart'
import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { lenisStore } from '@/lib/lenis'
import { useCurrency } from '@/context/CurrencyContext'
import { useSiteConfig } from '@/context/SiteConfigContext'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, clearCart, total } = useCart()
  const { format } = useCurrency()
  const { shippingCost, taxRate, taxLabel } = useSiteConfig()

  const tax      = total * (taxRate / 100)
  const shipping = items.length > 0 ? shippingCost : 0
  const grandTotal = total + tax + shipping

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      lenisStore.instance?.stop()
    } else {
      lenisStore.instance?.start()
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      lenisStore.instance?.start()
    }
  }, [isOpen])

  return (
    <>
      {isOpen && <div onClick={closeCart} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-luxury-black border-l border-luxury-gray z-50 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full p-4 sm:p-8">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="font-serif text-lg sm:text-2xl tracking-[0.1em] sm:tracking-luxury text-luxury-white">Shopping Bag</h2>
            <div className="flex items-center gap-4">
              {items.length > 0 && (
                <button onClick={() => { clearCart(); }} className="text-luxury-muted text-xs tracking-luxury uppercase hover:text-red-400 transition-colors">
                  Clear All
                </button>
              )}
              <button onClick={closeCart} className="text-luxury-muted hover:text-luxury-white text-2xl">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain space-y-6">
            {items.length === 0
              ? <p className="text-luxury-muted tracking-wide text-sm text-center pt-12">Your bag is empty</p>
              : items.map(item => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                  <div className="relative w-14 sm:w-16 h-18 sm:h-20 shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-luxury-white text-sm tracking-wide">{item.name}</p>
                    <p className="text-luxury-muted text-xs mt-1">{item.color} · {item.size}</p>
                    <p className="text-luxury-gold text-sm mt-2">{format(item.price)}</p>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-luxury-muted hover:text-luxury-white text-lg self-start">×</button>
                </div>
              ))
            }
          </div>
          {items.length > 0 && (
            <div className="border-t border-luxury-gray pt-6 space-y-3">
              <div className="flex justify-between text-xs text-luxury-muted tracking-luxury">
                <span>Subtotal</span><span>{format(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-luxury-muted tracking-luxury">
                <span>Shipping</span>
                <span>{shipping > 0 ? format(shipping) : 'Free'}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-xs text-luxury-muted tracking-luxury">
                  <span>{taxLabel} ({taxRate}%)</span><span>{format(tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-luxury-gray/30 pt-3">
                <span className="text-luxury-white tracking-luxury text-sm uppercase">Total</span>
                <span className="text-luxury-white font-serif text-xl">{format(grandTotal)}</span>
              </div>
              <Link href="/cart" onClick={closeCart}
                className="block w-full bg-luxury-gold text-luxury-black text-center py-3 tracking-luxury text-sm uppercase hover:bg-luxury-white transition-all">
                View Bag & Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}