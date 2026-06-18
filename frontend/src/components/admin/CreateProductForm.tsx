'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button }    from '@/components/ui/Button'
import { DragList }  from '@/components/ui/DragList'
import { api } from '@/lib/api'

interface CategoryOption {
  id: string
  label: string
}

interface VariantInput {
  color: string
  colorHex: string
  size: string
  stock: string
}

interface CreatedProduct {
  id: string
  sku: string
  name: string
}

interface UploadedImage {
  id: string
  url: string
}

function emptyVariant(): VariantInput {
  return { color: '', colorHex: '#000000', size: '', stock: '' }
}

export function CreateProductForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter()

  // Step 1 state
  const [open, setOpen]         = useState(false)
  const [step, setStep]         = useState<1 | 2>(1)
  const [form, setForm]         = useState({ name: '', description: '', price: '', categoryId: categories[0]?.id ?? '', sizeGuideId: 'free', slug: '' })
  const [sizeGuides, setSizeGuides] = useState<{ id: string; name: string }[]>([])
  const [variants, setVariants] = useState<VariantInput[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Step 2 state
  const [created, setCreated]   = useState<CreatedProduct | null>(null)
  const [images, setImages]     = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateVariant(index: number, field: keyof VariantInput, value: string) {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  useEffect(() => {
    api.get('/size-guides').then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
      setSizeGuides(arr)
    }).catch(() => {})
  }, [])

  function reset() {
    setStep(1)
    setForm({ name: '', description: '', price: '', categoryId: categories[0]?.id ?? '', sizeGuideId: 'free', slug: '' })
    setVariants([])
    setError(null)
    setCreated(null)
    setImages([])
    setUploadError(null)
    setOpen(false)
  }

  // ── Step 1: Create the product ──────────────────────────────────────
  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const payload: any = {
        ...form,
        price: Number(form.price),
        sizeGuideId: form.sizeGuideId === 'free' ? null : form.sizeGuideId,
        slug: form.slug.trim() || undefined,
      }
      if (variants.length > 0) {
        payload.variants = variants.map(v => ({
          color: v.color || undefined,
          colorHex: v.colorHex || undefined,
          size: v.size || undefined,
          stock: Number(v.stock) || 0,
        }))
      }
      const res = await api.post('/products', payload)
      const product = res.data
      setCreated({ id: product.id, sku: product.sku, name: product.name })
      setStep(2)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create product.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Upload images ───────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!created) return
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('sku', created.sku)
      files.forEach(f => formData.append('files', f))
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': undefined },
        timeout: 180000,
      })
      const uploaded: UploadedImage[] = res.data.images.map((img: any) => ({ id: img.id, url: img.url }))
      setImages(prev => [...prev, ...uploaded])
    } catch (err: any) {
      setUploadError(err?.message ?? 'Image upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function removeImage(imageId: string) {
    if (!created) return
    try {
      await api.delete(`/media/images/${imageId}`, { params: { sku: created.sku } })
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch {}
  }

  async function reorderImages(reordered: UploadedImage[]) {
    setImages(reordered)
    // Persist new sort orders
    await Promise.all(
      reordered.map((img, idx) =>
        api.patch(`/media/images/${img.id}`, { sortOrder: idx }).catch(() => {})
      )
    )
  }

  function done() {
    router.refresh()
    reset()
  }

  if (!open) {
    return <Button variant="outline" onClick={() => setOpen(true)}>Add Product</Button>
  }

  // ── Step 2: Image upload ────────────────────────────────────────────
  if (step === 2 && created) {
    return (
      <div className="border border-luxury-gold/40 rounded-xl bg-luxury-white/[0.02] p-6 space-y-6 max-w-2xl">
        <div>
          <p className="text-luxury-gold text-xs tracking-luxury uppercase mb-1">Product Created</p>
          <h3 className="text-luxury-white text-lg font-serif">{created.name}</h3>
          <p className="text-luxury-muted text-xs mt-1">SKU: {created.sku}</p>
        </div>

        <div>
          <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-3">
            Add Images (optional — you can also add them later via the Edit panel)
          </label>
          {/* Drag-and-drop image grid */}
          <DragList items={images} onReorder={reorderImages}>
            {(img, handle) => (
              <div className="flex items-center gap-3 border border-luxury-gray/40 rounded-lg p-2 bg-luxury-white/[0.02]">
                {handle}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-14 h-14 object-cover rounded border border-luxury-gray/30 shrink-0" />
                <span className="flex-1 text-luxury-muted text-xs truncate">{img.url.split('/').pop()}</span>
                <button onClick={() => removeImage(img.id)}
                  className="text-red-400 text-[10px] hover:text-red-300 transition-colors shrink-0">
                  Remove
                </button>
              </div>
            )}
          </DragList>
          <label className="flex items-center justify-center gap-2 border border-dashed border-luxury-gray rounded-lg py-4 text-luxury-muted text-xs uppercase tracking-luxury cursor-pointer hover:border-luxury-gold hover:text-luxury-gold transition-colors mt-2">
            {uploading ? 'Uploading…' : <><span className="text-xl leading-none">+</span><span>Add Images</span></>}
            <input type="file" accept="image/*,video/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
          </label>
          {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
        </div>

        <div className="flex gap-3">
          <Button onClick={done}>Done — Go to Catalog</Button>
          <button onClick={done}
            className="text-luxury-muted text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors">
            Skip images
          </button>
        </div>
      </div>
    )
  }

  // ── Step 1: Product details ─────────────────────────────────────────
  return (
    <div className="border border-luxury-gray rounded-xl bg-luxury-white/[0.02] p-6 space-y-6 max-w-2xl">
      <p className="text-luxury-muted text-xs tracking-luxury uppercase">New Product — Step 1 of 2: Details</p>

      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Name" value={form.name} onChange={e => update('name', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none" />
        <input required type="number" placeholder="Price" value={form.price} onChange={e => update('price', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none" />
        <select required value={form.categoryId} onChange={e => update('categoryId', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none">
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={form.sizeGuideId} onChange={e => update('sizeGuideId', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none">
          <option value="free">Free Size (no size guide)</option>
          {sizeGuides.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <textarea required placeholder="Description" value={form.description} onChange={e => update('description', e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none col-span-2" rows={3} />
        {/* Optional custom slug */}
        <div className="col-span-2 flex items-center gap-1 border border-luxury-gray text-luxury-white text-sm px-3 py-2 focus-within:border-luxury-gold outline-none">
          <span className="text-luxury-muted/50 text-xs shrink-0">/products/</span>
          <input value={form.slug}
            onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="custom-slug (optional — auto-generated if blank)"
            className="flex-1 bg-transparent outline-none" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-luxury-muted text-xs uppercase tracking-luxury">Variants (optional)</h3>
          <button type="button" onClick={() => setVariants(prev => [...prev, emptyVariant()])}
            className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white">
            + Add Variant
          </button>
        </div>
        {variants.length === 0 && (
          <p className="text-luxury-muted text-xs">No variants — product will have a single default option.</p>
        )}
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center border border-luxury-gray/50 p-3">
            <input placeholder="Size (e.g. M)" value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)}
              className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none" />
            <input placeholder="Color (e.g. Black)" value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)}
              className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none" />
            <input type="color" value={v.colorHex || '#000000'} onChange={e => updateVariant(i, 'colorHex', e.target.value)}
              className="bg-luxury-black border border-luxury-gray h-9 w-full cursor-pointer" />
            <div className="flex gap-2">
              <input type="number" min={0} placeholder="Stock" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)}
                className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1 w-full focus:border-luxury-gold outline-none" />
              <button type="button" onClick={() => setVariants(prev => prev.filter((_, j) => j !== i))}
                className="text-red-400 text-xs hover:text-red-300 px-2">✕</button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={submit} loading={loading}>Create & Add Images →</Button>
        <Button variant="outline" onClick={reset}>Cancel</Button>
      </div>
    </div>
  )
}
