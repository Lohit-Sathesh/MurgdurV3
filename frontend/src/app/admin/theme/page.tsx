'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAdminToast } from '@/components/admin/AdminToast'
import { FONT_MAP, FONT_OPTIONS, hexToRgbChannels } from '@/lib/site-config'
import { DragList } from '@/components/ui/DragList'
import {
  DEFAULT_SITE_CONFIG, DEFAULT_TEXT_STYLES, SITE_CONFIG_UPDATED_EVENT,
  buildTextStyle,
  type SiteButton, type FooterColumn, type FooterLink,
  type TextStyle, type TextStyleKey, type TextStyles,
  type ProductAccordion, type HomepageSection,
} from '@/context/SiteConfigContext'

// ── Static config ─────────────────────────────────────────────────────────────

// hero_explore is hidden — its href is set per-slide in Homepage admin.
const BUTTON_LABELS: Record<string, string> = {
  add_to_cart:    'Add to Cart / Bag button (product page)',
  editorial_cta:  'Editorial "Explore the Collection" button',
  newsletter_btn: 'Newsletter subscribe button',
}
const HIDDEN_BUTTONS = new Set(['hero_explore'])

const COLOUR_CONFIG = [
  { key: 'colorGold',  label: 'Accent',                 desc: 'Hover highlights, borders, accent colour' },
  { key: 'colorText',  label: 'Body Text',              desc: 'Main text, headings, labels'            },
  { key: 'colorBg',    label: 'Background',             desc: 'Page and section backgrounds'           },
  { key: 'colorMuted', label: 'Muted / Secondary text', desc: 'Sub-labels, captions, secondary content' },
]

