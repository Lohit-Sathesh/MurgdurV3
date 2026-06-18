import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { RedisService } from '../database/redis.service'
import { SearchService } from '../search/search.service'
import { ProductQueryDto } from './dto/product-query.dto'
import { CreateProductDto } from './dto/create-product.dto'
import { generateSku, skuPrefixFromName } from '../common/utils/sku'
import { slugify } from '../common/utils/slug'

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private search: SearchService,
  ) {}

  async findAll(query: ProductQueryDto) {
    const cacheKey = `products:${JSON.stringify(query)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const where: any = { isActive: true }
    let categoryInfo: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; highlights: any[]; pageType: string; infoBlocks: any[] } | null = null

    // Filter by specific IDs (used by homepage product blocks)
    if (query.ids) {
      const idList = query.ids.split(',').map(id => id.trim()).filter(Boolean)
      if (idList.length) where.id = { in: idList }
    }

    // Text search by name or SKU
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku:  { contains: query.q, mode: 'insensitive' } },
      ]
    }

    if (query.category) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: query.category },
        include: {
          children: true,
          highlights: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          infoBlocks: { orderBy: { sortOrder: 'asc' } },
        },
      })
      if (cat) {
        categoryInfo = { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description, imageUrl: cat.imageUrl, highlights: cat.highlights ?? [], pageType: cat.pageType, linkUrl: (cat as any).linkUrl as string | null ?? null, infoBlocks: cat.infoBlocks } as any
        if (cat.slug === 'new-arrivals') {
          const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          where.OR = [
            { createdAt: { gte: twoDaysAgo } },
            { categoryId: cat.id },
          ]
        } else {
          const categoryIds = [cat.id, ...cat.children.map((c) => c.id)]
          where.categoryId = { in: categoryIds }
        }
      }
    }
    if (query.featured) where.isFeatured = true
    if (query.newArrivals) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const newArrivalsCategory = await this.prisma.category.findUnique({ where: { slug: 'new-arrivals' } })
      where.OR = [
        { createdAt: { gte: twoDaysAgo } },
        ...(newArrivalsCategory ? [{ categoryId: newArrivalsCategory.id }] : []),
      ]
    }
    if (query.color || query.size) {
      where.variants = {
        some: {
          ...(query.color ? { color: { equals: query.color, mode: 'insensitive' } } : {}),
          ...(query.size ? { size: { equals: query.size, mode: 'insensitive' } } : {}),
        },
      }
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      }
    }

    const orderBy: any = query.sort === 'price_asc'  ? { price: 'asc' }
                       : query.sort === 'price_desc' ? { price: 'desc' }
                       : { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy,
        take: query.limit ?? 20,
        skip: query.offset ?? 0,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 2 },
          variants: true,
          category: true,
        }
      }),
      this.prisma.product.count({ where }),
    ])

    const result = { products, total, category: categoryInfo }
    await this.redis.set(cacheKey, JSON.stringify(result), 60)
    return result
  }

  async findBySlug(slug: string) {
    const cacheKey = `product:${slug}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { sortOrder: 'asc' } }, variants: true, category: true, sizeGuide: true }
    })

    if (product) await this.redis.set(cacheKey, JSON.stringify(product), 120)
    return product
  }

  async getFilters(categorySlug?: string) {
    const cacheKey = `filters:${categorySlug ?? 'all'}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const where: any = {
      isActive: true,
      stock: { gt: 0 },
      product: { isActive: true },
    }

    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: true },
      })
      if (cat) {
        const categoryIds = [cat.id, ...cat.children.map((c) => c.id)]
        where.product.categoryId = { in: categoryIds }
      }
    }

    const variants = await this.prisma.productVariant.findMany({
      where,
      select: { color: true, colorHex: true, size: true },
    })

    const colorMap = new Map<string, string | null>()
    const sizes = new Set<string>()
    for (const v of variants) {
      if (v.color) colorMap.set(v.color, v.colorHex ?? colorMap.get(v.color) ?? null)
      if (v.size) sizes.add(v.size)
    }

    const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    const sortedSizes = Array.from(sizes).sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a)
      const bi = SIZE_ORDER.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      const an = Number(a), bn = Number(b)
      if (!isNaN(an) && !isNaN(bn)) return an - bn
      return a.localeCompare(b)
    })

    const result = {
      colors: Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })),
      sizes: sortedSizes,
    }
    await this.redis.set(cacheKey, JSON.stringify(result), 60)
    return result
  }

  async getCategories() {
    const cached = await this.redis.get('categories:tree')
    if (cached) return JSON.parse(cached)

    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: {
            highlights: { where: { isActive: true, placement: 'menu' }, orderBy: { sortOrder: 'asc' }, take: 1 },
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                highlights: { where: { isActive: true, placement: 'menu' }, orderBy: { sortOrder: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' }
    })

    await this.redis.set('categories:tree', JSON.stringify(categories), 300)
    return categories
  }

  private async generateUniqueProductSku(name: string): Promise<string> {
    const prefix = skuPrefixFromName(name)
    let sku = generateSku(prefix)
    while (await this.prisma.product.findUnique({ where: { sku } })) {
      sku = generateSku(prefix)
    }
    return sku
  }

  private async generateUniqueVariantSku(productSku: string): Promise<string> {
    let sku = generateSku(productSku)
    while (await this.prisma.productVariant.findUnique({ where: { sku } })) {
      sku = generateSku(productSku)
    }
    return sku
  }

  private async generateUniqueProductSlug(name: string): Promise<string> {
    const base = slugify(name) || 'product'
    let slug = base
    let counter = 2
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`
      counter++
    }
    return slug
  }

  async create(dto: CreateProductDto) {
    const { variants, slug: customSlug, ...productData } = dto

    // Use custom slug if provided (sanitised), otherwise auto-generate from name
    let slug: string
    if (customSlug) {
      const candidate = slugify(customSlug) || slugify(dto.name)
      const existing = await this.prisma.product.findUnique({ where: { slug: candidate } })
      slug = existing ? await this.generateUniqueProductSlug(dto.name) : candidate
    } else {
      slug = await this.generateUniqueProductSlug(dto.name)
    }
    const sku = await this.generateUniqueProductSku(dto.name)

    const variantsWithSkus = variants?.length
      ? await Promise.all(variants.map(async v => ({ ...v, sku: await this.generateUniqueVariantSku(sku) })))
      : undefined

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        sku,
        ...(variantsWithSkus?.length ? { variants: { create: variantsWithSkus } } : {}),
      } as any,
      include: { images: true, variants: true, category: true, sizeGuide: true },
    })
    await this.search.syncProduct(product)
    return product
  }
}