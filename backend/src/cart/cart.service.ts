import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export interface UpsertItemDto {
  productId: string
  variantId?: string | null
  name:       string
  price:      number
  image?:     string
  color?:     string
  size?:      string
  quantity:   number
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /** Get or create the cart for a user */
  private async getOrCreate(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where:   { userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    })
    if (!cart) {
      cart = await this.prisma.cart.create({
        data:    { userId },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      })
    }
    return cart
  }

  async getCart(userId: string) {
    return this.getOrCreate(userId)
  }

  async addItem(userId: string, dto: UpsertItemDto) {
    const cart = await this.getOrCreate(userId)
    const key  = { cartId: cart.id, productId: dto.productId, variantId: dto.variantId ?? null }
    const existing = cart.items.find(
      i => i.productId === dto.productId && (i.variantId ?? null) === (dto.variantId ?? null),
    )

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data:  { quantity: existing.quantity + dto.quantity },
      })
    }

    return this.prisma.cartItem.create({
      data: {
        ...key,
        name:     dto.name,
        price:    dto.price,
        image:    dto.image ?? '',
        color:    dto.color ?? null,
        size:     dto.size  ?? null,
        quantity: dto.quantity,
      },
    })
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreate(userId)
    const item = cart.items.find(i => i.id === itemId)
    if (!item) return null

    if (quantity <= 0) {
      return this.prisma.cartItem.delete({ where: { id: itemId } })
    }
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreate(userId)
    const item = cart.items.find(i => i.id === itemId)
    if (!item) return null
    return this.prisma.cartItem.delete({ where: { id: itemId } })
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreate(userId)
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    return { ok: true }
  }

  /** Merge local (guest) items into the server cart on login */
  async mergeItems(userId: string, localItems: UpsertItemDto[]) {
    for (const item of localItems) {
      await this.addItem(userId, item)
    }
    return this.getCart(userId)
  }
}
