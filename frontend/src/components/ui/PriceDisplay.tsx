'use client'
import { useCurrency }   from '@/context/CurrencyContext'
import { useSiteConfig } from '@/context/SiteConfigContext'

export function PriceDisplay({
  price, comparePrice, size = 'sm',
}: {
  price:        string | number
  comparePrice?: string | number | null
  size?:        'sm' | 'lg'
}) {
  const { format }   = useCurrency()
  const { taxRate }  = useSiteConfig()

  const base    = Number(price)
  const compare = comparePrice ? Number(comparePrice) : null
  const onSale  = compare !== null && compare > base

  // Discount % is calculated on BASE prices (before tax) so the percentage
  // reflects the actual markdown, not the tax-inflated numbers.
  const discountPct = onSale ? Math.round(((compare! - base) / compare!) * 100) : 0

  // Tax is applied to the SALE/discounted price, not the original.
  // All prices shown to customers are tax-inclusive.
  const multiplier        = 1 + taxRate / 100
  const displayPrice      = base     * multiplier
  const displayCompare    = compare  ? compare * multiplier : null

  const priceClass   = size === 'lg' ? 'text-2xl tracking-wide' : 'text-sm'
  const compareClass = size === 'lg' ? 'text-lg'                : 'text-xs'

  if (!onSale) {
    return <p className={`text-luxury-gold ${priceClass}`}>{format(displayPrice)}</p>
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p className={`text-luxury-gold ${priceClass}`}>{format(displayPrice)}</p>
      <p className={`text-luxury-muted line-through ${compareClass}`}>{format(displayCompare!)}</p>
      <span className="text-amber-400 text-xs tracking-luxury">−{discountPct}%</span>
    </div>
  )
}
