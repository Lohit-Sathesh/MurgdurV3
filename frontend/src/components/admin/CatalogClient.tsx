'use client'
import { useState } from 'react'
import { CatalogFilters } from './CatalogFilters'
import { ProductRow }     from './ProductRow'
import { CreateProductForm } from './CreateProductForm'

interface CategoryOption { id: string; label: string; slug: string; hasChildren: boolean }

interface AdminProduct {
  id: string; name: string; slug: string; sku: string; description: string
  material: string | null; categoryId: string; price: string
  comparePrice: string | null; isActive: boolean; sizeGuideId?: string | null
  variants: any[]; images: any[]
}

interface Props {
  products:           AdminProduct[]
  allCategories:      CategoryOption[]
  productCategories:  CategoryOption[]  // leaf-only for product assignment
}

export function CatalogClient({ products, allCategories, productCategories }: Props) {
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const matchesCat    = !catFilter || p.categoryId === catFilter
    return matchesSearch && matchesCat
  })

  return (
    <>
      <div className="mb-8">
        <CreateProductForm categories={productCategories} />
      </div>

      <CatalogFilters
        categories={allCategories}
        onSearch={setSearch}
        onCategory={setCatFilter}
      />

      {filtered.length === 0 ? (
        <p className="text-luxury-muted border border-luxury-gray p-8 text-center">
          {search || catFilter ? 'No products match your filters.' : 'No products yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <ProductRow key={p.id} product={p} categories={productCategories} />
          ))}
        </div>
      )}

      {(search || catFilter) && (
        <p className="text-luxury-muted text-xs mt-4 text-right tracking-luxury">
          Showing {filtered.length} of {products.length} products
        </p>
      )}
    </>
  )
}
