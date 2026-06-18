'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from './useAuth'

export function useWishlist() {
  const { isLoggedIn } = useAuth()
  const [wishlist, setWishlist] = useState<string[]>([])

  useEffect(() => {
    if (!isLoggedIn) return
    api.get('/wishlist').then(r => {
      setWishlist(r.data?.map((i: any) => i.productId) ?? [])
    }).catch(() => {})
  }, [isLoggedIn])

  async function toggle(productId: string) {
    if (!isLoggedIn) return
    const inList = wishlist.includes(productId)
    if (inList) {
      await api.delete(`/wishlist/${productId}`)
      setWishlist(prev => prev.filter(id => id !== productId))
      return false
    } else {
      try {
        await api.post('/wishlist', { productId })
        setWishlist(prev => [...prev, productId])
        return true
      } catch (err: any) {
        if (err?.response?.status === 409) {
          // Already in wishlist (stale local state) — user intent was to remove it
          await api.delete(`/wishlist/${productId}`)
          setWishlist(prev => prev.filter(id => id !== productId))
          return false
        }
        throw err
      }
    }
  }

  return { wishlist, toggle, isInWishlist: (id: string) => wishlist.includes(id) }
}