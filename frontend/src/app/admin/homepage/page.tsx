'use client'
import { useEffect, useState } from 'react'
import { Pencil, Trash2 }        from 'lucide-react'
import { api }                   from '@/lib/api'
import { DragList }              from '@/components/ui/DragList'
import { TextPositionPicker, type TextPosition } from '@/components/admin/TextPositionPicker'
import { useAdminToast }         from '@/components/admin/AdminToast'

interface Slide {
  id: string
  mediaUrl: string
  mediaType: string
  placement: string
  headline: string
  subheading?: string | null
  linkUrl?: string | null
  sortOrder: number
  isActive: boolean
  textTheme: string
  textPosition: string
}

const EMPTY = (placement: string, sortOrder: number): Omit<Slide, 'id'> => ({
  mediaUrl: '', mediaType: 'image', placement, headline: '', subheading: '', linkUrl: '', sortOrder, isActive: true, textTheme: 'dark', textPosition: 'center',
})

export default function AdminHomepagePage() {
  const [slides,  setSlides]  = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/admin/homepage-slides')
      setSlides(res.data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load slides.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function updateSlide(id: string, patch: Partial<Slide>) {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  async function saveSlide(id: string, body: Partial<Slide>) {
    await api.patch(`/admin/homepage-slides/${id}`, body)
  }

  async function toggleActive(slide: Slide) {
    updateSlide(slide.id, { isActive: !slide.isActive })
    await saveSlide(slide.id, { isActive: !slide.isActive })
  }

  async function remove(id: string) {
    if (!confirm('Remove this slide? This cannot be undone.')) return
    await api.delete(`/admin/homepage-slides/${id}`)
    setSlides(prev => prev.filter(s => s.id !== id))
  }

  async function reorder(group: Slide[], reordered: Slide[]) {
    // Update sortOrder optimistically
    const updated = reordered.map((s, idx) => ({ ...s, sortOrder: idx }))
    setSlides(prev => {
      const others = prev.filter(s => !group.some(g => g.id === s.id))
      return [...others, ...updated].sort((a, b) => {
        if (a.placement !== b.placement) return a.placement.localeCompare(b.placement)
        return a.sortOrder - b.sortOrder
      })
    })
    // Persist to backend
    await Promise.all(updated.map(s => api.patch(`/admin/homepage-slides/${s.id}`, { sortOrder: s.sortOrder }).catch(() => {})))
  }

  const heroSlides   = slides.filter(s => s.placement === 'hero').sort((a, b) => a.sortOrder - b.sortOrder)
  const scrollSlides = slides.filter(s => s.placement === 'scroll').sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section>
      <h1 className="font-serif text-4xl tracking-luxury mb-2">Homepage</h1>
      <p className="text-luxury-muted text-sm mb-10">
        Drag the grip handle to reorder slides. Hover an image and click the pencil to replace it.
      </p>

      {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

      {loading ? (
        <p className="text-luxury-muted text-sm">Loading…</p>
      ) : (
        <>
          {/* ── Hero Slider ─────────────────────────────────────────────── */}
          <h2 className="font-serif text-2xl tracking-luxury mb-4">Hero Slider</h2>
          <div className="space-y-3 mb-4">
            <DragList items={heroSlides} onReorder={items => reorder(heroSlides, items)}>
              {(slide, handle) => (
                <SlideCard slide={slide} handle={handle}
                  onUpdate={updateSlide} onSave={saveSlide}
                  onToggleActive={() => toggleActive(slide)}
                  onRemove={() => remove(slide.id)} />
              )}
            </DragList>
          </div>
          <div className="mb-16">
            <AddSlideCard placement="hero" sortOrder={heroSlides.length} onCreated={load} />
          </div>

          {/* ── Scroll Sections ──────────────────────────────────────────── */}
          <h2 className="font-serif text-2xl tracking-luxury mb-4">Scroll Sections</h2>
          <p className="text-luxury-muted text-xs mb-4 tracking-luxury">
            Supports both images and videos. Videos play on loop (not frame-scrubbing).
          </p>
          <div className="space-y-3 mb-4">
            <DragList items={scrollSlides} onReorder={items => reorder(scrollSlides, items)}>
              {(slide, handle) => (
                <SlideCard slide={slide} handle={handle}
                  onUpdate={updateSlide} onSave={saveSlide}
                  onToggleActive={() => toggleActive(slide)}
                  onRemove={() => remove(slide.id)} />
              )}
            </DragList>
          </div>
          <AddSlideCard placement="scroll" sortOrder={scrollSlides.length} onCreated={load} />
        </>
      )}
    </section>
  )
}

// ── Slide card ────────────────────────────────────────────────────────────────

function SlideCard({ slide, handle, onUpdate, onSave, onToggleActive, onRemove }: {
  slide: Slide
  handle: React.ReactNode
  onUpdate: (id: string, patch: Partial<Slide>) => void
  onSave:   (id: string, body: Partial<Slide>) => Promise<void>
  onToggleActive: () => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post('/media/upload-homepage', fd, { headers: { 'Content-Type': undefined } })
      onUpdate(slide.id, { mediaUrl: res.data.url, mediaType: res.data.mediaType, textTheme: res.data.textTheme })
      await onSave(slide.id,  { mediaUrl: res.data.url, mediaType: res.data.mediaType, textTheme: res.data.textTheme })
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false); e.target.value = ''
    }
  }

  return (
    <div className="border border-luxury-gray bg-luxury-white/[0.02] p-4">
      <div className="flex gap-4">
        {/* Drag handle */}
        <div className="flex items-start pt-1 shrink-0">{handle}</div>

        {/* Thumbnail */}
        <div className="relative w-40 aspect-video border border-luxury-gray overflow-hidden group shrink-0">
          {slide.mediaType === 'video' ? (
            <video src={slide.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.mediaUrl} alt="" className="w-full h-full object-cover" />
          )}
          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            {uploading ? (
              <span className="text-luxury-white text-xs uppercase tracking-luxury">Uploading…</span>
            ) : (
              <span className="w-8 h-8 rounded-full bg-luxury-white/90 flex items-center justify-center">
                <Pencil className="w-3.5 h-3.5 text-luxury-black" />
              </span>
            )}
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
          {!slide.isActive && (
            <span className="absolute top-1 left-1 bg-luxury-black/80 text-luxury-muted text-[9px] uppercase tracking-luxury px-1.5 py-0.5">Inactive</span>
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-2">
          <input value={slide.headline} placeholder="Headline (optional)"
            onChange={e => onUpdate(slide.id, { headline: e.target.value })}
            onBlur={() => onSave(slide.id, { headline: slide.headline })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <input value={slide.subheading ?? ''} placeholder="Subtitle (optional)"
            onChange={e => onUpdate(slide.id, { subheading: e.target.value })}
            onBlur={() => onSave(slide.id, { subheading: slide.subheading })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
          <input value={slide.linkUrl ?? ''} placeholder="Link URL (/collections/...)"
            onChange={e => onUpdate(slide.id, { linkUrl: e.target.value })}
            onBlur={() => onSave(slide.id, { linkUrl: slide.linkUrl })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <TextPositionPicker
              value={slide.textPosition}
              onChange={v => { onUpdate(slide.id, { textPosition: v }); onSave(slide.id, { textPosition: v }) }}
            />
            <button onClick={() => {
                const next = slide.textTheme === 'light' ? 'dark' : 'light'
                onUpdate(slide.id, { textTheme: next }); onSave(slide.id, { textTheme: next })
              }}
              className="text-[10px] uppercase tracking-luxury text-luxury-muted hover:text-luxury-gold transition-colors border border-luxury-gray px-2 py-1 self-end">
              {slide.textTheme === 'light' ? 'White text' : 'Black text'}
            </button>
            <button onClick={onToggleActive}
              className="text-[10px] tracking-luxury uppercase text-luxury-gold hover:text-luxury-white transition-colors self-end">
              {slide.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={onRemove} className="text-red-400 hover:text-red-300 transition-colors ml-auto self-end">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Add slide card ────────────────────────────────────────────────────────────

function AddSlideCard({ placement, sortOrder, onCreated }: { placement: string; sortOrder: number; onCreated: () => void }) {
  const [form,      setForm]      = useState(EMPTY(placement, sortOrder))
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post('/media/upload-homepage', fd, { headers: { 'Content-Type': undefined } })
      setForm(f => ({ ...f, mediaUrl: res.data.url, mediaType: res.data.mediaType, textTheme: res.data.textTheme ?? 'dark' }))
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate() {
    if (!form.mediaUrl) { setError('Please upload an image or video first.'); return }
    setSaving(true); setError(null)
    try {
      await api.post('/admin/homepage-slides', { ...form, sortOrder })
      setForm(EMPTY(placement, sortOrder + 1))
      onCreated()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create slide.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-dashed border-luxury-gray p-4 space-y-2">
      <p className="text-luxury-muted text-[10px] uppercase tracking-luxury">Add new slide</p>
      <div className="relative w-40 aspect-video border border-dashed border-luxury-gray overflow-hidden flex items-center justify-center">
        {form.mediaUrl ? (
          form.mediaType === 'video'
            ? <video src={form.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={form.mediaUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury cursor-pointer text-center px-2">
            {uploading ? 'Uploading…' : '+ Upload media'}
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
        )}
        {form.mediaUrl && (
          <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            <Pencil className="w-4 h-4 text-luxury-white" />
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
      <input value={form.headline} placeholder="Headline (optional)"
        onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1.5 focus:border-luxury-gold outline-none" />
      <input value={form.subheading ?? ''} placeholder="Subtitle (optional)"
        onChange={e => setForm(f => ({ ...f, subheading: e.target.value }))}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
      <input value={form.linkUrl ?? ''} placeholder="Link URL (/collections/...)"
        onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 focus:border-luxury-gold outline-none" />
      <TextPositionPicker value={form.textPosition} onChange={v => setForm(f => ({ ...f, textPosition: v }))} />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handleCreate} disabled={saving}
        className="w-full text-xs tracking-luxury uppercase text-luxury-gold hover:text-luxury-white disabled:opacity-50 transition-colors py-1.5 border border-luxury-gold/40">
        {saving ? 'Adding…' : '+ Add Slide'}
      </button>
    </div>
  )
}
