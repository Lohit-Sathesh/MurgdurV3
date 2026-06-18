'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface CategoryOption { id: string; label: string }

interface Props {
  categories:    CategoryOption[]
  onSearch:      (q: string) => void
  onCategory:    (id: string) => void
}

export function CatalogFilters({ categories, onSearch, onCategory }: Props) {
  const [q,   setQ]   = useState('')
  const [cat, setCat] = useState('')

  function handleSearch(val: string) {
    setQ(val)
    onSearch(val)
  }

  function handleCategory(id: string) {
    setCat(id)
    onCategory(id)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Search */}
      <div className="flex items-center gap-2 border border-luxury-gray rounded-lg px-3 py-2 flex-1 min-w-[200px] focus-within:border-luxury-gold transition-colors">
        <Search className="w-4 h-4 text-luxury-muted shrink-0" />
        <input
          value={q}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="flex-1 bg-transparent text-luxury-white text-sm outline-none placeholder:text-luxury-muted/50"
        />
        {q && (
          <button onClick={() => handleSearch('')} className="text-luxury-muted hover:text-luxury-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <select
        value={cat}
        onChange={e => handleCategory(e.target.value)}
        className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded-lg min-w-[160px]"
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
    </div>
  )
}
