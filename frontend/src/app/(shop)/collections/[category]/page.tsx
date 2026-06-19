import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { CategoryHero } from '@/components/shop/CategoryHero'
import { InfoPageRenderer } from '@/components/shop/InfoPageRenderer'
import { FilterPanel } from '@/components/shop/FilterPanel'
import { api } from '@/lib/api'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://murgdur.com'

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  try {
    const res = await api.get(`/products?category=${params.category}&limit=1`)
    const category = res.data?.category
    const name     = category?.name ?? params.category.replace(/-/g, ' ')
    const title    = `${name.charAt(0).toUpperCase() + name.slice(1)} Collection`
    const description = category?.description
      ?? `Shop the ${name} collection at Murgdur — luxury fashion crafted for the extraordinary.`
    const canonical = `${SITE_URL}/collections/${params.category}`
    return {
      title,
      description,
      openGraph: { title, description, url: canonical, images: [{ url: '/og-default.jpg', width: 1200, height: 630 }] },
      twitter:   { card: 'summary_large_image', title, description },
      alternates: { canonical },
    }
  } catch {
    return { title: params.category }
  }
}

export async function generateStaticParams() {
  try {
    const res = await api.get('/products/categories')
    return res.data.flatMap((cat: any) => [
      { category: cat.slug },
      ...(cat.children?.map((c: any) => ({ category: c.slug })) ?? [])
    ])
  } catch { return [] }
}

export default async function CollectionPage({
  params, searchParams
}: {
  params: { category: string }
  searchParams: { sort?: string; color?: string; size?: string; minPrice?: string; maxPrice?: string }
}) {
  let products = []
  let total = 0
  let categoryName = params.category
  let category: {
    name: string
    description: string | null
    pageType: string
    highlights?: any[]
    infoBlocks?: any[]
  } | null = null

  const filterParams: Record<string, string | undefined> = {
    category: params.category,
    sort: searchParams.sort,
    color: searchParams.color,
    size: searchParams.size,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
  }

  try {
    const query = new URLSearchParams(
      Object.entries({ ...filterParams, limit: '24' }).filter(([, v]) => v) as [string, string][]
    )
    const res = await api.get(`/products?${query}`)
    products = res.data.products
    total = res.data.total ?? products.length
    category = res.data.category ?? null
    categoryName = category?.name ?? params.category
  } catch {}

  // Link page branch — redirect immediately
  if (category?.pageType === 'link' && (category as any)?.linkUrl) {
    redirect((category as any).linkUrl)
  }

  // Info page branch
  if (category?.pageType === 'info') {
    return (
      <InfoPageRenderer
        category={{
          name: category.name,
          description: category.description,
          infoBlocks: category.infoBlocks ?? [],
        }}
      />
    )
  }

  // Products page branch (default)
  const gallerySlides = (category?.highlights ?? [])
    .filter((h: any) => h.placement === 'gallery')
    .sort((a: any, b: any) => (a.showAfterRows ?? 1) - (b.showAfterRows ?? 1) || a.sortOrder - b.sortOrder)
    .map((h: any) => ({
      mediaUrl:     h.imageUrl,
      mediaType:    (h.mediaType ?? 'image') as 'image' | 'video',
      headline:     h.title      ?? '',
      subheading:   h.subheading ?? null,
      linkUrl:      h.linkUrl    ?? null,
      textTheme:    h.textTheme  ?? 'dark',
      textPosition: h.textPosition ?? 'center',
      layout:       h.layout     ?? 'full',
      showAfterRows: h.showAfterRows ?? 1,
    }))

  return (
    <div>
      {category ? (
        <CategoryHero category={category} />
      ) : (
        <div className="max-w-3xl mx-auto px-8 pt-32 text-center">
          <h1 className="font-serif text-4xl md:text-6xl tracking-luxury text-luxury-white mb-6 capitalize">
            {categoryName}
          </h1>
        </div>
      )}

      <ProductGrid products={products} total={total} query={filterParams} gallerySlides={gallerySlides} />

      <FilterPanel category={params.category} />
    </div>
  )
}
