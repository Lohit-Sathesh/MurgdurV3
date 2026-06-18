import { Injectable, OnModuleInit } from '@nestjs/common'
import { MeiliSearch } from 'meilisearch'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class SearchService implements OnModuleInit {
  private client!: MeiliSearch
  private readonly INDEX = 'products'

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
    })
    await this.client.index(this.INDEX).updateFilterableAttributes(['categoryId', 'price'])
    await this.client.index(this.INDEX).updateSortableAttributes(['price', 'createdAt'])
    await this.client.index(this.INDEX).updateSearchableAttributes(['name', 'slug'])

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    })
    await this.reindexAll(products)
  }

  async syncProduct(product: any) {
    await this.client.index(this.INDEX).addDocuments([{
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      categoryId: product.categoryId,
      image: product.images?.[0]?.url ?? null,
    }], { primaryKey: 'id' })
  }

  async deleteProduct(id: string) {
    await this.client.index(this.INDEX).deleteDocument(id)
  }

  async reindexAll(products: any[]) {
    await this.client.index(this.INDEX).deleteAllDocuments()
    await this.client.index(this.INDEX).addDocuments(products.map(p => ({
      id: p.id, name: p.name, slug: p.slug,
      price: Number(p.price), categoryId: p.categoryId,
      image: p.images?.[0]?.url ?? null,
    })), { primaryKey: 'id' })
  }
}