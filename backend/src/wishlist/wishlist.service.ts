import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { images: { take: 1 }, variants: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async addToWishlist(userId: string, productId: string) {
    try {
      return await this.prisma.wishlistItem.create({ data: { userId, productId } })
    } catch {
      throw new ConflictException('Already in wishlist')
    }
  }

  async removeFromWishlist(userId: string, productId: string) {
    return this.prisma.wishlistItem.deleteMany({ where: { userId, productId } })
  }
}