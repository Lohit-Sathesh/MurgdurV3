'use client'

export type TextPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const POSITIONS: { value: TextPosition; label: string; icon: string }[] = [
  { value: 'top-left',     label: 'Top left',     icon: '↖' },
  { value: 'top-right',    label: 'Top right',    icon: '↗' },
  { value: 'center',       label: 'Centre',       icon: '⊙' },
  { value: 'bottom-left',  label: 'Bottom left',  icon: '↙' },
  { value: 'bottom-right', label: 'Bottom right', icon: '↘' },
]

export function TextPositionPicker({
  value = 'center',
  onChange,
}: {
  value?: TextPosition | string
  onChange: (v: TextPosition) => void
}) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-luxury text-luxury-muted mb-1.5">
        Text Position
      </span>
      <div className="inline-grid grid-cols-3 gap-1">
        {POSITIONS.map(p => (
          <button
            key={p.value}
            type="button"
            title={p.label}
            onClick={() => onChange(p.value)}
            className={`w-8 h-8 text-base flex items-center justify-center border rounded transition-colors ${
              value === p.value
                ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/10'
                : 'border-luxury-gray text-luxury-muted hover:border-luxury-white hover:text-luxury-white'
            }`}
          >
            {p.icon}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Convert DB textPosition → Tailwind classes for the text overlay container */
export function positionClasses(pos?: string | null): string {
  switch (pos) {
    case 'top-left':     return 'items-center sm:items-start  justify-center sm:justify-start  text-center sm:text-left   pt-16 sm:pt-28 px-6 sm:pl-16 sm:pr-8'
    case 'top-right':    return 'items-center sm:items-end    justify-center sm:justify-start  text-center sm:text-right  pt-16 sm:pt-28 px-6 sm:pr-16 sm:pl-8'
    case 'bottom-left':  return 'items-center sm:items-start  justify-end                      text-center sm:text-left   pb-16 sm:pb-20 px-6 sm:pl-16 sm:pr-8'
    case 'bottom-right': return 'items-center sm:items-end    justify-end                      text-center sm:text-right  pb-16 sm:pb-20 px-6 sm:pr-16 sm:pl-8'
    default:             return 'items-center justify-center text-center px-6 md:px-8'  // 'center'
  }
}
