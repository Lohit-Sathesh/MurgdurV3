import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Product } from '@/types/product'

interface Filters {
  category?: string
  sort?: string
  color?: string
  size?: string
  limit?: number
}

export function useProducts(filters: Filters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)))
    api.get(`/products?${params}`)
      .then(r => setProducts(r.data.data?.products ?? []))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { products, loading, error }
}