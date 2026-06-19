'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { api }        from '@/lib/api'
import type { CartItem } from '@/types/cart'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServerCartItem {
  id:        string
  productId: string
  variantId: string | null
  name:      string
  price:     number
  image:     string
  color:     string | null
  size:      string | null
  quantity:  number
}

interface CartContextType {
  items:          CartItem[]
  isOpen:         boolean
  addItem:        (item: CartItem) => void
  removeItem:     (productId: string, variantId: string) => void
  updateQuantity: (productId: string, variantId: string, quantity: number) => void
  openCart:       () => void
  closeCart:      () => void
  total:          number
  clearCart:      () => void
}

const CartContext = createContext<CartContextType | null>(null)

// Map server cart items → frontend CartItem shape
function fromServer(items: ServerCartItem[]): CartItem[] {
  return items.map(i => ({
    productId: i.productId,
    variantId: i.variantId ?? '',
    name:      i.name,
    price:     i.price,
    image:     i.image,
    color:     i.color ?? undefined,
    size:      i.size  ?? undefined,
    quantity:  i.quantity,
    // store server item id so we can PATCH/DELETE it
    _serverId: i.id,
  } as CartItem & { _serverId: string }))
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const isLoggedIn  = status === 'authenticated'
  const mergedRef   = useRef(false)  // prevent double-merge on re-render

  const [items,    setItems]    = useState<CartItem[]>([])
  const [isOpen,   setIsOpen]   = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // ── Hydrate from localStorage (guests + initial load) ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('murgdur-cart')
    if (saved) {
      try { setItems(JSON.parse(saved)) } catch {}
    }
    setHydrated(true)
  }, [])

  // ── When user logs in: merge local guest cart → server, then load server cart
  useEffect(() => {
    if (!isLoggedIn || !hydrated || mergedRef.current) return
    mergedRef.current = true

    async function syncOnLogin() {
      const local = items
      try {
        if (local.length > 0) {
          // Merge local items into server cart first
          const res = await api.post('/cart/merge', {
            items: local.map(i => ({
              productId: i.productId,
              variantId: i.variantId || null,
              name:      i.name,
              price:     i.price,
              image:     i.image,
              color:     i.color,
              size:      i.size,
              quantity:  i.quantity,
            })),
          })
          const merged = (res.data?.data ?? res.data)?.items ?? []
          setItems(fromServer(merged))
        } else {
          // No local items — just load from server
          const res = await api.get('/cart')
          const serverItems = (res.data?.data ?? res.data)?.items ?? []
          setItems(fromServer(serverItems))
        }
        // Clear localStorage since server is now authoritative
        localStorage.removeItem('murgdur-cart')
      } catch {}
    }

    syncOnLogin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, hydrated])

  // ── When user logs out: clear in-memory, reload from localStorage ──────────
  useEffect(() => {
    if (status === 'unauthenticated') {
      mergedRef.current = false
      const saved = localStorage.getItem('murgdur-cart')
      setItems(saved ? JSON.parse(saved) : [])
    }
  }, [status])

  // ── Persist to localStorage for guests ────────────────────────────────────
  useEffect(() => {
    if (!hydrated || isLoggedIn) return
    localStorage.setItem('murgdur-cart', JSON.stringify(items))
  }, [items, hydrated, isLoggedIn])

  // ── Cart mutations ────────────────────────────────────────────────────────

  const addItem = useCallback(async (item: CartItem) => {
    if (isLoggedIn) {
      try {
        await api.post('/cart/items', {
          productId: item.productId,
          variantId: item.variantId || null,
          name:      item.name,
          price:     item.price,
          image:     item.image,
          color:     item.color,
          size:      item.size,
          quantity:  item.quantity,
        })
        // Refetch to get server item IDs
        const res = await api.get('/cart')
        setItems(fromServer((res.data?.data ?? res.data)?.items ?? []))
      } catch {}
    } else {
      setItems(prev => {
        const exists = prev.find(i => i.productId === item.productId && i.variantId === item.variantId)
        return exists
          ? prev.map(i => i.productId === item.productId && i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity } : i)
          : [...prev, item]
      })
    }
    setIsOpen(true)
  }, [isLoggedIn])

  const removeItem = useCallback(async (productId: string, variantId: string) => {
    if (isLoggedIn) {
      const target = items.find(i => i.productId === productId && i.variantId === variantId) as any
      if (target?._serverId) {
        try { await api.delete(`/cart/items/${target._serverId}`) } catch {}
      }
      setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
    } else {
      setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
    }
  }, [isLoggedIn, items])

  const updateQuantity = useCallback(async (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId, variantId); return }

    if (isLoggedIn) {
      const target = items.find(i => i.productId === productId && i.variantId === variantId) as any
      if (target?._serverId) {
        try { await api.patch(`/cart/items/${target._serverId}`, { quantity }) } catch {}
      }
    }
    setItems(prev => prev.map(i =>
      i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
    ))
  }, [isLoggedIn, items, removeItem])

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try { await api.delete('/cart') } catch {}
    }
    setItems([])
  }, [isLoggedIn])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, updateQuantity,
      openCart:  () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      total, clearCart,
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
