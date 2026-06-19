import type { Metadata } from 'next'
import { ProductView }  from '@/components/shop/ProductView'
import { BackButton }   from '@/components/ui/BackButton'
import { api }          from '@/lib/api'
import type { Product } from '@/types/product'

export const revalidate = 120

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://murgdur.com'

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await api.get(`/products/${slug}`)
    return res.data
  } catch { return null }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Product Not Found' }

  const title       = product.name
  const description = product.description || `Shop ${product.name} — luxury fashion by Murgdur.`
  const imageUrl    = product.images?.[0]?.url ?? `${SITE_URL}/og-default.jpg`
  const canonical   = `${SITE_URL}/products/${product.slug}`

  return {
    title,
    description,
    openGraph: {
      type:        'website',
      title,
      description,
      url:         canonical,
      images: [{
        url:    imageUrl,
        width:  1200,
        height: 630,
        alt:    product.images?.[0]?.altText || title,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [imageUrl],
    },
    alternates: { canonical },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)

  if (!product) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center text-luxury-white font-serif text-3xl">
        Product not found
      </div>
    )
  }

  const lowestPrice = product.variants?.length
    ? Math.min(...product.variants.map(v => parseFloat(v.price ?? product.price)))
    : parseFloat(product.price)

  const inStock = product.variants?.some(v => v.stock > 0) ?? true

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',       item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: product.category?.name ?? 'Collections', item: `${SITE_URL}/collections/${product.category?.slug ?? 'new-arrivals'}` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}/products/${product.slug}` },
    ],
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:       product.name,
    description: product.description,
    sku:        product.sku,
    brand: {
      '@type': 'Brand',
      name:    'Murgdur',
    },
    image:  product.images?.map(img => img.url) ?? [],
    offers: {
      '@type':         'Offer',
      url:             `${SITE_URL}/products/${product.slug}`,
      priceCurrency:   product.currency ?? 'INR',
      price:           lowestPrice.toFixed(2),
      availability:    inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name:    'Murgdur',
      },
    },
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <BackButton />
      </div>
      <ProductView product={product} />
    </div>
  )
}
