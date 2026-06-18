'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import type { CartItem } from '@/types/cart'

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: string) => void
  updateQuantity: (productId: string, variantId: string, quantity: number) => void
  openCart: () => void
  closeCart: () => void
  total: number
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('murgdur-cart')
    if (saved) {
      try { setItems(JSON.parse(saved)) } catch {}
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('murgdur-cart', JSON.stringify(items))
  }, [items, hydrated])

  function addItem(item: CartItem) {
    setItems(prev => {
      const exists = prev.find(i => i.productId === item.productId && i.variantId === item.variantId)
      const updated = exists
        ? prev.map(i => i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...prev, item]
      return updated
    })
    setIsOpen(true)
  }

  function removeItem(productId: string, variantId: string) {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
  }

  function updateQuantity(productId: string, variantId: string, quantity: number) {
    if (quantity <= 0) { removeItem(productId, variantId); return }
    setItems(prev => prev.map(i =>
      i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
    ))
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, updateQuantity,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      total, clearCart: () => setItems([])
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used within CartProvider')
  return ctx
}