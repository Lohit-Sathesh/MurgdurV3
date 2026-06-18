'use client'
import { useEffect, useState } from 'react'
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'

interface InfoBlock {
  id: string
  heading: string | null
  body: string | null
  mediaUrl: string | null
  mediaType: string
  textTheme: string
  layout: string
  sortOrder: number
}

const LAYOUTS = [
  { value: 'full', label: 'Full width (text over media)' },
  { value: 'left', label: 'Media left, text right' },
  { value: 'right', label: 'Text left, media right' },
  { value: 'text', label: 'Text only' },
]

export function CategoryInfoBlocksManager({ categoryId }: { categoryId: string }) {
  const [blocks, setBlocks] = useState<InfoBlock[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/admin/categories/${categoryId}/info-blocks`)
      setBlocks(res.data)
    } catch {
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [categoryId])

  function updateBlock(id: string, patch: Partial<InfoBlock>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }

  async function saveBlock(id: string, body: Partial<InfoBlock>) {
    await api.patch(`/admin/category-info-blocks/${id}`, body)
  }

  async function removeBlock(id: string) {
    if (!confirm('Remove this content block?')) return
    await api.delete(`/admin/category-info-blocks/${id}`)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="border border-luxury-gray rounded-xl bg-luxury-white/[0.02] p-6 space-y-4">
      <div>
        <h2 className="text-luxury-white text-sm tracking-luxury uppercase">Info Page Blocks</h2>
        <p className="text-luxury-muted text-xs mt-1">Add text, images, videos or GIFs to build the page. Blocks appear in order.</p>
      </div>
      {loading ? (
        <p className="text-luxury-muted text-xs">Loading…</p>
      ) : (
        <div className="space-y-4">
          {blocks.map(block => (
            <InfoBlockCard key={block.id} block={block} onUpdate={updateBlock} onSave={saveBlock} onRemove={() => removeBlock(block.id)} />
          ))}
          <AddInfoBlockCard categoryId={categoryId} sortOrder={blocks.length} onCreated={load} />
        </div>
      )}
    </div>
  )
}

function InfoBlockCard({
  block, onUpdate, onSave, onRemove,
}: {
  block: InfoBlock
  onUpdate: (id: string, patch: Partial<InfoBlock>) => void
  onSave: (id: string, body: Partial<InfoBlock>) => Promise<void>
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
      const res = await api.post('/media/upload-homepage', formData, { headers: { 'Content-Type': undefined } })
      const patch = { mediaUrl: res.data.url, mediaType: res.data.mediaType, textTheme: res.data.textTheme }
      onUpdate(block.id, patch)
      await onSave(block.id, patch)
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="border border-luxury-gray p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-luxury-muted text-[10px] uppercase tracking-luxury">Block #{block.sortOrder + 1}</span>
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Layout selector */}
      <select value={block.layout}
        onChange={e => { onUpdate(block.id, { layout: e.target.value }); onSave(block.id, { layout: e.target.value }) }}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 focus:border-luxury-gold outline-none">
        {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>

      {/* Media area */}
      {block.layout !== 'text' && (
        <div className="relative w-full aspect-video border border-luxury-gray overflow-hidden group">
          {block.mediaUrl ? (
            block.mediaType === 'video' ? (
              <video src={block.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.mediaUrl} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-luxury-muted text-xs uppercase tracking-luxury">No media yet</div>
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
      )}

      {/* Text theme toggle (only relevant for full layout) */}
      {block.mediaUrl && block.layout === 'full' && (
        <button onClick={() => {
            const next = block.textTheme === 'light' ? 'dark' : 'light'
            onUpdate(block.id, { textTheme: next })
            onSave(block.id, { textTheme: next })
          }}
          className="w-full text-[10px] uppercase tracking-luxury text-luxury-muted hover:text-luxury-gold transition-colors border border-luxury-gray px-2 py-1">
          {block.textTheme === 'light' ? 'Light bg (dark text)' : 'Dark bg (light text)'}
        </button>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Heading */}
      <input value={block.heading ?? ''} placeholder="Heading (optional)"
        onChange={e => onUpdate(block.id, { heading: e.target.value })}
        onBlur={() => onSave(block.id, { heading: block.heading })}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1.5 focus:border-luxury-gold outline-none" />

      {/* Body text */}
      <textarea value={block.body ?? ''} placeholder="Body text (optional)"
        rows={4}
        onChange={e => onUpdate(block.id, { body: e.target.value })}
        onBlur={() => onSave(block.id, { body: block.body })}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-sm px-2 py-1.5 focus:border-luxury-gold outline-none resize-none" />
    </div>
  )
}

function AddInfoBlockCard({ categoryId, sortOrder, onCreated }: { categoryId: string; sortOrder: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('image')
  const [textTheme, setTextTheme] = useState('dark')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [layout, setLayout] = useState('full')
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
      const res = await api.post('/media/upload-homepage', formData, { headers: { 'Content-Type': undefined } })
      setMediaUrl(res.data.url)
      setMediaType(res.data.mediaType ?? 'image')
      setTextTheme(res.data.textTheme ?? 'dark')
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      await api.post(`/admin/categories/${categoryId}/info-blocks`, {
        heading: heading || undefined,
        body: body || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType,
        textTheme,
        layout,
        sortOrder,
      })
      setMediaUrl(''); setMediaType('image'); setHeading(''); setBody(''); setLayout('full'); setTextTheme('dark')
      setOpen(false)
      onCreated()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add block.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full border border-dashed border-luxury-gray py-3 text-luxury-muted text-xs uppercase tracking-luxury hover:border-luxury-gold hover:text-luxury-gold transition-colors">
        + Add Content Block
      </button>
    )
  }

  return (
    <div className="border border-dashed border-luxury-gray p-4 space-y-3">
      <select value={layout} onChange={e => setLayout(e.target.value)}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-2 py-1.5 focus:border-luxury-gold outline-none">
        {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>

      {layout !== 'text' && (
        <div className="relative w-full aspect-video border border-dashed border-luxury-gray overflow-hidden flex items-center justify-center">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video src={mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <label className="text-luxury-muted text-xs uppercase tracking-luxury cursor-pointer text-center px-2">
              {uploading ? 'Uploading…' : '+ Upload Media'}
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
          )}
          {mediaUrl && (
            <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <span className="w-9 h-9 rounded-full bg-luxury-white/90 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-luxury-black" />
              </span>
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>
      )}

      {mediaUrl && layout === 'full' && (
        <button onClick={() => setTextTheme(t => t === 'light' ? 'dark' : 'light')}
          className="w-full text-[10px] uppercase tracking-luxury text-luxury-muted hover:text-luxury-gold transition-colors border border-luxury-gray px-2 py-1">
          {textTheme === 'light' ? 'Light bg (dark text)' : 'Dark bg (light text)'}
        </button>
      )}

      <input value={heading} placeholder="Heading (optional)" onChange={e => setHeading(e.target.value)}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-1.5 focus:border-luxury-gold outline-none" />
      <textarea value={body} placeholder="Body text (optional)" rows={4} onChange={e => setBody(e.target.value)}
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-sm px-2 py-1.5 focus:border-luxury-gold outline-none resize-none" />

      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={saving}
          className="flex-1 text-xs tracking-luxury uppercase text-luxury-gold hover:text-luxury-white disabled:opacity-50 transition-colors py-1.5 border border-luxury-gold/40">
          {saving ? 'Adding…' : '+ Add Block'}
        </button>
        <button onClick={() => setOpen(false)}
          className="text-xs tracking-luxury uppercase text-luxury-muted hover:text-luxury-white transition-colors px-3 border border-luxury-gray">
          Cancel
        </button>
      </div>
    </div>
  )
}