const TEXT_SECTIONS: { key: TextStyleKey; label: string; hint: string }[] = [
  // ── Navigation ──────────────────────────────────────────────────────────
  { key: 'navTitle',         label: 'Site Title',              hint: 'Brand wordmark in the navbar (e.g. MURGDUR)' },
  { key: 'navMotto',         label: 'Site Subheading',         hint: 'Tagline below the brand name (e.g. Maison Murgdur)' },
  { key: 'navLinks',         label: 'Navigation Links',        hint: 'Menu and category drawer link text' },
  // ── Hero & cinematic ────────────────────────────────────────────────────
  { key: 'heroHeadline',     label: 'Hero Headline',           hint: 'Main big headline on the hero slider' },
  { key: 'heroSubheading',   label: 'Hero Subheading',         hint: 'Smaller caption line on the hero slider' },
  { key: 'scrollGallery',    label: 'Scroll Gallery',          hint: 'Headline text on the full-screen scroll sections' },
  // ── Homepage sections ───────────────────────────────────────────────────
  { key: 'homepageSection',  label: 'Homepage Section Headings', hint: '"New Arrivals", "The Selection" and similar section titles' },
  { key: 'editorialHeading', label: 'Editorial Heading',       hint: '"Crafted in silence…" and similar editorial block headlines' },
  { key: 'editorialBody',    label: 'Editorial Body Text',     hint: 'Body paragraphs inside editorial / brand-statement sections' },
  // ── General ─────────────────────────────────────────────────────────────
  { key: 'sectionHeading',   label: 'Section Headings',        hint: 'Page and section titles throughout the rest of the site' },
  { key: 'sectionBody',      label: 'Section Body Text',       hint: 'Body paragraphs in page sections (philosophy, about, etc.)' },
  { key: 'bodyText',         label: 'General Body Text',       hint: 'Fallback for all other body / paragraph text site-wide' },
  // ── Products ────────────────────────────────────────────────────────────
  { key: 'productCard',      label: 'Product Card Name',       hint: 'Product name text on listing/grid cards' },
  { key: 'productPage',      label: 'Product Page Title',      hint: 'Product name on the individual product detail page' },
  // ── Other ───────────────────────────────────────────────────────────────
  { key: 'footer',           label: 'Footer Text',             hint: 'Brand name, tagline and column text in the footer' },
  { key: 'profile',          label: 'Profile Page',            hint: 'Headings and labels on the account/profile page' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function blankStyle(): TextStyle {
  return { fontFamily: 'default', fontSize: 0, fontWeight: '', letterSpacing: 0, color: '', shadowIntensity: 0, glowIntensity: 0 }
}

function SliderRow({ label, value, max = 10, onChange }: { label: string; value: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-luxury-muted text-[10px] uppercase tracking-luxury">{label}</span>
        <span className="text-luxury-muted text-[10px] font-mono">{value}</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-luxury-gold h-1" />
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1a1a1a'
  return (
    <div>
      <span className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">{label}</span>
      <div className="flex items-center gap-2 border border-luxury-gray/50 rounded px-2 py-1.5">
        <label className="relative cursor-pointer shrink-0">
          <div className="w-6 h-6 rounded border border-luxury-gray/50" style={{ backgroundColor: safe }} />
          <input type="color" value={safe} onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
        </label>
        <input value={value} onChange={e => onChange(e.target.value)} maxLength={7}
          className="bg-transparent text-luxury-muted text-[10px] font-mono w-full outline-none" />
      </div>
    </div>
  )
}

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Font Family</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-luxury-black border border-luxury-gray/50 text-luxury-white text-xs px-2 py-1.5 outline-none focus:border-luxury-gold">
        {(['Default', 'Google Fonts', 'System'] as const).map(g => {
          const opts = FONT_OPTIONS.filter(o => o.group === g)
          if (!opts.length) return null
          return (
            <optgroup key={g} label={g}>
              {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
          )
        })}
      </select>
    </div>
  )
}

// ── TextStyle accordion section ───────────────────────────────────────────────

function TextStyleSection({
  label, hint, value, onChange,
}: { label: string; hint: string; value: TextStyle; onChange: (v: TextStyle) => void }) {
  const [open, setOpen] = useState(false)
  const set = (field: keyof TextStyle) => (v: any) => onChange({ ...value, [field]: v })
  const isActive = value.fontFamily !== 'default' || value.fontSize > 0 || !!value.fontWeight || (value.letterSpacing ?? 0) !== 0 || !!value.color || value.shadowIntensity > 0 || value.glowIntensity > 0
  const preview = buildTextStyle(value)
  // Header label only applies font-family + colour + shadow — never the configured
  // size, which could be 72px and would blow out the accordion row.
  const { fontSize: _dropped, ...headerStyle } = preview

  return (
    <div className={`border rounded-lg transition-colors ${open ? 'border-luxury-gold/50' : 'border-luxury-gray/40'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold shrink-0" />}
          <div>
            <p className="text-luxury-white text-xs tracking-luxury uppercase" style={headerStyle}>{label}</p>
            <p className="text-luxury-muted text-[10px] mt-0.5">{hint}</p>
          </div>
        </div>
        <span className="text-luxury-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-luxury-gray/30 pt-4">
          {/* Live preview */}
          <div className="bg-luxury-white/[0.03] rounded p-3 border border-luxury-gray/20">
            <p className="text-luxury-muted text-[10px] uppercase tracking-luxury mb-1">Preview</p>
            <p style={{ ...preview, fontSize: preview.fontSize || '1.1rem' }}
              className="text-luxury-white">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FontSelect value={value.fontFamily ?? 'default'} onChange={set('fontFamily')} />
            </div>

            <div>
              <SliderRow label={`Size — ${value.fontSize > 0 ? `${value.fontSize}px` : 'inherit'}`}
                value={value.fontSize} max={96} onChange={set('fontSize')} />
            </div>

            <ColorPicker label="Text Colour" value={value.color || '#1a1a1a'} onChange={set('color')} />

            {/* Letter spacing */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-luxury-muted text-[10px] uppercase tracking-luxury">
                  Letter Spacing
                </span>
                <span className="text-luxury-muted text-[10px] font-mono">
                  {(value.letterSpacing ?? 0) === 0 ? 'inherit' : `${(value.letterSpacing ?? 0).toFixed(2)}em`}
                </span>
              </div>
              <input
                type="range" min={-0.05} max={0.5} step={0.01}
                value={value.letterSpacing ?? 0}
                onChange={e => set('letterSpacing')(Number(e.target.value))}
                className="w-full accent-luxury-gold h-1"
              />
              <div className="flex justify-between text-luxury-muted text-[9px] mt-0.5">
                <span>−0.05em (tight)</span>
                <span>0 (inherit)</span>
                <span>0.5em (wide)</span>
              </div>
            </div>

            {/* Font weight */}
            <div className="col-span-2">
              <span className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">
                Font Weight
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {[['', 'Default'], ['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi-Bold'], ['700', 'Bold'], ['800', 'Extra Bold'], ['900', 'Black']] .map(([w, label]) => (
                  <button key={w} onClick={() => set('fontWeight')(w)}
                    className={`px-2.5 py-1 text-[10px] border transition-colors ${
                      (value.fontWeight ?? '') === w
                        ? 'border-luxury-gold text-luxury-gold'
                        : 'border-luxury-gray text-luxury-muted hover:border-luxury-white hover:text-luxury-white'
                    }`}
                    style={{ fontWeight: w || 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SliderRow label="Shadow Intensity" value={value.shadowIntensity ?? 0} onChange={set('shadowIntensity')} />
            <SliderRow label="Glow Intensity"   value={value.glowIntensity   ?? 0} onChange={set('glowIntensity')} />
          </div>

          {isActive && (
            <button onClick={() => onChange(blankStyle())}
              className="text-luxury-muted text-[10px] tracking-luxury uppercase hover:text-red-400 transition-colors">
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ThemePage() {
  const router = useRouter()
  const { toast } = useAdminToast()

  const [fontFamily,    setFontFamily]    = useState('default')
  const [fontSize,      setFontSize]      = useState(16)
  const [fontWeight,    setFontWeight]    = useState('400')
  const [fontStyle,     setFontStyle]     = useState('normal')
  const [siteTitle,     setSiteTitle]     = useState('MURGDUR')
  const [siteMotto,     setSiteMotto]     = useState('Maison Murgdur')
  const [buttons,       setButtons]       = useState<SiteButton[]>(DEFAULT_SITE_CONFIG.buttons)
  const [footerTagline, setFooterTagline] = useState(DEFAULT_SITE_CONFIG.footerTagline)
  const [footerNote,    setFooterNote]    = useState(DEFAULT_SITE_CONFIG.footerNote)
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>(DEFAULT_SITE_CONFIG.footerColumns)
  const [textStyles,        setTextStyles]        = useState<TextStyles>(DEFAULT_TEXT_STYLES)
  const [productAccordions,    setProductAccordions]    = useState<ProductAccordion[]>(DEFAULT_SITE_CONFIG.productAccordions)
  const [homepageSections,     setHomepageSections]     = useState<HomepageSection[]>(DEFAULT_SITE_CONFIG.homepageSections)
  const [sgContactText,        setSgContactText]        = useState(DEFAULT_SITE_CONFIG.sizeGuideContactText)
  const [sgContactLinkText,    setSgContactLinkText]    = useState(DEFAULT_SITE_CONFIG.sizeGuideContactLinkText)
  const [sgContactLinkUrl,     setSgContactLinkUrl]     = useState(DEFAULT_SITE_CONFIG.sizeGuideContactLinkUrl)
  const [shippingCost,         setShippingCost]         = useState(DEFAULT_SITE_CONFIG.shippingCost)
  const [taxRate,              setTaxRate]              = useState(DEFAULT_SITE_CONFIG.taxRate)
  const [taxLabel,             setTaxLabel]             = useState(DEFAULT_SITE_CONFIG.taxLabel)
  const [whatsappNumber,           setWhatsappNumber]          = useState(DEFAULT_SITE_CONFIG.whatsappNumber)
  const [whatsappMessageTemplate,  setWhatsappMessageTemplate]  = useState(DEFAULT_SITE_CONFIG.whatsappMessageTemplate)
  const [invoiceEmailSubject,    setInvoiceEmailSubject]    = useState(DEFAULT_SITE_CONFIG.invoiceEmailSubject)
  const [invoiceEmailBody,       setInvoiceEmailBody]       = useState(DEFAULT_SITE_CONFIG.invoiceEmailBody)
  const [faviconUrl,             setFaviconUrl]             = useState(DEFAULT_SITE_CONFIG.faviconUrl)
  const [faviconUploading,       setFaviconUploading]       = useState(false)
  const [ogImageUrl,             setOgImageUrl]             = useState(DEFAULT_SITE_CONFIG.ogImageUrl)
  const [ogImageUploading,       setOgImageUploading]       = useState(false)
  const [invoiceLogoUrl,         setInvoiceLogoUrl]         = useState(DEFAULT_SITE_CONFIG.invoiceLogoUrl)
  const [invoiceCompanyName,     setInvoiceCompanyName]     = useState(DEFAULT_SITE_CONFIG.invoiceCompanyName)
  const [invoiceCompanyAddress,  setInvoiceCompanyAddress]  = useState(DEFAULT_SITE_CONFIG.invoiceCompanyAddress)
  const [invoiceFooterText,      setInvoiceFooterText]      = useState(DEFAULT_SITE_CONFIG.invoiceFooterText)
  const [logoUploading,          setLogoUploading]          = useState(false)
  const [colors, setColors] = useState({ colorGold: '#c9a96e', colorText: '#1a1a1a', colorBg: '#ffffff', colorMuted: '#6f6c64' })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'colours' | 'fonts' | 'identity' | 'typography' | 'sizeguide' | 'footer' | 'product' | 'buttons' | 'store'>('colours')

  // Load saved config
  useEffect(() => {
    api.get('/site-config').then(res => {
      const d = res.data
      if (!d) return
      if (d.fontFamily)            setFontFamily(d.fontFamily)
      if (d.fontSize)              setFontSize(d.fontSize)
      if (d.fontWeight)            setFontWeight(d.fontWeight)
      if (d.fontStyle)             setFontStyle(d.fontStyle)
      if (d.siteTitle)             setSiteTitle(d.siteTitle)
      if (d.siteMotto)             setSiteMotto(d.siteMotto)
      if (d.buttons?.length)       setButtons(d.buttons)
      if (d.footerTagline)         setFooterTagline(d.footerTagline)
      if (d.footerNote)            setFooterNote(d.footerNote)
      if (d.footerColumns?.length) setFooterColumns(d.footerColumns)
      if (d.textStyles)                 setTextStyles({ ...DEFAULT_TEXT_STYLES, ...d.textStyles })
      if (d.productAccordions?.length)  setProductAccordions(d.productAccordions)
      if (d.homepageSections?.length)   setHomepageSections(d.homepageSections)
      if (d.sizeGuideContactText)       setSgContactText(d.sizeGuideContactText)
      if (d.sizeGuideContactLinkText)   setSgContactLinkText(d.sizeGuideContactLinkText)
      if (d.sizeGuideContactLinkUrl)    setSgContactLinkUrl(d.sizeGuideContactLinkUrl)
      if (d.shippingCost !== undefined) setShippingCost(d.shippingCost ?? 0)
      if (d.taxRate      !== undefined) setTaxRate(d.taxRate ?? 0)
      if (d.taxLabel)                   setTaxLabel(d.taxLabel)
      if (d.whatsappNumber          !== undefined) setWhatsappNumber(d.whatsappNumber ?? '')
      if (d.whatsappMessageTemplate !== undefined) setWhatsappMessageTemplate(d.whatsappMessageTemplate ?? '')
      if (d.invoiceEmailSubject     !== undefined) setInvoiceEmailSubject(d.invoiceEmailSubject ?? '')
      if (d.invoiceEmailBody        !== undefined) setInvoiceEmailBody(d.invoiceEmailBody ?? '')
      if (d.faviconUrl              !== undefined) setFaviconUrl(d.faviconUrl ?? '')
      if (d.ogImageUrl              !== undefined) setOgImageUrl(d.ogImageUrl ?? '')
      if (d.invoiceLogoUrl          !== undefined) setInvoiceLogoUrl(d.invoiceLogoUrl ?? '')
      if (d.invoiceCompanyName      !== undefined) setInvoiceCompanyName(d.invoiceCompanyName ?? 'Murgdur')
      if (d.invoiceCompanyAddress   !== undefined) setInvoiceCompanyAddress(d.invoiceCompanyAddress ?? '')
      if (d.invoiceFooterText       !== undefined) setInvoiceFooterText(d.invoiceFooterText ?? '')
      setColors({
        colorGold:  d.colorGold  ?? '#c9a96e',
        colorText:  d.colorText  ?? '#1a1a1a',
        colorBg:    d.colorBg    ?? '#ffffff',
        colorMuted: d.colorMuted ?? '#6f6c64',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Live colour preview — update CSS variables in real-time as pickers change
  useEffect(() => {
    try {
      const r = (hex: string) => hexToRgbChannels(hex)
      document.documentElement.style.setProperty('--color-gold-rgb',  r(colors.colorGold))
      document.documentElement.style.setProperty('--color-text-rgb',  r(colors.colorText))
      document.documentElement.style.setProperty('--color-bg-rgb',    r(colors.colorBg))
      document.documentElement.style.setProperty('--color-muted-rgb', r(colors.colorMuted))
    } catch {}
  }, [colors])

  function updateButton(id: string, field: 'label' | 'href', value: string) {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }
  function setStyle(key: TextStyleKey) {
    return (v: TextStyle) => setTextStyles(prev => ({ ...prev, [key]: v }))
  }

  // Footer column helpers
  const addColumn    = () => setFooterColumns(p => [...p, { title: 'New Column', links: [] }])
  const removeColumn = (ci: number) => setFooterColumns(p => p.filter((_, i) => i !== ci))
  const updateColTitle = (ci: number, t: string) => setFooterColumns(p => p.map((c, i) => i === ci ? { ...c, title: t } : c))
  const addLink      = (ci: number) => setFooterColumns(p => p.map((c, i) => i === ci ? { ...c, links: [...c.links, { label: '', href: '' }] } : c))
  const removeLink   = (ci: number, li: number) => setFooterColumns(p => p.map((c, i) => i === ci ? { ...c, links: c.links.filter((_, j) => j !== li) } : c))
  const updateLink   = (ci: number, li: number, f: keyof FooterLink, v: string) =>
    setFooterColumns(p => p.map((c, i) => i === ci ? { ...c, links: c.links.map((l, j) => j === li ? { ...l, [f]: v } : l) } : c))

  async function handleSave() {
    setSaving(true); setSaved(false)
    try {
      await api.patch('/site-config', {
        fontFamily, fontSize, fontWeight, fontStyle,
        siteTitle, siteMotto, buttons,
        footerTagline, footerNote, footerColumns,
        textStyles, productAccordions,
        homepageSections,
        sizeGuideContactText:     sgContactText,
        sizeGuideContactLinkText: sgContactLinkText,
        sizeGuideContactLinkUrl:  sgContactLinkUrl,
        shippingCost, taxRate, taxLabel,
        whatsappNumber, whatsappMessageTemplate,
        invoiceEmailSubject, invoiceEmailBody,
        faviconUrl, ogImageUrl,
        invoiceLogoUrl, invoiceCompanyName, invoiceCompanyAddress, invoiceFooterText,
        ...colors,
      })
      setSaved(true)
      toast('Theme saved — changes applied site-wide.')
      window.dispatchEvent(new CustomEvent(SITE_CONFIG_UPDATED_EVENT))
      router.refresh()
    } catch {
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-luxury-muted text-sm">Loading…</p>

  const previewFamily = FONT_MAP[fontFamily] || 'inherit'

  const TABS: { id: typeof activeTab; label: string }[] = [
    { id: 'colours',   label: 'Colours'            },
    { id: 'fonts',     label: 'Global Font'        },
    { id: 'identity',  label: 'Identity'           },
    { id: 'typography',label: 'Typography'         },
    { id: 'footer',    label: 'Footer'             },
    { id: 'product',   label: 'Product Info'       },
    { id: 'sizeguide', label: 'Size Guide Footer'  },
    { id: 'store',     label: 'Store'              },
    { id: 'buttons',   label: 'Buttons'            },
  ]

  return (
    <section className="space-y-6 max-w-3xl">
      <h1 className="font-serif text-4xl tracking-luxury">Theme & Branding</h1>

      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-1 border-b border-luxury-gray pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-xs tracking-luxury uppercase transition-colors ${
              activeTab === t.id
                ? 'border-b-2 border-luxury-gold text-luxury-gold -mb-px'
                : 'text-luxury-muted hover:text-luxury-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ COLOURS ══════════════════════════════════════════════════════════ */}
      {activeTab === 'colours' && (
        <div className="space-y-5">
          <p className="text-luxury-muted text-xs">Colour changes preview live as you move the picker — hit Save & Apply to persist.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOUR_CONFIG.map(({ key, label, desc }) => (
              <div key={key} className="border border-luxury-gray/50 rounded-lg p-4 flex items-center gap-4">
                <label className="cursor-pointer relative shrink-0" title={`Pick ${label}`}>
                  <input type="color" value={colors[key as keyof typeof colors]}
                    onChange={e => setColors(p => ({ ...p, [key]: e.target.value }))}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                  <div className="w-12 h-12 rounded-lg border-2 border-luxury-gray"
                    style={{ backgroundColor: colors[key as keyof typeof colors] }} />
                </label>
                <div>
                  <p className="text-luxury-white text-xs tracking-luxury uppercase">{label}</p>
                  <p className="text-luxury-muted text-[10px] mt-0.5">{desc}</p>
                  <p className="text-luxury-muted text-[10px] font-mono mt-1">{colors[key as keyof typeof colors]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ GLOBAL FONT ══════════════════════════════════════════════════════ */}
      {activeTab === 'fonts' && (
        <div className="space-y-5">
          <p className="text-luxury-muted text-xs">Sets a baseline font for the whole site. Individual sections can override this in the Typography tab.</p>
          <div className="border border-luxury-gray/50 rounded p-4"
            style={{ fontFamily: previewFamily, fontSize: `${fontSize}px`, fontWeight, fontStyle,
                     color: colors.colorText, backgroundColor: colors.colorBg }}>
            <p className="text-2xl mb-1">{siteTitle}</p>
            <p className="text-sm" style={{ color: colors.colorMuted }}>{siteMotto} — The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm mt-2" style={{ color: colors.colorGold }}>Gold accent text sample</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Font Family</label>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold"
                style={{ fontFamily: FONT_MAP[fontFamily] || 'inherit' }}>
                {(['Default', 'Google Fonts', 'System'] as const).map(g => (
                  <optgroup key={g} label={g}>
                    {FONT_OPTIONS.filter(o => o.group === g).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Base Size — {fontSize}px</label>
              <input type="range" min={12} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                className="w-full accent-luxury-gold mt-3" />
            </div>
            <div>
              <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Weight</label>
              <div className="flex gap-2">
                {[['400','Normal'],['600','Semi-Bold'],['700','Bold'],['800','Extra Bold']].map(([v,l]) => (
                  <button key={v} onClick={() => setFontWeight(v)}
                    className={`flex-1 text-xs py-2 border transition-colors ${fontWeight===v ? 'border-luxury-gold text-luxury-gold' : 'border-luxury-gray text-luxury-muted hover:border-luxury-white'}`}
                    style={{ fontWeight: v }}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Style</label>
              <div className="flex gap-2">
                {[['normal','Normal'],['italic','Italic']].map(([v,l]) => (
                  <button key={v} onClick={() => setFontStyle(v)}
                    className={`flex-1 text-xs py-2 border transition-colors ${fontStyle===v ? 'border-luxury-gold text-luxury-gold' : 'border-luxury-gray text-luxury-muted hover:border-luxury-white'}`}
                    style={{ fontStyle: v }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ IDENTITY ══════════════════════════════════════════════════════════ */}
      {activeTab === 'identity' && (
        <div className="space-y-4">
          <div>
            <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Site Title (navbar, footer, loading screen, browser tab)</label>
            <input value={siteTitle} onChange={e => setSiteTitle(e.target.value)}
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold tracking-luxury" />
          </div>
          <div>
            <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Tagline / Motto (navbar subtitle)</label>
            <input value={siteMotto} onChange={e => setSiteMotto(e.target.value)}
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold" />
          </div>
          <div>
            <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Favicon (browser tab icon)</label>
            <p className="text-luxury-muted text-[10px] mb-3">Shown in browser tabs and bookmarks. Use a square image (PNG, ICO, or SVG) — 32×32px or larger.</p>
            <div className="flex items-center gap-4">
              {faviconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconUrl} alt="favicon preview" className="h-8 w-8 object-contain border border-luxury-gray rounded bg-white p-0.5 shrink-0" />
              )}
              <label className={`cursor-pointer text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors ${faviconUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {faviconUploading ? 'Uploading…' : (faviconUrl ? 'Replace Favicon' : 'Upload Favicon')}
                <input type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp" className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return
                    setFaviconUploading(true)
                    try {
                      const fd = new FormData(); fd.append('file', file); fd.append('prefix', 'favicons')
                      const res = await api.post('/media/upload-image', fd, { headers: { 'Content-Type': undefined } })
                      setFaviconUrl(res.data?.url ?? res.data?.data?.url ?? '')
                    } catch {}
                    setFaviconUploading(false); e.target.value = ''
                  }}
                />
              </label>
              {faviconUrl && (
                <button onClick={() => setFaviconUrl('')} className="text-red-400 text-[10px] hover:text-red-300 transition-colors">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TYPOGRAPHY ════════════════════════════════════════════════════════ */}
      {activeTab === 'typography' && (
        <div className="space-y-3">
          <p className="text-luxury-muted text-xs">Set font, size, colour, drop shadow and glow independently for each section. A gold dot marks sections with active overrides.</p>
          {TEXT_SECTIONS.map(s => (
            <TextStyleSection
              key={s.key}
              label={s.label}
              hint={s.hint}
              value={textStyles[s.key] ?? { fontFamily: 'default', fontSize: 0, color: '', shadowIntensity: 0, glowIntensity: 0 }}
              onChange={setStyle(s.key)}
            />
          ))}
        </div>
      )}

      {/* ══ SIZE GUIDE DRAWER FOOTER ════════════════════════════════════════ */}
      {activeTab === 'sizeguide' && (
        <div className="space-y-5">
          <p className="text-luxury-muted text-xs">
            The text and link shown at the bottom of the Size Guide drawer on product pages.
          </p>
          <div>
            <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Text before the link</label>
            <input value={sgContactText} onChange={e => setSgContactText(e.target.value)}
              placeholder="Need help with sizing?"
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Link text</label>
              <input value={sgContactLinkText} onChange={e => setSgContactLinkText(e.target.value)}
                placeholder="Contact our stylists"
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold" />
            </div>
            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Link URL</label>
              <input value={sgContactLinkUrl} onChange={e => setSgContactLinkUrl(e.target.value)}
                placeholder="/contact"
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted px-3 py-2 text-sm outline-none focus:border-luxury-gold" />
            </div>
          </div>
          <p className="text-luxury-muted text-[10px] pt-1 tracking-luxury">
            Preview: {sgContactText} <span className="text-luxury-white underline">{sgContactLinkText}</span>
          </p>
        </div>
      )}

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div>
            <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Footer Tagline</label>
            <input value={footerTagline} onChange={e => setFooterTagline(e.target.value)}
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold" />
          </div>
          <div>
            <label className="text-luxury-muted text-xs tracking-luxury uppercase block mb-2">Copyright Note</label>
            <input value={footerNote} onChange={e => setFooterNote(e.target.value)}
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-2 text-sm outline-none focus:border-luxury-gold" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-luxury-muted text-xs tracking-luxury uppercase">Columns</label>
              <button onClick={addColumn} className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white">+ Add Column</button>
            </div>
            <div className="space-y-4">
              {footerColumns.map((col, ci) => (
                <div key={ci} className="border border-luxury-gray/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input value={col.title} onChange={e => updateColTitle(ci, e.target.value)} placeholder="Heading"
                      className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-1.5 text-xs outline-none focus:border-luxury-gold uppercase tracking-luxury" />
                    <button onClick={() => removeColumn(ci)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                  </div>
                  <div className="space-y-2 pl-3 border-l border-luxury-gray/30">
                    {col.links.map((lnk, li) => (
                      <div key={li} className="flex items-center gap-2">
                        <input value={lnk.label} onChange={e => updateLink(ci, li, 'label', e.target.value)} placeholder="Label"
                          className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white px-2 py-1 text-xs outline-none focus:border-luxury-gold" />
                        <input value={lnk.href} onChange={e => updateLink(ci, li, 'href', e.target.value)} placeholder="/path"
                          className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-muted px-2 py-1 text-xs outline-none focus:border-luxury-gold" />
                        <button onClick={() => removeLink(ci, li)} className="text-red-400 text-xs px-1">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addLink(ci)} className="text-luxury-muted text-[10px] tracking-luxury uppercase hover:text-luxury-gold">+ Add link</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ PRODUCT INFO ═════════════════════════════════════════════════════ */}
      {activeTab === 'product' && (
        <div className="space-y-4">
          <p className="text-luxury-muted text-xs">
            These accordion sections appear on every product page below the Add to Cart button.
            Edit the heading and body text, add new sections, or remove ones you don't need.
          </p>

          <DragList
            items={productAccordions.map((a, i) => ({ ...a, id: a.title || `acc-${i}` }))}
            onReorder={items => setProductAccordions(items.map(({ id: _id, ...rest }) => rest as any))}
          >
            {(acc, handle, i) => (
            <div className="border border-luxury-gray/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {handle}
                <input
                  value={acc.title}
                  onChange={e => setProductAccordions(prev => prev.map((a, j) => j === i ? { ...a, title: e.target.value } : a))}
                  placeholder="Section heading"
                  className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-1.5 text-xs outline-none focus:border-luxury-gold tracking-luxury uppercase"
                />
                <button
                  onClick={() => setProductAccordions(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 text-xs hover:text-red-300 transition-colors shrink-0">
                  Remove
                </button>
              </div>
              <textarea
                value={acc.content}
                onChange={e => setProductAccordions(prev => prev.map((a, j) => j === i ? { ...a, content: e.target.value } : a))}
                placeholder="Body text shown when this section is expanded…"
                rows={3}
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted px-3 py-2 text-xs outline-none focus:border-luxury-gold leading-relaxed resize-none"
              />
            </div>
            )}
          </DragList>

          <button
            onClick={() => setProductAccordions(prev => [...prev, { title: '', content: '' }])}
            className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors">
            + Add Section
          </button>
        </div>
      )}

      {/* ══ STORE ════════════════════════════════════════════════════════════ */}
      {activeTab === 'store' && (
        <div className="space-y-8">
          <p className="text-luxury-muted text-xs">
            These values are applied at checkout. The WhatsApp number is used for the Concierge order flow.
          </p>

          {/* WhatsApp number */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-3">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">WhatsApp Concierge Number</h3>
            <p className="text-luxury-muted text-[10px]">
              Full number with country code — e.g. +919876543210. Customers are redirected here when they click "Contact Concierge Services".
            </p>
            <input
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              placeholder="+919876543210"
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded"
            />
          </div>

          {/* WhatsApp message template */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-3">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">WhatsApp Message Template</h3>
            <p className="text-luxury-muted text-[10px]">
              Customise the pre-filled WhatsApp message. Placeholders:&nbsp;
              <code className="text-luxury-gold">{'{{tempId}}'}</code>&nbsp;
              <code className="text-luxury-gold">{'{{customerName}}'}</code>&nbsp;
              <code className="text-luxury-gold">{'{{items}}'}</code>&nbsp;
              <code className="text-luxury-gold">{'{{total}}'}</code>&nbsp;
              <code className="text-luxury-gold">{'{{address}}'}</code>
            </p>
            <textarea
              value={whatsappMessageTemplate}
              onChange={e => setWhatsappMessageTemplate(e.target.value)}
              rows={8}
              placeholder={`Hello Murgdur,\n\nTemp ID: {{tempId}}\n\nI {{customerName}} am interested to purchase:\n{{items}}\n\nTotal: {{total}}\nAddress: {{address}}\n\nCould you please connect me to the digital concierge.`}
              className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-3 py-2 outline-none focus:border-luxury-gold rounded resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Invoice email template */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-4">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">Invoice Email Template</h3>
            <p className="text-luxury-muted text-[10px]">
              Sent to the customer when you mark an order as "Confirmed (payment received)". Placeholders:&nbsp;
              <code className="text-luxury-gold">{'{{customerName}}'}</code>&nbsp;
              <code className="text-luxury-gold">{'{{orderNumber}}'}</code>&nbsp;
              <code className="text-luxury-gold">{'{{total}}'}</code>
            </p>
            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Email Subject</label>
              <input
                value={invoiceEmailSubject}
                onChange={e => setInvoiceEmailSubject(e.target.value)}
                placeholder="Your Murgdur invoice — {{orderNumber}}"
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded"
              />
            </div>
            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Email Body (HTML supported)</label>
              <textarea
                value={invoiceEmailBody}
                onChange={e => setInvoiceEmailBody(e.target.value)}
                rows={6}
                placeholder={`<p>Dear {{customerName}},</p>\n<p>Thank you for your order <strong>{{orderNumber}}</strong>. Please find your invoice attached.</p>\n<p>Total: {{total}}</p>`}
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-xs px-3 py-2 outline-none focus:border-luxury-gold rounded resize-none font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Social Share Image (OG Image) */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-4">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">Social Share Image</h3>
            <p className="text-luxury-muted text-[10px]">
              This image appears when your site is shared on WhatsApp, Instagram, Twitter, LinkedIn etc. Recommended size: 1200 × 630px.
            </p>
            <div className="flex items-center gap-4">
              {ogImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogImageUrl} alt="OG preview" className="h-16 w-auto object-cover border border-luxury-gray rounded shrink-0" />
              )}
              <label className={`cursor-pointer text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors ${ogImageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {ogImageUploading ? 'Uploading…' : (ogImageUrl ? 'Replace Image' : 'Upload Image')}
                <input type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return
                    setOgImageUploading(true)
                    try {
                      const fd = new FormData(); fd.append('file', file); fd.append('prefix', 'og-images')
                      const res = await api.post('/media/upload-image', fd, { headers: { 'Content-Type': undefined } })
                      setOgImageUrl(res.data?.url ?? res.data?.data?.url ?? '')
                    } catch {}
                    setOgImageUploading(false); e.target.value = ''
                  }}
                />
              </label>
              {ogImageUrl && (
                <button onClick={() => setOgImageUrl('')} className="text-red-400 text-[10px] hover:text-red-300 transition-colors">
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Invoice PDF — branding + content */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-4">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">Invoice PDF — Branding</h3>
            <p className="text-luxury-muted text-[10px]">
              Customise the PDF sent to customers when an order is confirmed. Upload a logo to appear at the top of the invoice.
            </p>

            {/* Logo upload */}
            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                {invoiceLogoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invoiceLogoUrl} alt="logo" className="h-14 w-auto object-contain border border-luxury-gray rounded shrink-0 bg-white p-1" />
                )}
                <label className={`cursor-pointer text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors ${logoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {logoUploading ? 'Uploading…' : (invoiceLogoUrl ? 'Replace Logo' : 'Upload Logo')}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]; if (!file) return
                      setLogoUploading(true)
                      try {
                        const fd = new FormData(); fd.append('file', file); fd.append('prefix', 'invoice-logos')
                        const res = await api.post('/media/upload-image', fd, { headers: { 'Content-Type': undefined } })
                        setInvoiceLogoUrl(res.data?.url ?? res.data?.data?.url ?? '')
                      } catch {}
                      setLogoUploading(false); e.target.value = ''
                    }}
                  />
                </label>
                {invoiceLogoUrl && (
                  <button onClick={() => setInvoiceLogoUrl('')} className="text-red-400 text-[10px] hover:text-red-300 transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Company Name</label>
                <input value={invoiceCompanyName} onChange={e => setInvoiceCompanyName(e.target.value)}
                  placeholder="Murgdur"
                  className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded" />
              </div>
              <div>
                <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Company Address</label>
                <input value={invoiceCompanyAddress} onChange={e => setInvoiceCompanyAddress(e.target.value)}
                  placeholder="123 Street, City, Country"
                  className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded" />
              </div>
            </div>

            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Footer Text (shown at bottom of PDF)</label>
              <input value={invoiceFooterText} onChange={e => setInvoiceFooterText(e.target.value)}
                placeholder="Thank you for shopping with Murgdur!"
                className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded" />
            </div>
          </div>

          {/* Shipping */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-4">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">Shipping</h3>
            <div>
              <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-2">
                Flat shipping fee per order (set to 0 for free shipping)
              </label>
              <div className="flex items-center gap-2 border border-luxury-gray rounded px-3 py-2 focus-within:border-luxury-gold">
                <span className="text-luxury-muted text-xs">₹</span>
                <input
                  type="number" min={0} step={1} value={shippingCost}
                  onChange={e => setShippingCost(Number(e.target.value))}
                  className="flex-1 bg-transparent text-luxury-white text-sm outline-none"
                />
              </div>
              {shippingCost === 0 && (
                <p className="text-luxury-gold text-[10px] mt-1 tracking-luxury">Free shipping is enabled.</p>
              )}
            </div>
          </div>

          {/* Tax */}
          <div className="border border-luxury-gray/50 rounded-xl p-5 space-y-4">
            <h3 className="text-luxury-white text-xs tracking-luxury uppercase">Tax</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-2">Tax label (e.g. GST, VAT)</label>
                <input value={taxLabel} onChange={e => setTaxLabel(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold rounded" />
              </div>
              <div>
                <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-2">Tax rate (%)</label>
                <div className="flex items-center gap-2 border border-luxury-gray rounded px-3 py-2 focus-within:border-luxury-gold">
                  <input
                    type="number" min={0} max={100} step={0.1} value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="flex-1 bg-transparent text-luxury-white text-sm outline-none"
                  />
                  <span className="text-luxury-muted text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Live example */}
            {taxRate > 0 && (
              <div className="bg-luxury-white/[0.03] rounded-lg p-4 space-y-1.5 text-xs">
                <p className="text-luxury-muted text-[10px] uppercase tracking-luxury mb-2">Preview (on a ₹10,000 order)</p>
                <div className="flex justify-between text-luxury-muted"><span>Subtotal</span><span>₹10,000.00</span></div>
                {shippingCost > 0 && <div className="flex justify-between text-luxury-muted"><span>Shipping</span><span>₹{shippingCost.toFixed(2)}</span></div>}
                {shippingCost === 0 && <div className="flex justify-between text-luxury-muted"><span>Shipping</span><span>Free</span></div>}
                <div className="flex justify-between text-luxury-muted"><span>{taxLabel} ({taxRate}%)</span><span>₹{(10000 * taxRate / 100).toFixed(2)}</span></div>
                <div className="flex justify-between text-luxury-white font-medium border-t border-luxury-gray/30 pt-1.5">
                  <span>Total</span>
                  <span>₹{(10000 + shippingCost + 10000 * taxRate / 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ BUTTONS ══════════════════════════════════════════════════════════ */}
      {activeTab === 'buttons' && (
        <div className="space-y-4">
          <p className="text-luxury-muted text-xs">Set the label and redirect URL for key site buttons.</p>
          {buttons.filter(btn => !HIDDEN_BUTTONS.has(btn.id)).map(btn => (
            <div key={btn.id} className="border border-luxury-gray/50 rounded p-4 space-y-3">
              <p className="text-luxury-white text-xs tracking-luxury uppercase">{BUTTON_LABELS[btn.id] ?? btn.id}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Label</label>
                  <input value={btn.label} onChange={e => updateButton(btn.id, 'label', e.target.value)}
                    className="w-full bg-luxury-black border border-luxury-gray text-luxury-white px-3 py-1.5 text-xs outline-none focus:border-luxury-gold" />
                </div>
                <div>
                  <label className="text-luxury-muted text-[10px] uppercase tracking-luxury block mb-1">Redirect URL</label>
                  <input value={btn.href} onChange={e => updateButton(btn.id, 'href', e.target.value)} placeholder="/collections/..."
                    className="w-full bg-luxury-black border border-luxury-gray text-luxury-muted px-3 py-1.5 text-xs outline-none focus:border-luxury-gold" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Save bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-4 pb-12 border-t border-luxury-gray/30">
        <button onClick={handleSave} disabled={saving}
          className="px-8 py-3 border border-luxury-gold text-luxury-gold text-xs tracking-luxury uppercase hover:bg-luxury-gold hover:text-luxury-black disabled:opacity-50 transition-all">
          {saving ? 'Saving…' : 'Save & Apply'}
        </button>
        {saved && <p className="text-green-400 text-xs tracking-wide">Saved — changes applied site-wide.</p>}
      </div>
    </section>
  )
}
