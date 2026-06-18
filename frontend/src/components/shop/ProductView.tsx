'use client'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Heart, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { useTextStyle, useButton, useSiteConfig } from '@/context/SiteConfigContext'
import { SizeGuideDrawer } from '@/components/shop/SizeGuideDrawer'
import type { Product, ProductVariant } from '@/types/product'

// ── Accordion ─────────────────────────────────────────────────────────────────

function Accordion({ label, children }: { label: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-luxury-gray">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-luxury-white text-xs tracking-luxury uppercase hover:text-luxury-gold transition-colors duration-300">
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children && (
        <div className="pb-5 text-luxury-muted text-xs leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProductView({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(product.variants?.[0])
  const [descExpanded,     setDescExpanded]     = useState(false)
  const [added,            setAdded]            = useState(false)
  const [guideOpen,        setGuideOpen]        = useState(false)

  const { addItem }              = useCart()
  const { isInWishlist, toggle } = useWishlist()
  const { isLoggedIn }           = useAuth()
  const { productAccordions }    = useSiteConfig()
  const addToCartBtn             = useButton('add_to_cart')
  const sectionStyle             = useTextStyle('productPage')

  const totalStock   = product.variants?.reduce((s, v) => s + v.stock, 0) ?? 0
  const inWishlist   = isInWishlist(product.id)

  // Unique sizes for the selected colour
  const sizes = useMemo(() => {
    const base = product.variants ?? []
    const filtered = selectedVariant?.color
      ? base.filter(v => v.color === selectedVariant.color)
      : base
    return [...new Set(filtered.map(v => v.size).filter(Boolean))] as string[]
  }, [product.variants, selectedVariant?.color])

  // Unique colour swatches
  const colorSwatches = useMemo(() => {
    const seen = new Map<string, ProductVariant>()
    for (const v of product.variants ?? []) {
      if (v.color && !seen.has(v.color)) seen.set(v.color, v)
    }
    return Array.from(seen.values())
  }, [product.variants])

  // Images for selected colour (fall back to untagged images, then all)
  const displayImages = useMemo(() => {
    if (selectedVariant?.color) {
      const ids = new Set(
        (product.variants ?? []).filter(v => v.color === selectedVariant.color).map(v => v.id),
      )
      const ci = product.images.filter(img => img.variantId && ids.has(img.variantId))
      if (ci.length) return ci
    }
    const untagged = product.images.filter(img => !img.variantId)
    return untagged.length ? untagged : product.images
  }, [product.images, product.variants, selectedVariant?.color])

  function selectColor(v: ProductVariant) {
    const match = product.variants?.find(x => x.color === v.color && x.size === selectedVariant?.size)
    setSelectedVariant(match ?? v)
  }

  function selectSize(size: string) {
    const match = product.variants?.find(v => v.size === size &&
      (!selectedVariant?.color || v.color === selectedVariant.color))
    if (match) setSelectedVariant(match)
  }

  function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock === 0) return
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name:      product.name,
      price:     Number(selectedVariant.price ?? product.price),
      image:     product.images?.[0]?.url ?? '',
      color:     selectedVariant.color  ?? undefined,
      size:      selectedVariant.size   ?? undefined,
      quantity:  1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  async function handleWishlist() {
    if (!isLoggedIn) return
    await toggle(product.id)
  }

  // Description truncation
  const MAX_CHARS = 180
  const longDesc  = (product.description?.length ?? 0) > MAX_CHARS
  const shownDesc = longDesc && !descExpanded
    ? product.description.slice(0, MAX_CHARS) + '…'
    : product.description

  const canAddToCart = !!(selectedVariant && selectedVariant.stock > 0 && totalStock > 0)

  return (
    <>
    <SizeGuideDrawer
      guide={product.sizeGuide ?? null}
      isOpen={guideOpen}
      onClose={() => setGuideOpen(false)}
    />
    <div className="lg:grid lg:grid-cols-2 lg:items-start">

      {/* ── Left: vertically stacked images ──────────────────────────────── */}
      <div>
        {displayImages.length > 0 ? displayImages.map((img, i) => (
          <div key={img.id} className="relative w-full aspect-[2/3] bg-luxury-gray overflow-hidden">
            {img.isVideo ? (
              <video src={img.url} autoPlay muted loop playsInline
                className="w-full h-full object-cover" />
            ) : (
              <Image
                src={img.url}
                alt={`${product.name} — view ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
                priority={i === 0}
              />
            )}
          </div>
        )) : (
          <div className="relative w-full aspect-[2/3] bg-luxury-gray flex items-center justify-center">
            <span className="text-luxury-muted text-xs tracking-luxury uppercase">No image</span>
          </div>
        )}
      </div>

      {/* ── Right: sticky details panel ──────────────────────────────────── */}
      <div className="lg:sticky lg:top-20 lg:self-start
                      px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-7
                      lg:border-l border-t lg:border-t-0 border-luxury-gray">

        {/* Stock badge */}
        {totalStock === 0 && <Badge variant="out-of-stock">Out of Stock</Badge>}
        {totalStock > 0 && totalStock < 10 && <Badge variant="low-stock">Only {totalStock} left</Badge>}

        {/* Product name */}
        <h1 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-[0.08em] sm:tracking-luxury text-luxury-white leading-snug"
          style={sectionStyle}>
          {product.name}
        </h1>

        {/* Price */}
        <div className="space-y-1">
          <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="lg" />
          <p className="text-luxury-muted text-[10px] tracking-luxury">(M.R.P. incl. of all taxes)</p>
        </div>

        {/* Colour swatches */}
        {colorSwatches.length > 1 && (
          <div className="space-y-3">
            <p className="text-luxury-muted text-[10px] tracking-luxury uppercase">
              Colour —&nbsp;
              <span className="text-luxury-white">{selectedVariant?.color ?? ''}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {colorSwatches.map(v => (
                <button
                  key={v.color}
                  onClick={() => selectColor(v)}
                  title={v.color ?? ''}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${
                    selectedVariant?.color === v.color
                      ? 'border-luxury-white scale-110'
                      : 'border-luxury-gray hover:border-luxury-muted'
                  }`}
                  style={{ backgroundColor: v.colorHex ?? '#ccc' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size selector */}
        {sizes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-luxury-muted text-[10px] tracking-luxury uppercase">
                Select your size
                {selectedVariant?.size && (
                  <span className="ml-2 text-luxury-white">— {selectedVariant.size}</span>
                )}
              </p>
              {product.sizeGuide && (
                <button
                  onClick={() => setGuideOpen(true)}
                  className="text-luxury-muted text-[10px] tracking-luxury uppercase underline underline-offset-2 hover:text-luxury-white transition-colors">
                  Size guide
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {sizes.map(size => {
                const v = product.variants?.find(v =>
                  v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color))
                const oos = !v || v.stock === 0
                return (
                  <button
                    key={size}
                    onClick={() => !oos && selectSize(size)}
                    disabled={oos}
                    className={`min-w-[44px] px-2 sm:px-3 py-3 text-[9px] sm:text-[10px] tracking-[0.08em] sm:tracking-luxury border transition-all duration-300 ${
                      selectedVariant?.size === size
                        ? 'border-luxury-white text-luxury-white bg-luxury-white/5'
                        : oos
                          ? 'border-luxury-gray/20 text-luxury-muted/30 line-through cursor-not-allowed'
                          : 'border-luxury-gray text-luxury-muted hover:border-luxury-white hover:text-luxury-white'
                    }`}>
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="w-full py-4 rounded-full bg-luxury-white text-luxury-black text-[11px] tracking-[0.15em] uppercase font-medium
                       hover:opacity-80
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-opacity duration-300">
            {added ? 'Added to Bag ✓' : totalStock === 0 ? 'Out of Stock' : addToCartBtn.label}
          </button>

          <button
            onClick={handleWishlist}
            className="w-full py-3.5 rounded-full border border-luxury-gray text-luxury-muted text-[10px] tracking-luxury uppercase
                       hover:border-luxury-white hover:text-luxury-white
                       flex items-center justify-center gap-2 transition-all duration-300">
            <Heart className={`w-3 h-3 transition-colors ${inWishlist ? 'fill-luxury-gold text-luxury-gold' : ''}`} />
            {inWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
          </button>
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <p className="text-luxury-muted text-xs leading-relaxed">{shownDesc}</p>
            {longDesc && (
              <button
                onClick={() => setDescExpanded(e => !e)}
                className="mt-2 text-luxury-white text-[10px] tracking-luxury uppercase underline underline-offset-2 hover:text-luxury-gold transition-colors">
                {descExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </div>
        )}

        {/* Material */}
        {product.material && (
          <p className="text-luxury-muted text-[10px] tracking-luxury uppercase">
            Material: {product.material}
          </p>
        )}

        {/* Accordions — titles and content editable in Admin → Theme → Product Info */}
        {productAccordions.length > 0 && (
          <div className="border-b border-luxury-gray">
            {productAccordions.map((acc, i) => (
              <Accordion key={i} label={acc.title}>
                {acc.content}
              </Accordion>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
