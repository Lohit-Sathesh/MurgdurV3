'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { SizeGuide, SizeGuideBlock } from '@/types/product'

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ── Block editors ─────────────────────────────────────────────────────────────

function ImageBlock({ block, onChange, onUpload }: {
  block: SizeGuideBlock
  onChange: (b: SizeGuideBlock) => void
  onUpload: (file: File) => Promise<string>
}) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await onUpload(file)
      onChange({ ...block, url })
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block">Image URL</label>
      <input value={block.url ?? ''} onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder="https://… or upload below"
        className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-3 py-2 outline-none focus:border-luxury-gold" />
      <div className="flex items-center gap-3">
        <label className="cursor-pointer text-luxury-gold text-[10px] tracking-luxury uppercase hover:text-luxury-white transition-colors">
          {uploading ? 'Uploading…' : '+ Upload image'}
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {block.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.url} alt="preview" className="h-12 w-12 object-cover border border-luxury-gray rounded" />
        )}
      </div>
    </div>
  )
}

function TableBlock({ block, onChange }: { block: SizeGuideBlock; onChange: (b: SizeGuideBlock) => void }) {
  const cols = block.columns ?? []
  const rows = block.rows   ?? []

  function setCol(ci: number, val: string) {
    const next = [...cols]; next[ci] = val
    onChange({ ...block, columns: next })
  }
  function addCol() { onChange({ ...block, columns: [...cols, 'Column'], rows: rows.map(r => [...r, '']) }) }
  function removeCol(ci: number) {
    onChange({ ...block, columns: cols.filter((_, i) => i !== ci), rows: rows.map(r => r.filter((_, i) => i !== ci)) })
  }
  function setCell(ri: number, ci: number, val: string) {
    const next = rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r)
    onChange({ ...block, rows: next })
  }
  function addRow() { onChange({ ...block, rows: [...rows, cols.map(() => '')] }) }
  function removeRow(ri: number) { onChange({ ...block, rows: rows.filter((_, i) => i !== ri) }) }

  return (
    <div className="space-y-3 overflow-x-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-luxury-muted text-[10px] uppercase tracking-luxury">Columns:</span>
        {cols.map((c, ci) => (
          <div key={ci} className="flex items-center gap-1">
            <input value={c} onChange={e => setCol(ci, e.target.value)}
              className="bg-luxury-black border border-luxury-gray text-luxury-white text-[10px] px-2 py-1 w-24 outline-none focus:border-luxury-gold" />
            <button onClick={() => removeCol(ci)} className="text-red-400 text-[10px] hover:text-red-300">✕</button>
          </div>
        ))}
        <button onClick={addCol} className="text-luxury-gold text-[10px] tracking-luxury uppercase hover:text-luxury-white">+ Col</button>
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>{cols.map((c, ci) => <th key={ci} className="text-luxury-muted text-[10px] tracking-luxury uppercase border border-luxury-gray px-2 py-1 text-left">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-luxury-gray/40 px-1 py-0.5">
                  <input value={cell} onChange={e => setCell(ri, ci, e.target.value)}
                    className="bg-transparent text-luxury-white text-[10px] w-full outline-none px-1" />
                </td>
              ))}
              <td className="pl-2">
                <button onClick={() => removeRow(ri)} className="text-red-400 text-[10px] hover:text-red-300">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="text-luxury-gold text-[10px] tracking-luxury uppercase hover:text-luxury-white">+ Add Row</button>
    </div>
  )
}

function TextBlock({ block, onChange }: { block: SizeGuideBlock; onChange: (b: SizeGuideBlock) => void }) {
  return (
    <textarea
      value={block.content ?? ''}
      onChange={e => onChange({ ...block, content: e.target.value })}
      rows={3}
      placeholder="Enter descriptive text…"
      className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted text-xs px-3 py-2 outline-none focus:border-luxury-gold leading-relaxed resize-none"
    />
  )
}

// ── Guide editor ──────────────────────────────────────────────────────────────

