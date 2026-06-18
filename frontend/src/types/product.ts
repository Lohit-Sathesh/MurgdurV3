export interface ProductImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
  isVideo: boolean
  variantId: string | null
}

export interface ProductVariant {
  id: string
  sku: string
  color: string | null
  colorHex: string | null
  size: string | null
  stock: number
  price: string | null
}

export interface SizeGuideBlock {
  id: string
  type: 'image' | 'table' | 'text'
  url?: string        // image block
  columns?: string[]  // table block
  rows?: string[][]   // table block
  content?: string    // text block
}

export interface SizeGuide {
  id: string
  name: string
  sortOrder: number
  blocks: SizeGuideBlock[]
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  description: string
  price: string
  comparePrice: string | null
  currency: string
  material: string | null
  images: ProductImage[]
  variants: ProductVariant[]
  category: { id: string; name: string; slug: string }
  createdAt?: string
  styleFontSize?: number | null
  styleTextColor?: string | null
  styleAccentColor?: string | null
  styleBgColor?: string | null
  sizeGuideId?: string | null
  sizeGuide?: SizeGuide | null
}
