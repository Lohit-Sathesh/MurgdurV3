'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { searchClient } from '@/lib/meilisearch'
import { ProductCard } from './ProductCard'
import { api } from '@/lib/api'

interface CategoryNode {
  id: string
  name: string
  slug: string
  children?: CategoryNode[]
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])

  useEffect(() => {
    api.get('/products/categories')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      try {
        const index = searchClient.index('products')
        const res = await index.search(query, { limit: 6 })
        setResults(res.hits)
      } catch {}
    }, 150)
    return () => clearTimeout(timeout)
  }, [query])

  const isSearching = query.trim().length > 0

  return (
    <div className="fixed inset-0 bg-luxury-black/95 z-50 flex flex-col items-center pt-32 px-8 overflow-y-auto">
      <button onClick={onClose} className="absolute top-8 right-8 text-luxury-muted hover:text-luxury-white text-2xl">×</button>
      <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search collections..."
        className="w-full max-w-2xl bg-transparent border-b border-luxury-gray text-luxury-white text-2xl font-serif tracking-wide pb-4 outline-none placeholder:text-luxury-muted focus:border-luxury-gold transition-colors" />

      {isSearching ? (
        results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 w-full max-w-2xl pb-16">
            {results.map(p => (
              <ProductCard key={p.id} onClick={onClose} product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                sku: p.sku ?? '',
                description: '',
                price: String(p.price),
                comparePrice: null,
                currency: 'INR',
                material: null,
                images: p.image ? [{ id: p.id, url: p.image, altText: null, sortOrder: 0, isVideo: false, variantId: null }] : [],
                // null = no variant/stock data from Meilisearch index.
                // ProductCard skips stock badges when variants is null.
                variants: null as any,
                category: { id: p.categoryId ?? '', name: '', slug: '' },
              }} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-luxury-muted text-sm tracking-luxury uppercase">No results found</p>
        )
      ) : (
        <div className="mt-16 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 pb-16">
          {categories.map(cat => (
            <div key={cat.id}>
              <Link href={`/collections/${cat.slug}`} onClick={onClose}
                className="text-luxury-white text-sm tracking-luxury uppercase hover:text-luxury-gold transition-colors">
                {cat.name}
              </Link>
              {cat.children?.length ? (
                <div className="mt-4 space-y-3">
                  {cat.children.map(child => (
                    <Link key={child.id} href={`/collections/${child.slug}`} onClick={onClose}
                      className="block text-luxury-muted text-xs tracking-wide hover:text-luxury-white transition-colors">
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
