'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { CategoryHighlightsManager } from './CategoryHighlightsManager'
import { CategoryInfoBlocksManager } from './CategoryInfoBlocksManager'

interface CategoryOption {
  id: string
  label: string
  slug: string
  description: string | null
  imageUrl: string | null
  pageType: string
  hasChildren: boolean
}

export function CategoryList({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function deleteCategory(id: string, label: string) {
    if (!confirm(`Remove category "${label}"? This cannot be undone.`)) return
    setRemovingId(id)
    setError(null)
    try {
      await api.delete(`/admin/categories/${id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete category.')
    } finally {
      setRemovingId(null)
    }
  }

  if (categories.length === 0) return null

  return (
    <div className="border border-luxury-gray rounded-xl bg-luxury-white/[0.02] p-6 max-w-xl space-y-3">
      <h2 className="text-xs uppercase tracking-luxury text-luxury-muted">Categories</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <ul className="divide-y divide-luxury-gray/50">
        {categories.map(c => (
          <li key={c.id} className="py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-luxury-white">{c.label}</span>
                <span className={`text-[10px] uppercase tracking-luxury px-1.5 py-0.5 border ${
                  c.pageType === 'info'
                    ? 'border-luxury-gold/40 text-luxury-gold'
                    : 'border-luxury-gray text-luxury-muted'
                }`}>
                  {c.pageType === 'info' ? 'Info' : 'Products'}
                </span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEditingId(prev => prev === c.id ? null : c.id)}
                  className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors">
                  {editingId === c.id ? 'Close' : 'Edit'}
                </button>
                <button onClick={() => deleteCategory(c.id, c.label)} disabled={removingId === c.id}
                  className="text-red-400 text-xs tracking-luxury uppercase hover:text-red-300 disabled:opacity-50 transition-colors">
                  {removingId === c.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
            {editingId === c.id && (
              <CategoryEditForm category={c} onDone={() => { setEditingId(null); router.refresh() }} />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategoryEditForm({ category, onDone }: { category: CategoryOption; onDone: () => void }) {
  const [name, setName] = useState(category.label.split(' > ').pop() ?? category.label)
  const [description, setDescription] = useState(category.description ?? '')
  const [pageType, setPageType] = useState(category.pageType)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/admin/categories/${category.id}`, { name, description, pageType })
      onDone()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 p-4 bg-luxury-white/[0.02] border border-luxury-gray rounded-lg space-y-4">
      <div>
        <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Category name"
          className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors" />
      </div>
      <div>
        <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          placeholder="A short luxury description for this category page…"
          className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors" />
      </div>
      <div>
        <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Page type</label>
        <div className="flex gap-4">
          {(['products', 'info'] as const).map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`pageType-${category.id}`} value={type} checked={pageType === type}
                onChange={() => setPageType(type)} className="accent-luxury-gold" />
              <span className={`text-sm tracking-wide ${pageType === type ? 'text-luxury-white' : 'text-luxury-muted'}`}>
                {type === 'products' ? 'Products page' : 'Info page'}
              </span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button onClick={save} loading={saving}>Save</Button>

      <div className="pt-4 border-t border-luxury-gray space-y-8">
        {pageType === 'info' ? (
          <CategoryInfoBlocksManager categoryId={category.id} />
        ) : (
          <>
            <CategoryHighlightsManager categoryId={category.id} categoryName="Hero Slider" placement="hero" />
            <CategoryHighlightsManager categoryId={category.id} categoryName="Scroll Gallery" placement="gallery" />
          </>
        )}
        {/* Menu image only for leaf categories — their image appears in the nav flyout grid */}
        {!category.hasChildren && (
          <CategoryHighlightsManager categoryId={category.id} categoryName="Menu Image" placement="menu" />
        )}
      </div>
    </div>
  )
}
