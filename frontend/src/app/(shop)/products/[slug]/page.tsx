import { ProductView } from '@/components/shop/ProductView'
import { BackButton }  from '@/components/ui/BackButton'
import { api }         from '@/lib/api'
import type { Product } from '@/types/product'

export const revalidate = 120

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product: Product | null = null
  try {
    const res = await api.get(`/products/${params.slug}`)
    product = res.data
  } catch {}

  if (!product) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center text-luxury-white font-serif text-3xl">
        Product not found
      </div>
    )
  }

  return (
    <div>
      {/* Back button sits above the full-bleed grid */}
      <div className="px-8 pt-8 pb-4">
        <BackButton />
      </div>
      <ProductView product={product} />
    </div>
  )
}
