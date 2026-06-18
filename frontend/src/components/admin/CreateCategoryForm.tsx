'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

interface CategoryOption {
  id: string
  label: string
}

export function CreateCategoryForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', parentId: '', pageType: 'products' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      await api.post('/admin/categories', {
        name: form.name,
        parentId: form.parentId || undefined,
        pageType: form.pageType,
      })
      setForm({ name: '', parentId: '', pageType: 'products' })
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create category.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return <Button variant="outline" onClick={() => setOpen(true)}>Add Category</Button>
  }

  return (
    <div className="border border-luxury-gray rounded-xl bg-luxury-white/[0.02] p-6 space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Name (e.g. Ready to Wear)" value={form.name} onChange={e => update('name', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none col-span-2" />
        <select value={form.parentId} onChange={e => update('parentId', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none col-span-2">
          <option value="">No parent (top-level category)</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <p className="text-luxury-muted text-xs uppercase tracking-luxury mb-2">Page type</p>
        <div className="flex gap-4">
          {(['products', 'info'] as const).map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="pageType" value={type} checked={form.pageType === type}
                onChange={() => update('pageType', type)}
                className="accent-luxury-gold" />
              <span className={`text-sm tracking-wide ${form.pageType === type ? 'text-luxury-white' : 'text-luxury-muted'}`}>
                {type === 'products' ? 'Products page' : 'Info page (editorial / about)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={submit} loading={loading}>Create</Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}
