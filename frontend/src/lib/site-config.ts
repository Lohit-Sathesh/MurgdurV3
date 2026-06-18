// Shared constants/helpers — no 'use client' so this can be imported in both
// server components (layout.tsx) and client components (SiteConfigContext).

export function hexToRgbChannels(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return ''
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return ''
  return `${r} ${g} ${b}`
}

// Font stacks — system fonts use direct stacks, Google Fonts use CSS variables
// that are loaded by layout.tsx via next/font/google.
export const FONT_MAP: Record<string, string> = {
  // ── Default (uses site's own Playfair/Inter next/font classes) ──────────
  default:     '',

  // ── Already loaded via next/font in layout.tsx ───────────────────────────
  playfair:    'var(--font-playfair), serif',
  inter:       'var(--font-inter), sans-serif',

  // ── New Google Fonts (loaded in layout.tsx) ──────────────────────────────
  montserrat:  'var(--font-montserrat), sans-serif',
  cormorant:   'var(--font-cormorant), serif',
  eb_garamond: 'var(--font-eb-garamond), serif',
  lato:        'var(--font-lato), sans-serif',
  oswald:      'var(--font-oswald), sans-serif',
  josefin:     'var(--font-josefin), sans-serif',
  raleway:     'var(--font-raleway), sans-serif',
  cinzel:      'var(--font-cinzel), serif',
  bodoni:      'var(--font-bodoni), serif',

  // ── System fonts (no loading required) ───────────────────────────────────
  georgia:     "Georgia, 'Times New Roman', serif",
  times:       "'Times New Roman', Times, serif",
  arial:       'Arial, Helvetica, sans-serif',
  calibri:     'Calibri, Candara, Arial, sans-serif',
  garamond:    "Garamond, 'EB Garamond', Georgia, serif",
  helvetica:   'Helvetica, Arial, sans-serif',
  courier:     "'Courier New', Courier, monospace",
  verdana:     'Verdana, Geneva, sans-serif',
  trebuchet:   "'Trebuchet MS', Tahoma, sans-serif",
  palatino:    "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
}

export const FONT_OPTIONS = [
  { value: 'default',     label: 'Default (site fonts)',      group: 'Default' },
  // Google Fonts — pre-loaded
  { value: 'playfair',    label: 'Playfair Display',          group: 'Google Fonts' },
  { value: 'inter',       label: 'Inter',                     group: 'Google Fonts' },
  { value: 'montserrat',  label: 'Montserrat',                group: 'Google Fonts' },
  { value: 'cormorant',   label: 'Cormorant Garamond',        group: 'Google Fonts' },
  { value: 'eb_garamond', label: 'EB Garamond',               group: 'Google Fonts' },
  { value: 'lato',        label: 'Lato',                      group: 'Google Fonts' },
  { value: 'oswald',      label: 'Oswald',                    group: 'Google Fonts' },
  { value: 'josefin',     label: 'Josefin Sans',              group: 'Google Fonts' },
  { value: 'raleway',     label: 'Raleway',                   group: 'Google Fonts' },
  { value: 'cinzel',      label: 'Cinzel (Luxury)',           group: 'Google Fonts' },
  { value: 'bodoni',      label: 'Bodoni Moda',               group: 'Google Fonts' },
  // System fonts
  { value: 'georgia',     label: 'Georgia',                   group: 'System' },
  { value: 'times',       label: 'Times New Roman',           group: 'System' },
  { value: 'palatino',    label: 'Palatino',                  group: 'System' },
  { value: 'garamond',    label: 'Garamond',                  group: 'System' },
  { value: 'arial',       label: 'Arial',                     group: 'System' },
  { value: 'helvetica',   label: 'Helvetica',                 group: 'System' },
  { value: 'calibri',     label: 'Calibri',                   group: 'System' },
  { value: 'trebuchet',   label: 'Trebuchet MS',              group: 'System' },
  { value: 'verdana',     label: 'Verdana',                   group: 'System' },
  { value: 'courier',     label: 'Courier New (Mono)',        group: 'System' },
]
