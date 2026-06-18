import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class HomepageService {
  constructor(private prisma: PrismaService) {}

  async getActiveSlides() {
    return this.prisma.homepageSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getActiveBlocks() {
    return this.prisma.homepageBlock.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }
}
