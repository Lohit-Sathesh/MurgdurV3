import type { CartItem } from '@/types/cart'

const CART_KEY = 'murgdur-cart'

export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function clearStoredCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
}