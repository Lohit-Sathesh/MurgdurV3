'use client'
import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { TextPositionPicker } from '@/components/admin/TextPositionPicker'

interface Highlight {
  id: string
  imageUrl: string
  mediaType: string
  title: string
  subheading?: string | null
  linkUrl?: string | null
  sortOrder: number
  isActive: boolean
  textTheme: string
  textPosition: string
  layout: string
  showAfterRows: number
}

const LAYOUT_OPTIONS = [
  { value: 'full',                         label: 'Full width' },
  { value: 'split-left-image-products',    label: 'Left image + right products' },
  { value: 'split-right-image-products',   label: 'Left products + right image' },
  { value: 'split-left-image-text',        label: 'Left image + right text' },
  { value: 'split-right-image-text',       label: 'Left text + right image' },
]

export function CategoryHighlightsManager({ categoryId, categoryName, placement }: { categoryId: string; categoryName: string; placement: 'menu' | 'hero' | 'gallery' }) {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)
  const isMenu = placement === 'menu'

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/admin/categories/${categoryId}/highlights`, { params: { placement } })
      setHighlights(res.data)
    } catch {
      setHighlights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [categoryId])

  function updateHighlight(id: string, patch: Partial<Highlight>) {
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h))
  }

  async function saveHighlight(id: string, body: Partial<Highlight>) {
    await api.patch(`/admin/category-highlights/${id}`, body)
  }

  async function remove(id: string) {
    if (!confirm('Remove this highlight image? This cannot be undone.')) return
    await api.delete(`/admin/category-highlights/${id}`)
    setHighlights(prev => prev.filter(h => h.id !== id))
  }

  // Menu placement: only one image allowed
  const canAdd = isMenu ? highlights.length === 0 : true

  return (
    <div className="border border-luxury-gray rounded-xl bg-luxury-white/[0.02] p-6 space-y-4">
      <div>
        <h2 className="text-luxury-white text-sm tracking-luxury uppercase">{categoryName}</h2>
        <p className="text-luxury-muted text-xs mt-1">
          {isMenu
            ? 'One image shown in the navigation flyout for this category.'
            : placement === 'gallery'
              ? 'Editorial images shown between product rows. Choose Full Width or Split (image beside 4 products).'
              : 'Shown on the category page when browsing this category.'}
        </p>
      </div>
      {loading ? (
        <p className="text-luxury-muted text-xs">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map(highlight => (
            <HighlightCard key={highlight.id} highlight={highlight} isMenu={isMenu} placement={placement}
              onUpdate={updateHighlight} onSave={saveHighlight} onRemove={() => remove(highlight.id)} />
          ))}
          {canAdd && (
            <AddHighlightCard categoryId={categoryId} placement={placement} isMenu={isMenu}
              sortOrder={highlights.length} onCreated={load} />
          )}
        </div>
      )}
    </div>
  )
}

function HighlightCard({
  highlight, isMenu, placement, onUpdate, onSave, onRemove,
}: {
  highlight: Highlight
  isMenu: boolean
  placement: string
  onUpdate: (id: string, patch: Partial<Highlight>) => void
  onSave: (id: string, body: Partial<Highlight>) => Promise<void>
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/media/upload-homepage', formData, {
        headers: { 'Content-Type': undefined },
      })
      onUpdate(highlight.id, { imageUrl: res.data.url, mediaType: res.data.mediaType, textTheme: res.data.textTheme })
      await onSave(highlight.id, { imageUrl: res.data.url, mediaType: res.data.mediaType, textTheme: res.data.textTheme })
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function toggleLayout() {
    const next = highlight.layout === 'half' ? 'full' : 'half'
    onUpdate(highlight.id, { layout: next })
    onSave(highlight.id, { layout: next })
  }

  function toggleTextTheme() {
    const next = highlight.textTheme === 'light' ? 'dark' : 'light'
    onUpdate(highlight.id, { textTheme: next })
    onSave(highlight.id, { textTheme: next })
  }

  return (
    <div className="space-y-2 border border-luxury-gray p-3">
      <div className="relative w-full aspect-[4/5] border border-luxury-gray overflow-hidden group">
        {highlight.mediaType === 'video' ? (
          <video src={highlight.imageUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={highlight.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          {uploading ? (
            <span className="text-luxury-white text-xs uppercase tracking-luxury">Uploading…</span>
          ) : (
            <span className="w-9 h-9 rounded-full bg-luxury-white/90 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-luxury-black" />
            </span>
          )}
          <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Title, subtitle, link only for non-menu placements */}
      {!isMenu && (
        <>
          <input value={highlight.title} placeholder="Title (optional)"
            onChange={e => onUpdate(highlight.id, { title: e.target.value })}
            onBlur={() => onSave(highlight.id, { title: highlight.title })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <input value={highlight.subheading ?? ''} placeholder="Subtitle (optional)"
            onChange={e => onUpdate(highlight.id, { subheading: e.target.value })}
            onBlur={() => onSave(highlight.id, { subheading: highlight.subheading })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <input value={highlight.linkUrl ?? ''} placeholder="Link URL (/collections/...)"
            onChange={e => onUpdate(highlight.id, { linkUrl: e.target.value })}
            onBlur={() => onSave(highlight.id, { linkUrl: highlight.linkUrl })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <TextPositionPicker
            value={highlight.textPosition}
            onChange={v => { onUpdate(highlight.id, { textPosition: v }); onSave(highlight.id, { textPosition: v }) }}
          />
        </>
      )}

      {/* Layout + showAfterRows — gallery only */}
      {placement === 'gallery' && (
        <div className="space-y-2">
          <select
            value={highlight.layout}
            onChange={e => { onUpdate(highlight.id, { layout: e.target.value }); onSave(highlight.id, { layout: e.target.value }) }}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-[10px] px-2 py-1.5 outline-none focus:border-luxury-gold">
            {LAYOUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-luxury-muted text-[10px] uppercase tracking-luxury shrink-0">Show after</span>
            <input type="number" min={1} max={10} value={highlight.showAfterRows ?? 1}
              onChange={e => onUpdate(highlight.id, { showAfterRows: Number(e.target.value) })}
              onBlur={() => onSave(highlight.id, { showAfterRows: highlight.showAfterRows })}
              className="w-16 bg-luxury-black border border-luxury-gray text-luxury-white text-[10px] px-2 py-1 outline-none focus:border-luxury-gold text-center" />
            <span className="text-luxury-muted text-[10px] uppercase tracking-luxury shrink-0">product rows</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button onClick={toggleTextTheme}
          className="text-[10px] uppercase tracking-luxury text-luxury-muted hover:text-luxury-gold transition-colors border border-luxury-gray px-2 py-1">
          {highlight.textTheme === 'light' ? 'White text' : 'Black text'}
        </button>
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function AddHighlightCard({ categoryId, placement, isMenu, sortOrder, onCreated }: {
  categoryId: string
  placement: string
  isMenu: boolean
  sortOrder: number
  onCreated: () => void
}) {
  const [imageUrl,      setImageUrl]      = useState('')
  const [mediaType,     setMediaType]     = useState('image')
  const [title,         setTitle]         = useState('')
  const [subheading,    setSubheading]    = useState('')
  const [textTheme,     setTextTheme]     = useState('dark')
  const [textPosition,  setTextPosition]  = useState('center')
  const [layout,        setLayout]        = useState('full')
  const [showAfterRows, setShowAfterRows] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/media/upload-homepage', formData, {
        headers: { 'Content-Type': undefined },
      })
      setImageUrl(res.data.url)
      setMediaType(res.data.mediaType ?? 'image')
      setTextTheme(res.data.textTheme ?? 'dark')
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate() {
    if (!imageUrl) { setError('Please upload an image first.'); return }
    setSaving(true)
    setError(null)
    try {
      await api.post(`/admin/categories/${categoryId}/highlights`, {
        imageUrl, mediaType,
        title: isMenu ? '' : title,
        subheading: isMenu ? undefined : (subheading || undefined),
        sortOrder, placement, textTheme, textPosition, layout,
        showAfterRows: placement === 'gallery' ? showAfterRows : undefined,
      })
      setImageUrl(''); setMediaType('image'); setTitle('')
      setSubheading(''); setTextTheme('dark'); setTextPosition('center'); setLayout('full'); setShowAfterRows(1)
      onCreated()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create highlight.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2 border border-dashed border-luxury-gray p-3">
      <div className="relative w-full aspect-[4/5] border border-dashed border-luxury-gray overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          mediaType === 'video' ? (
            <video src={imageUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <label className="text-luxury-muted text-xs uppercase tracking-luxury cursor-pointer text-center px-2">
            {uploading ? 'Uploading…' : '+ Add Image'}
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
        )}
        {imageUrl && (
          <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            <span className="w-9 h-9 rounded-full bg-luxury-white/90 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-luxury-black" />
            </span>
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>

      {/* Title + subtitle + position — non-menu only */}
      {!isMenu && (
        <>
          <input value={title} placeholder="Title (optional)"
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <input value={subheading} placeholder="Subtitle (optional)"
            onChange={e => setSubheading(e.target.value)}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <TextPositionPicker value={textPosition} onChange={setTextPosition} />
        </>
      )}

      {imageUrl && (
        <>
          {placement === 'gallery' && (
            <div className="space-y-2">
              <select value={layout} onChange={e => setLayout(e.target.value)}
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-[10px] px-2 py-1.5 outline-none focus:border-luxury-gold">
                {LAYOUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-luxury-muted text-[10px] shrink-0">Show after</span>
                <input type="number" min={1} max={10} value={showAfterRows}
                  onChange={e => setShowAfterRows(Number(e.target.value))}
                  className="w-16 bg-luxury-black border border-luxury-gray text-luxury-white text-[10px] px-2 py-1 outline-none focus:border-luxury-gold text-center" />
                <span className="text-luxury-muted text-[10px] shrink-0">rows</span>
              </div>
            </div>
          )}
          <button onClick={() => setTextTheme(t => t === 'light' ? 'dark' : 'light')}
            className="w-full text-[10px] uppercase tracking-luxury text-luxury-muted hover:text-luxury-gold transition-colors border border-luxury-gray px-2 py-1">
            {textTheme === 'light' ? 'White text' : 'Black text'}
          </button>
        </>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handleCreate} disabled={saving}
        className="w-full text-xs tracking-luxury uppercase text-luxury-gold hover:text-luxury-white disabled:opacity-50 transition-colors py-1.5 border border-luxury-gold/40">
        {saving ? 'Adding…' : '+ Add'}
      </button>
    </div>
  )
}
