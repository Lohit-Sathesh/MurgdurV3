'use client'
import { useEffect, useRef, useState } from 'react'
import { Trash2, Plus, Settings, X, Upload, ChevronRight, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { CategoryHighlightsManager } from '@/components/admin/CategoryHighlightsManager'
import { CategoryInfoBlocksManager } from '@/components/admin/CategoryInfoBlocksManager'
import { useAdminToast } from '@/components/admin/AdminToast'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryNode {
  id:          string
  name:        string
  slug:        string
  imageUrl:    string | null
  description: string | null
  pageType:    string
  linkUrl:     string | null
  parentId:    string | null
  children:    CategoryNode[]
}

// ── Level colours ─────────────────────────────────────────────────────────────

const LEVEL_STYLES = [
  { card: 'border-blue-500/40 bg-blue-950/25',     badge: 'bg-blue-900/60 text-blue-300',       label: 'Root Category'   },
  { card: 'border-emerald-500/30 bg-emerald-950/20', badge: 'bg-emerald-900/60 text-emerald-300', label: 'Subcategory'    },
  { card: 'border-amber-500/30 bg-amber-950/20',   badge: 'bg-amber-900/60 text-amber-300',      label: 'Sub-subcategory' },
]
function levelStyle(depth: number) { return LEVEL_STYLES[Math.min(depth, 2)] }

// ── Configure modal ───────────────────────────────────────────────────────────

function ConfigureModal({ cat, onClose, onSaved }: {
  cat: CategoryNode
  onClose: () => void
  onSaved: (updated: Partial<CategoryNode>) => void
}) {
  const { toast } = useAdminToast()
  const [name,        setName]        = useState(cat.name)
  const [slug,        setSlug]        = useState(cat.slug)
  const [description, setDescription] = useState(cat.description ?? '')
  const [pageType,    setPageType]    = useState(cat.pageType ?? 'products')
  const [linkUrl,     setLinkUrl]     = useState(cat.linkUrl ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const stopProp = (e: WheelEvent) => e.stopPropagation()
    const el = outerRef.current
    el?.addEventListener('wheel', stopProp, { passive: true })
    return () => {
      el?.removeEventListener('wheel', stopProp)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  async function save() {
    setSaving(true); setError(null)
    try {
      await api.patch(`/admin/categories/${cat.id}`, {
        name, slug: slug || undefined,
        description, pageType,
        linkUrl: pageType === 'link' ? linkUrl : null,
      })
      onSaved({ name, slug, description, pageType, linkUrl: pageType === 'link' ? linkUrl : null })
      toast('Category saved.')
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={outerRef} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center px-4 pt-16 pb-16">
        <div className="relative w-full max-w-2xl bg-luxury-black border border-luxury-gray rounded-2xl shadow-2xl">

          <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-luxury-gray bg-luxury-black rounded-t-2xl">
            <div>
              <h2 className="font-serif text-xl tracking-luxury text-luxury-white">Configure Category</h2>
              <p className="text-luxury-muted text-xs mt-0.5 tracking-luxury">{cat.name}</p>
            </div>
            <button onClick={onClose} className="text-luxury-muted hover:text-luxury-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Category Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold rounded" />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-1">
                URL Slug <span className="text-luxury-muted/60 normal-case tracking-normal">(auto-generated if blank)</span>
              </label>
              <div className="flex items-center gap-2 border border-luxury-gray rounded focus-within:border-luxury-gold px-3 py-2">
                <span className="text-luxury-muted/50 text-xs">/collections/</span>
                <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder={cat.slug}
                  className="flex-1 bg-transparent text-luxury-white text-sm outline-none" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold rounded resize-none" />
            </div>

            {/* Page type */}
            <div>
              <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-3">Page Type</label>
              <div className="flex gap-6 flex-wrap">
                {([
                  ['products', 'Products page'],
                  ['info',     'Info / Editorial'],
                  // Link type only available when the category has no subcategories
                  ...(!cat.children?.length ? [['link', 'Link (redirect)']] as const : []),
                ] as const).map(([t, label]) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={pageType === t} onChange={() => setPageType(t)} className="accent-luxury-gold" />
                    <span className={`text-sm ${pageType === t ? 'text-luxury-white' : 'text-luxury-muted'}`}>{label}</span>
                  </label>
                ))}
              </div>

              {pageType === 'link' && (
                <div className="mt-4">
                  <label className="block text-luxury-muted text-xs uppercase tracking-luxury mb-2">Redirect URL</label>
                  <input
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://example.com or /collections/sale"
                    className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold rounded"
                  />
                  <p className="text-luxury-muted text-[10px] mt-1">
                    Visiting this category URL will immediately redirect to the link above.
                  </p>
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button onClick={save} disabled={saving}
              className="px-6 py-2.5 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all duration-300 disabled:opacity-50 rounded-full">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>

            {/* Media / Highlights — only for non-link pages */}
            {pageType !== 'link' && (
              <div className="border-t border-luxury-gray/50 pt-6 space-y-8 pb-4">
                {pageType === 'info' ? (
                  <CategoryInfoBlocksManager categoryId={cat.id} />
                ) : (
                  <>
                    <CategoryHighlightsManager categoryId={cat.id} categoryName="Hero Slider"    placement="hero"    />
                    <CategoryHighlightsManager categoryId={cat.id} categoryName="Scroll Gallery" placement="gallery" />
                  </>
                )}
                {(!cat.children || cat.children.length === 0) && (
                  <CategoryHighlightsManager categoryId={cat.id} categoryName="Menu Image" placement="menu" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Category card ─────────────────────────────────────────────────────────────

const MAX_DEPTH = 2  // 0-indexed; depth 2 = level 3, no adding children at this depth

function CategoryCard({ cat, depth, allCats, onRefresh }: {
  cat: CategoryNode
  depth: number
  allCats: CategoryNode[]
  onRefresh: () => void
}) {
  const style = levelStyle(depth)
  const hasChildren = (cat.children?.length ?? 0) > 0

  const [expanded,    setExpanded]    = useState(false)
  const [nameEdit,    setNameEdit]    = useState(false)
  const [name,        setName]        = useState(cat.name)
  const [configOpen,  setConfigOpen]  = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [addingChild, setAddingChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [deleting,    setDeleting]    = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  async function saveName() {
    if (name.trim() === cat.name) { setNameEdit(false); return }
    try {
      await api.patch(`/admin/categories/${cat.id}`, { name: name.trim() })
      cat.name = name.trim()
      onRefresh()
    } catch {}
    setNameEdit(false)
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('prefix', 'categories')
      const res = await api.post('/media/upload-image', fd, { headers: { 'Content-Type': undefined } })
      await api.patch(`/admin/categories/${cat.id}`, { imageUrl: res.data.url })
      onRefresh()
    } catch {}
    setUploading(false)
    if (imgRef.current) imgRef.current.value = ''
  }

  async function deleteCategory() {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try { await api.delete(`/admin/categories/${cat.id}`); onRefresh() }
    catch (e: any) { alert(e?.response?.data?.message ?? e?.message ?? 'Cannot delete — move products/subcategories first.') }
    setDeleting(false)
  }

  async function addChild() {
    if (!newChildName.trim()) return
    try {
      await api.post('/admin/categories', { name: newChildName.trim(), parentId: cat.id, pageType: 'products' })
      setNewChildName(''); setAddingChild(false); onRefresh()
      setExpanded(true) // auto-expand to show the new child
    } catch {}
  }

  const pageTypeBadge = cat.pageType === 'link'
    ? { text: 'Link', cls: 'border-purple-400/40 text-purple-400' }
    : cat.pageType === 'info'
      ? { text: 'Info', cls: 'border-luxury-gold/40 text-luxury-gold' }
      : null

  return (
    <div>
      {/* ── Card header ── */}
      <div className={`border rounded-xl p-4 space-y-3 ${style.card}`}>
        <div className="flex items-center gap-2">
          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <button onClick={() => setExpanded(e => !e)}
              className="text-luxury-muted hover:text-luxury-white transition-colors shrink-0">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Level badge */}
          <span className={`text-[9px] uppercase tracking-luxury px-2 py-0.5 rounded-full font-medium shrink-0 ${style.badge}`}>
            L{depth + 1}
          </span>

          {/* Name */}
          {nameEdit ? (
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()}
              className="flex-1 bg-luxury-black/60 border border-luxury-gold text-luxury-white text-sm px-2 py-1 outline-none rounded" />
          ) : (
            <button onClick={() => setNameEdit(true)}
              className="flex-1 text-left text-luxury-white text-sm font-medium hover:text-luxury-gold transition-colors truncate">
              {cat.name}
            </button>
          )}

          {/* Page type badge */}
          {pageTypeBadge && (
            <span className={`text-[9px] uppercase tracking-luxury px-1.5 py-0.5 border rounded shrink-0 ${pageTypeBadge.cls}`}>
              {pageTypeBadge.text}
            </span>
          )}

          {/* Actions */}
          <button onClick={() => setConfigOpen(true)}
            className="text-luxury-muted hover:text-luxury-white transition-colors shrink-0" title="Configure">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button onClick={deleteCategory} disabled={deleting}
            className="text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-30 shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Image — depth > 0 only */}
        {depth > 0 && (
          <div className="flex items-center gap-3 pl-10">
            {cat.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 object-cover rounded border border-luxury-gray/40" />
            ) : (
              <div className="w-12 h-12 rounded border border-luxury-gray/40 bg-luxury-white/5 flex items-center justify-center text-luxury-muted">
                <Upload className="w-3.5 h-3.5" />
              </div>
            )}
            <label className="cursor-pointer text-luxury-muted text-[10px] tracking-luxury uppercase flex items-center gap-1 hover:text-luxury-white transition-colors">
              <Upload className="w-2.5 h-2.5" />
              {uploading ? 'Uploading…' : (cat.imageUrl ? 'Update' : 'Add image')}
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
            </label>
          </div>
        )}
      </div>

      {/* ── Add child (max depth check) ── */}
      {depth < MAX_DEPTH && (
        <div className="mt-2 ml-6">
          {addingChild ? (
            <div className="flex gap-2">
              <input autoFocus value={newChildName} onChange={e => setNewChildName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChild()}
                placeholder="Subcategory name…"
                className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-3 py-1.5 outline-none focus:border-luxury-gold rounded" />
              <button onClick={addChild} className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white px-3">Add</button>
              <button onClick={() => { setAddingChild(false); setNewChildName('') }} className="text-luxury-muted text-xs hover:text-luxury-white">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingChild(true)}
              className="flex items-center gap-1.5 text-luxury-muted text-[10px] tracking-luxury uppercase hover:text-luxury-gold transition-colors mt-1.5">
              <Plus className="w-3 h-3" />
              Add subcategory
            </button>
          )}
        </div>
      )}

      {/* ── Children (collapsible) ── */}
      {hasChildren && expanded && (
        <div className="mt-3 ml-8 pl-4 border-l border-luxury-gray/30 space-y-3">
          {cat.children.map(child => (
            <CategoryCard key={child.id} cat={child} depth={depth + 1} allCats={allCats} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      {/* ── Configure modal ── */}
      {configOpen && (
        <ConfigureModal cat={cat} onClose={() => setConfigOpen(false)} onSaved={() => onRefresh()} />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesAdminPage() {
  const [tree,    setTree]    = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')

  async function fetchTree() {
    setLoading(true)
    try {
      const res = await api.get('/products/categories')
      setTree(res.data ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchTree() }, [])

  async function addRoot() {
    if (!newName.trim()) return
    try {
      await api.post('/admin/categories', {
        name: newName.trim(),
        slug: newSlug.trim() || undefined,
        pageType: 'products',
      })
      setNewName(''); setNewSlug(''); setAdding(false); fetchTree()
    } catch {}
  }

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-4xl tracking-luxury">Category Management</h1>
        <p className="text-luxury-muted text-sm mt-1 tracking-luxury">
          Click a category name to rename inline. Use ▶ to expand subcategories. Max 3 levels deep.
        </p>
      </div>

      {loading ? (
        <p className="text-luxury-muted text-sm">Loading…</p>
      ) : (
        <div className="space-y-4">
          {tree.map(root => (
            <CategoryCard key={root.id} cat={root} depth={0} allCats={tree} onRefresh={fetchTree} />
          ))}

          {/* Add root category */}
          {adding ? (
            <div className="border border-luxury-gray/50 rounded-xl p-4 space-y-3">
              <p className="text-luxury-muted text-[10px] tracking-luxury uppercase">New Root Category</p>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRoot()}
                placeholder="Category name (e.g. Women)"
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded" />
              <div className="flex items-center gap-2 border border-luxury-gray rounded focus-within:border-luxury-gold px-3 py-2">
                <span className="text-luxury-muted/50 text-xs">/collections/</span>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="custom-slug (optional)"
                  className="flex-1 bg-transparent text-luxury-white text-sm outline-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={addRoot}
                  className="px-5 py-2 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black transition-all rounded-full">
                  Create
                </button>
                <button onClick={() => { setAdding(false); setNewName(''); setNewSlug('') }}
                  className="text-luxury-muted text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 px-6 py-3 border border-luxury-gray text-luxury-muted text-xs tracking-luxury uppercase rounded-xl hover:border-luxury-gold hover:text-luxury-gold transition-all duration-300 w-full justify-center">
              <Plus className="w-4 h-4" />
              Add New Category
            </button>
          )}
        </div>
      )}
    </section>
  )
}
