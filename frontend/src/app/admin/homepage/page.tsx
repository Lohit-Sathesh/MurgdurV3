'use client'
import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, Plus, ChevronDown }   from 'lucide-react'
import { api }                   from '@/lib/api'
import { DragList }              from '@/components/ui/DragList'
import { TextPositionPicker, type TextPosition } from '@/components/admin/TextPositionPicker'
import { useAdminToast }         from '@/components/admin/AdminToast'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Slide {
  id: string; mediaUrl: string; mediaType: string; placement: string
  headline: string; subheading?: string | null; linkUrl?: string | null
  sortOrder: number; isActive: boolean; textTheme: string; textPosition: string
}

interface Block {
  id: string; type: 'scroll' | 'products' | 'editorial'; sortOrder: number; isActive: boolean
  content: any
}

interface ProductResult { id: string; name: string; sku: string; images: { url: string }[] }

// ── Product picker ────────────────────────────────────────────────────────────

function ProductPicker({ selected, maxProducts, onChange }: {
  selected: ProductResult[]
  maxProducts: number
  onChange: (products: ProductResult[]) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get('/products', { params: { q, limit: 8 } })
        setResults(res.data?.products ?? res.data ?? [])
      } catch {} finally { setSearching(false) }
    }, 300)
  }, [q])

  function add(p: ProductResult) {
    if (selected.some(s => s.id === p.id) || selected.length >= maxProducts) return
    onChange([...selected, p])
  }
  function remove(id: string) { onChange(selected.filter(p => p.id !== id)) }

  return (
    <div className="space-y-3">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-3 py-2 outline-none focus:border-luxury-gold rounded" />

      {searching && <p className="text-luxury-muted text-[10px]">Searching…</p>}

      {results.length > 0 && (
        <div className="border border-luxury-gray/40 rounded divide-y divide-luxury-gray/20 max-h-48 overflow-y-auto">
          {results.map(p => {
            const already = selected.some(s => s.id === p.id)
            const full    = selected.length >= maxProducts && !already
            return (
              <button key={p.id} onClick={() => add(p)} disabled={already || full}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${already ? 'opacity-40 cursor-not-allowed' : full ? 'opacity-30 cursor-not-allowed' : 'hover:bg-luxury-white/5'}`}>
                {p.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="w-8 h-8 object-cover rounded border border-luxury-gray/30 shrink-0" />
                )}
                <span className="flex-1 text-luxury-white text-[10px] truncate">{p.name}</span>
                <span className="text-luxury-muted text-[9px]">{already ? 'Added' : full ? 'Full' : '+ Add'}</span>
              </button>
            )
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 bg-luxury-white/5 border border-luxury-gray/40 rounded px-2 py-1">
              {p.images?.[0]?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0].url} alt="" className="w-5 h-5 object-cover rounded shrink-0" />
              )}
              <span className="text-luxury-white text-[10px] max-w-[100px] truncate">{p.name}</span>
              <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-300 text-[10px] shrink-0">✕</button>
            </div>
          ))}
          <p className="text-luxury-muted text-[9px] w-full">{selected.length}/{maxProducts} selected</p>
        </div>
      )}
    </div>
  )
}

// ── Block editors ─────────────────────────────────────────────────────────────

function ScrollBlockEditor({ block, scrollSlides, onChange }: {
  block: Block; scrollSlides: Slide[]
  onChange: (content: any) => void
}) {
  const c = block.content
  return (
    <div>
      <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Select scroll section</label>
      <select value={c.slideId ?? ''}
        onChange={e => onChange({ ...c, slideId: e.target.value })}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-3 py-2 outline-none focus:border-luxury-gold">
        <option value="">— pick a scroll slide —</option>
        {scrollSlides.map(s => (
          <option key={s.id} value={s.id}>
            {s.headline || `Slide (${s.mediaType})`}
          </option>
        ))}
      </select>
      {c.slideId && (() => {
        const slide = scrollSlides.find(s => s.id === c.slideId)
        return slide ? (
          <div className="mt-2 flex items-center gap-3 border border-luxury-gray/30 rounded p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {slide.mediaType !== 'video' && <img src={slide.mediaUrl} alt="" className="w-14 h-10 object-cover rounded shrink-0" />}
            <p className="text-luxury-white text-xs">{slide.headline || '(no headline)'}</p>
          </div>
        ) : null
      })()}
    </div>
  )
}

function ProductsBlockEditor({ block, onChange }: { block: Block; onChange: (content: any) => void }) {
  const c = block.content
  const rows = c.rows ?? 1
  const maxProducts = rows * 4
  const [productObjs, setProductObjs] = useState<ProductResult[]>(c._productObjs ?? [])

  function updateProducts(products: ProductResult[]) {
    setProductObjs(products)
    onChange({ ...c, productIds: products.map(p => p.id), _productObjs: products })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Eyebrow (optional)</label>
          <input value={c.eyebrow ?? ''} onChange={e => onChange({ ...c, eyebrow: e.target.value })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
        <div>
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Heading (optional)</label>
          <input value={c.heading ?? ''} onChange={e => onChange({ ...c, heading: e.target.value })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
        <div className="col-span-2">
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Subheading (optional)</label>
          <input value={c.subheading ?? ''} onChange={e => onChange({ ...c, subheading: e.target.value })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-luxury-muted text-[10px] uppercase tracking-luxury shrink-0">Rows of products</label>
        <input type="number" min={1} max={5} value={rows}
          onChange={e => onChange({ ...c, rows: Number(e.target.value), productIds: [], _productObjs: [] })}
          className="w-16 bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold text-center" />
        <span className="text-luxury-muted text-[10px]">= max {maxProducts} products</span>
      </div>
      <ProductPicker selected={productObjs} maxProducts={maxProducts} onChange={updateProducts} />
    </div>
  )
}

function EditorialBlockEditor({ block, onChange }: { block: Block; onChange: (content: any) => void }) {
  const c = block.content
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Eyebrow</label>
          <input value={c.eyebrow ?? ''} onChange={e => onChange({ ...c, eyebrow: e.target.value })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
        <div>
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Headline</label>
          <input value={c.headline ?? ''} onChange={e => onChange({ ...c, headline: e.target.value })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
        <div className="col-span-2">
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Description</label>
          <textarea value={c.description ?? ''} rows={3} onChange={e => onChange({ ...c, description: e.target.value })}
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold resize-none" />
        </div>
        <div>
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Button label</label>
          <input value={c.buttonLabel ?? ''} onChange={e => onChange({ ...c, buttonLabel: e.target.value })}
            placeholder="optional"
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
        <div>
          <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Button URL</label>
          <input value={c.buttonUrl ?? ''} onChange={e => onChange({ ...c, buttonUrl: e.target.value })}
            placeholder="/collections/..."
            className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
        </div>
      </div>
    </div>
  )
}

// ── Block card ────────────────────────────────────────────────────────────────

function BlockCard({ block, handle, scrollSlides, onSave, onDelete, onToggle }: {
  block: Block; handle: React.ReactNode; scrollSlides: Slide[]
  onSave: (id: string, content: any) => Promise<void>
  onDelete: (id: string) => void
  onToggle: (id: string, isActive: boolean) => void
}) {
  const [open,    setOpen]    = useState(false)
  const [content, setContent] = useState(block.content)
  const [saving,  setSaving]  = useState(false)
  const { toast } = useAdminToast()

  const TYPE_LABELS: Record<string, string> = {
    scroll:    'Scroll Section',
    products:  'Product Block',
    editorial: 'Editorial Block',
  }

  async function save() {
    setSaving(true)
    try {
      await onSave(block.id, content)
      toast(`${TYPE_LABELS[block.type]} saved.`)
      setOpen(false)
    } finally { setSaving(false) }
  }

  return (
    <div className={`border rounded-xl transition-colors ${block.isActive ? 'border-luxury-gray/50' : 'border-luxury-gray/20 opacity-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {handle}
        <span className="text-luxury-muted text-xs">{TYPE_LABELS[block.type] ?? block.type}</span>
        {block.type === 'editorial' && block.content?.headline && (
          <span className="text-luxury-white text-[10px] truncate flex-1">— {block.content.headline}</span>
        )}
        {block.type === 'products' && block.content?.heading && (
          <span className="text-luxury-white text-[10px] truncate flex-1">— {block.content.heading}</span>
        )}
        {block.type === 'scroll' && (
          <span className="text-luxury-muted text-[10px] flex-1 truncate">— {scrollSlides.find(s => s.id === block.content?.slideId)?.headline || 'pick a slide'}</span>
        )}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button onClick={() => onToggle(block.id, !block.isActive)}
            className="text-[10px] tracking-luxury uppercase text-luxury-muted hover:text-luxury-gold transition-colors">
            {block.isActive ? 'Hide' : 'Show'}
          </button>
          <button onClick={() => setOpen(o => !o)}
            className="text-luxury-gold text-[10px] tracking-luxury uppercase hover:text-luxury-white transition-colors">
            {open ? 'Close' : 'Edit'}
          </button>
          <button onClick={() => { if (confirm('Remove this block?')) onDelete(block.id) }}
            className="text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      {open && (
        <div className="border-t border-luxury-gray/30 px-4 py-4 space-y-4">
          {block.type === 'scroll' && (
            <ScrollBlockEditor block={{ ...block, content }} scrollSlides={scrollSlides} onChange={c => setContent(c)} />
          )}
          {block.type === 'products' && (
            <ProductsBlockEditor block={{ ...block, content }} onChange={c => setContent(c)} />
          )}
          {block.type === 'editorial' && (
            <EditorialBlockEditor block={{ ...block, content }} onChange={c => setContent(c)} />
          )}
          <button onClick={save} disabled={saving}
            className="px-5 py-2 border border-luxury-gold text-luxury-gold text-[10px] tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all disabled:opacity-50 rounded-full">
            {saving ? 'Saving…' : 'Save Block'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminHomepagePage() {
  const [slides,  setSlides]  = useState<Slide[]>([])
  const [blocks,  setBlocks]  = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const { toast } = useAdminToast()

  async function load() {
    setLoading(true)
    try {
      const [sRes, bRes] = await Promise.all([
        api.get('/admin/homepage-slides'),
        api.get('/admin/homepage-blocks'),
      ])
      setSlides(sRes.data ?? [])
      setBlocks(bRes.data ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function addBlock(type: 'scroll' | 'products' | 'editorial') {
    setAddOpen(false)
    const defaultContent: Record<string, any> = {
      scroll:    { slideId: '' },
      products:  { eyebrow: '', heading: '', subheading: '', rows: 1, productIds: [], _productObjs: [] },
      editorial: { eyebrow: '', headline: '', description: '', buttonLabel: '', buttonUrl: '' },
    }
    try {
      const res = await api.post('/admin/homepage-blocks', {
        type, sortOrder: blocks.length, content: defaultContent[type],
      })
      const created = res.data?.data ?? res.data
      setBlocks(prev => [...prev, created])
      toast(`${type} block added.`)
    } catch {}
  }

  async function saveBlock(id: string, content: any) {
    await api.patch(`/admin/homepage-blocks/${id}`, { content })
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
  }

  async function deleteBlock(id: string) {
    await api.delete(`/admin/homepage-blocks/${id}`)
    setBlocks(prev => prev.filter(b => b.id !== id))
    toast('Block removed.')
  }

  async function toggleBlock(id: string, isActive: boolean) {
    await api.patch(`/admin/homepage-blocks/${id}`, { isActive })
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, isActive } : b))
  }

  async function reorderBlocks(reordered: Block[]) {
    const updated = reordered.map((b, idx) => ({ ...b, sortOrder: idx }))
    setBlocks(updated)
    await Promise.all(updated.map(b => api.patch(`/admin/homepage-blocks/${b.id}`, { sortOrder: b.sortOrder }).catch(() => {})))
  }

  const heroSlides   = slides.filter(s => s.placement === 'hero').sort((a, b) => a.sortOrder - b.sortOrder)
  const scrollSlides = slides.filter(s => s.placement === 'scroll').sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section className="space-y-10">
      <h1 className="font-serif text-4xl tracking-luxury">Homepage</h1>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading ? <p className="text-luxury-muted text-sm">Loading…</p> : (
        <>
          {/* ── Hero Slider ─────────────────────────────────────────────────── */}
          <div>
            <h2 className="font-serif text-2xl tracking-luxury mb-4">Hero Slider</h2>
            <div className="space-y-3 mb-4">
              <DragList items={heroSlides} onReorder={async items => {
                const updated = items.map((s, idx) => ({ ...s, sortOrder: idx }))
                setSlides(prev => {
                  const rest = prev.filter(s => s.placement !== 'hero')
                  return [...rest, ...updated]
                })
                await Promise.all(updated.map(s => api.patch(`/admin/homepage-slides/${s.id}`, { sortOrder: s.sortOrder }).catch(() => {})))
              }}>
                {(slide, handle) => (
                  <SlideCard slide={slide} handle={handle}
                    onUpdate={(id, patch) => setSlides(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))}
                    onSave={async (id, body) => { await api.patch(`/admin/homepage-slides/${id}`, body) }}
                    onToggleActive={() => {
                      const next = !slide.isActive
                      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, isActive: next } : s))
                      api.patch(`/admin/homepage-slides/${slide.id}`, { isActive: next }).catch(() => {})
                    }}
                    onRemove={async () => {
                      if (!confirm('Remove this hero slide?')) return
                      await api.delete(`/admin/homepage-slides/${slide.id}`)
                      setSlides(prev => prev.filter(s => s.id !== slide.id))
                    }} />
                )}
              </DragList>
            </div>
            <AddSlideCard placement="hero" sortOrder={heroSlides.length} onCreated={load} />
          </div>

          {/* ── Page Builder ────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-2xl tracking-luxury">Page Content</h2>
                <p className="text-luxury-muted text-xs mt-0.5">Everything below the hero. Drag to reorder.</p>
              </div>

              {/* Add block dropdown */}
              <div className="relative">
                <button onClick={() => setAddOpen(o => !o)}
                  className="flex items-center gap-2 px-4 py-2 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all rounded-full">
                  <Plus className="w-3.5 h-3.5" />
                  Add Block
                  <ChevronDown className="w-3 h-3" />
                </button>
                {addOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-luxury-black border border-luxury-gray rounded-xl shadow-2xl z-20 w-52 overflow-hidden">
                    {[
                      { type: 'scroll' as const,    label: 'Scroll Section',  desc: 'Full-screen scroll image/video' },
                      { type: 'products' as const,  label: 'Product Block',   desc: 'Hand-picked products grid'      },
                      { type: 'editorial' as const, label: 'Editorial Block',  desc: 'Text, headline, CTA button'    },
                    ].map(opt => (
                      <button key={opt.type} onClick={() => addBlock(opt.type)}
                        className="w-full text-left px-4 py-3 hover:bg-luxury-white/5 transition-colors border-b border-luxury-gray/30 last:border-0">
                        <p className="text-luxury-white text-xs font-medium">{opt.label}</p>
                        <p className="text-luxury-muted text-[10px] mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {blocks.length === 0 ? (
              <div className="border border-dashed border-luxury-gray/40 rounded-xl py-16 text-center">
                <p className="text-luxury-muted text-sm">No blocks yet.</p>
                <p className="text-luxury-muted text-xs mt-1">Click "+ Add Block" to start building your homepage.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <DragList items={blocks} onReorder={reorderBlocks}>
                  {(block, handle) => (
                    <BlockCard
                      block={block} handle={handle} scrollSlides={scrollSlides}
                      onSave={saveBlock} onDelete={deleteBlock} onToggle={toggleBlock}
                    />
                  )}
                </DragList>
              </div>
            )}
          </div>

          {/* ── Scroll Slides library ───────────────────────────────────────── */}
          <div>
            <h2 className="font-serif text-2xl tracking-luxury mb-2">Scroll Sections Library</h2>
            <p className="text-luxury-muted text-xs mb-4">Upload scroll images/videos here, then add them to the page via a "Scroll Section" block above.</p>
            <div className="space-y-3 mb-4">
              <DragList items={scrollSlides} onReorder={async items => {
                const updated = items.map((s, idx) => ({ ...s, sortOrder: idx }))
                setSlides(prev => {
                  const rest = prev.filter(s => s.placement !== 'scroll')
                  return [...rest, ...updated]
                })
                await Promise.all(updated.map(s => api.patch(`/admin/homepage-slides/${s.id}`, { sortOrder: s.sortOrder }).catch(() => {})))
              }}>
                {(slide, handle) => (
                  <SlideCard slide={slide} handle={handle}
                    onUpdate={(id, patch) => setSlides(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))}
                    onSave={async (id, body) => { await api.patch(`/admin/homepage-slides/${id}`, body) }}
                    onToggleActive={() => {
                      const next = !slide.isActive
                      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, isActive: next } : s))
                      api.patch(`/admin/homepage-slides/${slide.id}`, { isActive: next }).catch(() => {})
                    }}
                    onRemove={async () => {
                      if (!confirm('Remove this scroll slide?')) return
                      await api.delete(`/admin/homepage-slides/${slide.id}`)
                      setSlides(prev => prev.filter(s => s.id !== slide.id))
                    }} />
                )}
              </DragList>
            </div>
            <AddSlideCard placement="scroll" sortOrder={scrollSlides.length} onCreated={load} />
          </div>
        </>
      )}
    </section>
  )
}

// ── SlideCard (reused for hero + scroll library) ───────────────────────────────

function SlideCard({ slide, handle, onUpdate, onSave, onToggleActive, onRemove }: {
  slide: Slide; handle: React.ReactNode
  onUpdate: (id: string, patch: Partial<Slide>) => void
  onSave:   (id: string, body: Partial<Slide>) => Promise<void>
  onToggleActive: () => void
  onRemove: () => Promise<void>
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
    <div className="border border-luxury-gray/40 bg-luxury-white/[0.02] p-3 rounded-lg">
      <div className="flex gap-3">
        <div className="flex items-start pt-1 shrink-0">{handle}</div>
        <div className="relative w-32 aspect-video border border-luxury-gray/30 overflow-hidden group rounded shrink-0">
          {slide.mediaType === 'video'
            ? <video src={slide.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={slide.mediaUrl} alt="" className="w-full h-full object-cover" />
          }
          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
            {uploading ? <span className="text-luxury-white text-[9px]">Uploading…</span>
              : <Pencil className="w-4 h-4 text-luxury-white" />}
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
          {!slide.isActive && <span className="absolute top-1 left-1 bg-black/70 text-luxury-muted text-[8px] uppercase px-1 py-0.5">Hidden</span>}
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <input value={slide.headline} placeholder="Headline (optional)"
            onChange={e => onUpdate(slide.id, { headline: e.target.value })}
            onBlur={() => onSave(slide.id, { headline: slide.headline })}
            className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
          <input value={slide.subheading ?? ''} placeholder="Subtitle (optional)"
            onChange={e => onUpdate(slide.id, { subheading: e.target.value })}
            onBlur={() => onSave(slide.id, { subheading: slide.subheading })}
            className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
          <input value={slide.linkUrl ?? ''} placeholder="Link URL"
            onChange={e => onUpdate(slide.id, { linkUrl: e.target.value })}
            onBlur={() => onSave(slide.id, { linkUrl: slide.linkUrl })}
            className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
          <div className="flex items-center gap-2 flex-wrap">
            <TextPositionPicker value={slide.textPosition}
              onChange={v => { onUpdate(slide.id, { textPosition: v }); onSave(slide.id, { textPosition: v }) }} />
            <button onClick={() => {
                const next = slide.textTheme === 'light' ? 'dark' : 'light'
                onUpdate(slide.id, { textTheme: next }); onSave(slide.id, { textTheme: next })
              }}
              className="text-[9px] uppercase tracking-luxury text-luxury-muted border border-luxury-gray/50 px-2 py-1 hover:text-luxury-gold self-end">
              {slide.textTheme === 'light' ? 'White text' : 'Black text'}
            </button>
            <button onClick={onToggleActive} className="text-[9px] tracking-luxury uppercase text-luxury-gold hover:text-luxury-white self-end">
              {slide.isActive ? 'Hide' : 'Show'}
            </button>
            <button onClick={onRemove} className="text-red-400 hover:text-red-300 self-end ml-auto">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {error && <p className="text-red-400 text-[10px]">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function AddSlideCard({ placement, sortOrder, onCreated }: { placement: string; sortOrder: number; onCreated: () => void }) {
  const [form,      setForm]      = useState({ mediaUrl: '', mediaType: 'image', headline: '', subheading: '', linkUrl: '', textTheme: 'dark', textPosition: 'center' })
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
    } catch (err: any) { setError(err?.message ?? 'Upload failed.') }
    finally { setUploading(false) }
  }

  async function handleCreate() {
    if (!form.mediaUrl) { setError('Please upload media first.'); return }
    setSaving(true); setError(null)
    try {
      await api.post('/admin/homepage-slides', { ...form, sortOrder, placement })
      setForm({ mediaUrl: '', mediaType: 'image', headline: '', subheading: '', linkUrl: '', textTheme: 'dark', textPosition: 'center' })
      onCreated()
    } catch (err: any) { setError(err?.message ?? 'Failed to add.') }
    finally { setSaving(false) }
  }

  return (
    <div className="border border-dashed border-luxury-gray/40 rounded-lg p-3 space-y-2">
      <p className="text-luxury-muted text-[10px] uppercase tracking-luxury">Add new slide</p>
      <div className="flex gap-3">
        <div className="relative w-32 aspect-video border border-dashed border-luxury-gray/40 overflow-hidden flex items-center justify-center rounded shrink-0">
          {form.mediaUrl
            ? form.mediaType === 'video'
              ? <video src={form.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={form.mediaUrl} alt="" className="w-full h-full object-cover" />
            : <label className="text-luxury-muted text-[9px] cursor-pointer text-center px-2">
                {uploading ? 'Uploading…' : '+ Upload'}
                <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>
          }
          {form.mediaUrl && (
            <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <Pencil className="w-4 h-4 text-luxury-white" />
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <input value={form.headline} placeholder="Headline (optional)" onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
            className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
          <input value={form.subheading ?? ''} placeholder="Subtitle (optional)" onChange={e => setForm(f => ({ ...f, subheading: e.target.value }))}
            className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
          <input value={form.linkUrl ?? ''} placeholder="Link URL" onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
            className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-muted text-xs px-2 py-1.5 outline-none focus:border-luxury-gold" />
          <TextPositionPicker value={form.textPosition} onChange={v => setForm(f => ({ ...f, textPosition: v }))} />
        </div>
      </div>
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
      <button onClick={handleCreate} disabled={saving}
        className="w-full text-[10px] tracking-luxury uppercase text-luxury-gold border border-luxury-gold/40 py-1.5 hover:bg-luxury-gold/10 disabled:opacity-50 transition-all">
        {saving ? 'Adding…' : '+ Add Slide'}
      </button>
    </div>
  )
}
