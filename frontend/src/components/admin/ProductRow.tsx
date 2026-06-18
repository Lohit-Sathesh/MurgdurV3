'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Variant {
  id: string
  sku: string
  color: string | null
  colorHex: string | null
  size: string | null
  stock: number
}

function emptyVariantInput() {
  return { color: '', colorHex: '#000000', size: '', stock: '' }
}

interface ProductImage {
  id: string
  url: string
  sortOrder: number
  variantId: string | null
  isVideo?: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  description: string
  material: string | null
  categoryId: string
  price: string
  comparePrice: string | null
  isActive: boolean
  variants: Variant[]
  images: ProductImage[]
  sizeGuideId?: string | null
}

interface CategoryOption {
  id: string
  label: string
}

export function ProductRow({ product, categories }: { product: Product; categories: CategoryOption[] }) {
  const router = useRouter()
  const [price, setPrice] = useState(product.price)
  const [comparePrice, setComparePrice] = useState(product.comparePrice ?? '')
  const [isActive, setIsActive] = useState(product.isActive)
  const [variants, setVariants] = useState(product.variants)
  const [images, setImages] = useState(product.images)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name,        setName]        = useState(product.name)
  const [slug,        setSlug]        = useState(product.slug)
  const [description, setDescription] = useState(product.description)
  const [material,    setMaterial]    = useState(product.material ?? '')
  const [categoryId,   setCategoryId]   = useState(product.categoryId)
  const [sizeGuideId,  setSizeGuideId]  = useState<string>(product.sizeGuideId ?? 'free')
  const [sizeGuides,   setSizeGuides]   = useState<{ id: string; name: string }[]>([])
  const [editError, setEditError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)
  const [removingImageId, setRemovingImageId] = useState<string | null>(null)
  const [newVariant, setNewVariant] = useState(emptyVariantInput())
  const [addingVariant, setAddingVariant] = useState(false)
  const [removingVariantId, setRemovingVariantId] = useState<string | null>(null)

  async function savePrice() {
    setSaving(true)
    try {
      await api.patch(`/admin/products/${product.id}`, { price: Number(price) })
    } finally {
      setSaving(false)
    }
  }

  async function saveComparePrice() {
    setSaving(true)
    try {
      await api.patch(`/admin/products/${product.id}`, {
        comparePrice: comparePrice === '' ? null : Number(comparePrice),
      })
    } finally {
      setSaving(false)
    }
  }

  // Fetch size guides once when the edit panel opens
  useEffect(() => {
    if (editing && !sizeGuides.length) {
      api.get('/size-guides').then(r => {
        const arr = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        setSizeGuides(arr)
      }).catch(() => {})
    }
  }, [editing])

  async function saveDetails() {
    setSaving(true)
    setEditError(null)
    try {
      await api.patch(`/admin/products/${product.id}`, {
        name, description, material: material || null, categoryId,
        sizeGuideId: sizeGuideId === 'free' ? null : sizeGuideId,
        slug: slug.trim() || undefined,
      })
      router.refresh()
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? err?.message ?? 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive() {
    const next = !isActive
    setIsActive(next)
    await api.patch(`/admin/products/${product.id}`, { isActive: next })
  }

  async function updateStock(variantId: string, stock: number) {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, stock } : v))
    await api.patch(`/admin/products/variants/${variantId}`, { stock })
  }

  async function updateVariantField(variantId: string, field: 'color' | 'colorHex' | 'size', value: string) {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: value } : v))
    await api.patch(`/admin/products/variants/${variantId}`, { [field]: value || null })
  }

  async function addVariant() {
    setAddingVariant(true)
    setEditError(null)
    try {
      const res = await api.post(`/admin/products/${product.id}/variants`, {
        color: newVariant.color || undefined,
        colorHex: newVariant.color ? newVariant.colorHex : undefined,
        size: newVariant.size || undefined,
        stock: Number(newVariant.stock) || 0,
      })
      setVariants(prev => [...prev, res.data])
      setNewVariant(emptyVariantInput())
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? err?.message ?? 'Failed to add variant.')
    } finally {
      setAddingVariant(false)
    }
  }

  async function removeVariant(variantId: string) {
    if (!confirm('Remove this variant? This cannot be undone.')) return
    setRemovingVariantId(variantId)
    setEditError(null)
    try {
      await api.delete(`/admin/products/variants/${variantId}`)
      setVariants(prev => prev.filter(v => v.id !== variantId))
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? err?.message ?? 'Failed to remove variant.')
    } finally {
      setRemovingVariantId(null)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setEditError(null)
    try {
      const formData = new FormData()
      formData.append('sku', product.sku)
      files.forEach(f => formData.append('files', f))
      // 3-minute timeout — multiple large images processing through sharp can take a while
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': undefined },
        timeout: 180000,
      })
      const uploaded: ProductImage[] = res.data.images.map((img: any) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder, variantId: img.variantId ?? null }))
      setImages(prev => [...prev, ...uploaded])
    } catch (err: any) {
      setEditError(err?.message ?? 'Image upload failed. Try uploading fewer images at once.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleVariantImageUpload(variantId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingVariantId(variantId)
    setEditError(null)
    try {
      const formData = new FormData()
      formData.append('sku', product.sku)
      formData.append('variantId', variantId)
      files.forEach(f => formData.append('files', f))
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': undefined },
        timeout: 180000,
      })
      const uploaded: ProductImage[] = res.data.images.map((img: any) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder, variantId: img.variantId ?? null }))
      setImages(prev => [...prev, ...uploaded])
    } catch (err: any) {
      setEditError(err?.message ?? 'Image upload failed.')
    } finally {
      setUploadingVariantId(null)
      e.target.value = ''
    }
  }

  async function moveImage(imageId: string, direction: 'up' | 'down') {
    const sorted = images.filter(img => !img.variantId).sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex(img => img.id === imageId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    // Swap sort orders optimistically then persist both
    setImages(prev => prev.map(img => {
      if (img.id === a.id) return { ...img, sortOrder: b.sortOrder }
      if (img.id === b.id) return { ...img, sortOrder: a.sortOrder }
      return img
    }))
    try {
      await Promise.all([
        api.patch(`/media/images/${a.id}`, { sortOrder: b.sortOrder }),
        api.patch(`/media/images/${b.id}`, { sortOrder: a.sortOrder }),
      ])
    } catch {
      // Revert on failure
      setImages(prev => prev.map(img => {
        if (img.id === a.id) return { ...img, sortOrder: a.sortOrder }
        if (img.id === b.id) return { ...img, sortOrder: b.sortOrder }
        return img
      }))
    }
  }

  async function removeImage(imageId: string) {
    if (!confirm('Remove this image? This cannot be undone.')) return
    setRemovingImageId(imageId)
    setEditError(null)
    try {
      await api.delete(`/media/images/${imageId}`, { params: { sku: product.sku } })
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to remove image.')
    } finally {
      setRemovingImageId(null)
    }
  }

  async function deleteProduct() {
    if (!confirm(`Remove "${product.name}" from the catalog? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await api.delete(`/admin/products/${product.id}`)
      setDeleted(true)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete product.')
    } finally {
      setDeleting(false)
    }
  }

  if (deleted) return null

  return (
    <div className="border border-luxury-gray rounded-xl bg-luxury-white/[0.02] hover:border-luxury-gold/40 transition-colors duration-300 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-luxury-gray bg-luxury-black flex-shrink-0">
          {images[0] ? (
            images[0].isVideo ? (
              <video src={images[0].url} className="w-full h-full object-cover" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0].url} alt={product.name} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-luxury-muted text-[10px] uppercase tracking-luxury">No Image</div>
          )}
        </div>

        <div className="min-w-[160px] flex-1">
          <p className="text-luxury-white text-sm">{product.name}</p>
          <p className="text-luxury-muted text-xs mt-1">{product.sku}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury">Price</label>
          <input value={price} onChange={e => setPrice(e.target.value)} onBlur={savePrice}
            disabled={saving}
            className="w-24 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury">Compare</label>
          <input value={comparePrice} onChange={e => setComparePrice(e.target.value)} onBlur={saveComparePrice}
            disabled={saving} placeholder="None"
            className="w-24 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
        </div>

        <label className="flex items-center gap-2 text-luxury-muted text-[10px] uppercase tracking-luxury cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={toggleActive} className="accent-luxury-gold w-4 h-4" />
          Active
        </label>

        {product.variants.length > 0 && (
          <span className="text-luxury-muted text-xs">{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</span>
        )}

        <div className="flex gap-3 ml-auto">
          <button onClick={() => setEditing(e => !e)}
            className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors">
            {editing ? 'Close' : 'Edit'}
          </button>
          <button onClick={deleteProduct} disabled={deleting}
            className="text-red-400 text-xs tracking-luxury uppercase hover:text-red-300 disabled:opacity-50 transition-colors">
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>

      {error && <p className="px-4 pb-3 text-red-400 text-xs">{error}</p>}

      {editing && (
        <div className="border-t border-luxury-gray bg-luxury-gray/20 p-4 md:p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
                  className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-1">
                  URL Slug <span className="text-luxury-muted/60 normal-case tracking-normal">— editable, must be unique</span>
                </label>
                <div className="flex items-center gap-1 border border-luxury-gray rounded px-3 py-2 focus-within:border-luxury-gold transition-colors">
                  <span className="text-luxury-muted/50 text-xs shrink-0">/products/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 bg-transparent text-luxury-white text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Size Guide</label>
                <select value={sizeGuideId} onChange={e => setSizeGuideId(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors">
                  <option value="free">Free Size (no size guide button)</option>
                  {sizeGuides.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Material</label>
                <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="Material"
                  className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={4}
                  className="w-full bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-3 py-2 focus:border-luxury-gold outline-none transition-colors" />
              </div>
              {editError && <p className="text-red-400 text-xs">{editError}</p>}
              <button onClick={saveDetails} disabled={saving}
                className="px-5 py-2 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase rounded-full hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Images</label>
                <div className="grid grid-cols-3 gap-3">
                  {images.filter(img => !img.variantId).sort((a, b) => a.sortOrder - b.sortOrder).map((img, idx, arr) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-luxury-gray group">
                      {img.isVideo ? (
                        <video src={img.url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* Order badge */}
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full pointer-events-none">
                        {idx + 1}
                      </span>
                      {/* Hover overlay: reorder + remove */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                        <div className="flex gap-3">
                          <button onClick={() => moveImage(img.id, 'up')} disabled={idx === 0}
                            className="text-white text-base leading-none hover:text-luxury-gold disabled:opacity-25 transition-colors">↑</button>
                          <button onClick={() => moveImage(img.id, 'down')} disabled={idx === arr.length - 1}
                            className="text-white text-base leading-none hover:text-luxury-gold disabled:opacity-25 transition-colors">↓</button>
                        </div>
                        <button onClick={() => removeImage(img.id)} disabled={removingImageId === img.id}
                          className="text-red-400 text-[10px] uppercase tracking-luxury hover:text-red-300 transition-colors">
                          {removingImageId === img.id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border border-dashed border-luxury-gray flex flex-col items-center justify-center gap-1 text-luxury-muted text-xs uppercase tracking-luxury cursor-pointer hover:border-luxury-gold hover:text-luxury-gold transition-colors text-center px-2">
                    {uploading ? 'Uploading…' : (
                      <>
                        <span className="text-lg leading-none">+</span>
                        <span>Add Images</span>
                        <span className="text-[9px] normal-case tracking-normal text-luxury-muted/60">Select multiple</span>
                      </>
                    )}
                    <input type="file" accept="image/*,video/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Colors, Sizes & Stock</label>
                <div className="space-y-2">
                  {variants.map(v => (
                    <div key={v.id} className="border border-luxury-gray rounded px-3 py-2 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-luxury-muted text-xs w-full md:w-auto md:flex-1 truncate">{v.sku}</span>
                        <input type="color" value={v.colorHex || '#000000'}
                          onChange={e => updateVariantField(v.id, 'colorHex', e.target.value)}
                          className="w-8 h-8 bg-luxury-black border border-luxury-gray rounded cursor-pointer" />
                        <input value={v.color ?? ''} placeholder="Color" onChange={e => updateVariantField(v.id, 'color', e.target.value)}
                          className="w-24 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
                        <input value={v.size ?? ''} placeholder="Size" onChange={e => updateVariantField(v.id, 'size', e.target.value)}
                          className="w-16 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
                        <input type="number" value={v.stock} min={0} placeholder="Stock"
                          onChange={e => updateStock(v.id, Number(e.target.value))}
                          className="w-20 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
                        <button onClick={() => removeVariant(v.id)} disabled={removingVariantId === v.id}
                          className="text-red-400 text-xs hover:text-red-300 disabled:opacity-50 transition-colors px-1">
                          {removingVariantId === v.id ? '…' : '✕'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {images.filter(img => img.variantId === v.id).map(img => (
                          <div key={img.id} className="relative w-12 h-12 rounded overflow-hidden border border-luxury-gray group flex-shrink-0">
                            {img.isVideo ? (
                              <video src={img.url} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            )}
                            <button onClick={() => removeImage(img.id)} disabled={removingImageId === img.id}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-[10px] uppercase transition-opacity">
                              {removingImageId === img.id ? '…' : '✕'}
                            </button>
                          </div>
                        ))}
                        <label className="w-12 h-12 rounded border border-dashed border-luxury-gray flex items-center justify-center text-luxury-muted text-[10px] uppercase cursor-pointer hover:border-luxury-gold hover:text-luxury-gold transition-colors text-center flex-shrink-0">
                          {uploadingVariantId === v.id ? '…' : '+ img'}
                          <input type="file" accept="image/*,video/*" multiple onChange={e => handleVariantImageUpload(v.id, e)} disabled={uploadingVariantId === v.id} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 border border-dashed border-luxury-gray rounded px-3 py-2 flex-wrap">
                    <span className="text-luxury-muted text-xs w-full md:w-auto md:flex-1">New variant</span>
                    <input type="color" value={newVariant.colorHex}
                      onChange={e => setNewVariant(prev => ({ ...prev, colorHex: e.target.value }))}
                      className="w-8 h-8 bg-luxury-black border border-luxury-gray rounded cursor-pointer" />
                    <input value={newVariant.color} placeholder="Color"
                      onChange={e => setNewVariant(prev => ({ ...prev, color: e.target.value }))}
                      className="w-24 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
                    <input value={newVariant.size} placeholder="Size"
                      onChange={e => setNewVariant(prev => ({ ...prev, size: e.target.value }))}
                      className="w-16 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
                    <input type="number" value={newVariant.stock} min={0} placeholder="Stock"
                      onChange={e => setNewVariant(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-20 bg-luxury-black border border-luxury-gray rounded text-luxury-white text-sm px-2 py-1 focus:border-luxury-gold outline-none transition-colors" />
                    <button onClick={addVariant} disabled={addingVariant}
                      className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white disabled:opacity-50 transition-colors px-1">
                      {addingVariant ? 'Adding…' : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