function GuideEditor({ guide, onSave, onDelete }: {
  guide: SizeGuide
  onSave: (g: SizeGuide) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [name,    setName]    = useState(guide.name)
  const [blocks,  setBlocks]  = useState<SizeGuideBlock[]>(guide.blocks)
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)

  function updateBlock(i: number, b: SizeGuideBlock) {
    setBlocks(prev => prev.map((x, j) => j === i ? b : x))
  }
  function removeBlock(i: number) { setBlocks(prev => prev.filter((_, j) => j !== i)) }
  function addBlock(type: SizeGuideBlock['type']) {
    const base = { id: uid(), type }
    const block: SizeGuideBlock =
      type === 'table' ? { ...base, columns: ['Size', 'Measurement'], rows: [['XS', ''], ['S', ''], ['M', '']] } :
      type === 'image' ? { ...base, url: '' } :
                         { ...base, content: '' }
    setBlocks(prev => [...prev, block])
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData(); fd.append('file', file)
    const res = await api.post('/size-guides/upload-image', fd, { headers: { 'Content-Type': undefined } })
    return res.data.url
  }

  async function save() {
    setSaving(true)
    try { await onSave({ ...guide, name, blocks }) } finally { setSaving(false) }
  }

  return (
    <div className="border border-luxury-gray/50 rounded-xl bg-luxury-white/[0.02] p-5 space-y-5">
      {/* Guide name */}
      <div className="flex items-center gap-3">
        <input value={name} onChange={e => setName(e.target.value)}
          className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold tracking-luxury"
          placeholder="Guide name (e.g. Women's)" />
        <button onClick={save} disabled={saving}
          className="px-4 py-2 border border-luxury-gold text-luxury-gold text-[10px] tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={async () => { if (!confirm(`Delete "${name}"?`)) return; setDeleting(true); await onDelete(); setDeleting(false) }}
          disabled={deleting}
          className="px-4 py-2 border border-red-400/40 text-red-400 text-[10px] tracking-luxury uppercase hover:bg-red-400/10 transition-all disabled:opacity-50">
          {deleting ? '…' : 'Delete'}
        </button>
      </div>

      {/* Blocks */}
      {blocks.map((block, i) => (
        <div key={block.id} className="border border-luxury-gray/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-luxury-muted text-[10px] uppercase tracking-luxury">
              {block.type === 'image' ? 'Image' : block.type === 'table' ? 'Measurement Table' : 'Text'}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => i > 0 && setBlocks(b => move(b, i, i - 1))} disabled={i === 0}
                className="text-luxury-muted text-xs hover:text-luxury-white disabled:opacity-20">↑</button>
              <button onClick={() => i < blocks.length - 1 && setBlocks(b => move(b, i, i + 1))} disabled={i === blocks.length - 1}
                className="text-luxury-muted text-xs hover:text-luxury-white disabled:opacity-20">↓</button>
              <button onClick={() => removeBlock(i)} className="text-red-400 text-[10px] hover:text-red-300">Remove</button>
            </div>
          </div>

          {block.type === 'image' && <ImageBlock block={block} onChange={b => updateBlock(i, b)} onUpload={uploadImage} />}
          {block.type === 'table' && <TableBlock block={block} onChange={b => updateBlock(i, b)} />}
          {block.type === 'text'  && <TextBlock  block={block} onChange={b => updateBlock(i, b)} />}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-luxury-muted text-[10px] uppercase tracking-luxury">Add block:</span>
        {(['table', 'image', 'text'] as const).map(t => (
          <button key={t} onClick={() => addBlock(t)}
            className="text-luxury-gold text-[10px] tracking-luxury uppercase hover:text-luxury-white transition-colors">
            + {t}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SizeGuidesPage() {
  const [guides,  setGuides]  = useState<SizeGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)

  useEffect(() => {
    api.get('/size-guides').then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
      setGuides(arr)
    }).finally(() => setLoading(false))
  }, [])

  async function saveGuide(g: SizeGuide) {
    const res = await api.patch(`/size-guides/${g.id}`, { name: g.name, blocks: g.blocks })
    const updated: SizeGuide = res.data?.data ?? res.data
    setGuides(prev => prev.map(x => x.id === updated.id ? updated : x))
  }

  async function deleteGuide(id: string) {
    await api.delete(`/size-guides/${id}`)
    setGuides(prev => prev.filter(g => g.id !== id))
  }

  async function addGuide() {
    setAdding(true)
    try {
      const res = await api.post('/size-guides', { name: 'New Guide', sortOrder: guides.length, blocks: [] })
      const created: SizeGuide = res.data?.data ?? res.data
      setGuides(prev => [...prev, created])
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <p className="text-luxury-muted text-sm">Loading…</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl tracking-luxury">Size Guides</h1>
          <p className="text-luxury-muted text-xs mt-1 tracking-luxury">
            Each guide is assigned per-product in Admin → Catalog. "Free Size" products show no size guide button.
          </p>
        </div>
        <button onClick={addGuide} disabled={adding}
          className="px-6 py-2 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all disabled:opacity-50">
          {adding ? 'Creating…' : '+ New Guide'}
        </button>
      </div>

      {guides.length === 0 && (
        <p className="text-luxury-muted text-xs">No guides yet. Click "+ New Guide" to create one, or they will be auto-seeded on first product page visit.</p>
      )}

      {guides.map(guide => (
        <GuideEditor
          key={guide.id}
          guide={guide}
          onSave={saveGuide}
          onDelete={() => deleteGuide(guide.id)}
        />
      ))}
    </div>
  )
}
