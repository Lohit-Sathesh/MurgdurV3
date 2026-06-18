import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Default size guides seeded on first use
const DEFAULT_GUIDES = [
  {
    name: "Women's",
    sortOrder: 0,
    blocks: [
      {
        id: 'w-text-1',
        type: 'text',
        content: 'All measurements are in centimetres. For the best fit, measure over light clothing.',
      },
      {
        id: 'w-table-1',
        type: 'table',
        columns: ['Size', 'Bust', 'Waist', 'Hips'],
        rows: [
          ['XS', '80', '62', '88'],
          ['S',  '84', '66', '92'],
          ['M',  '88', '70', '96'],
          ['L',  '92', '74', '100'],
          ['XL', '96', '78', '104'],
        ],
      },
    ],
  },
  {
    name: "Men's",
    sortOrder: 1,
    blocks: [
      {
        id: 'm-text-1',
        type: 'text',
        content: 'All measurements are in centimetres. Measure over a fitted shirt for best results.',
      },
      {
        id: 'm-table-1',
        type: 'table',
        columns: ['Size', 'Shoulders', 'Chest', 'Arms', 'Waist', 'Hip'],
        rows: [
          ['XS', '40', '88',  '58', '72', '88'],
          ['S',  '42', '92',  '60', '76', '92'],
          ['M',  '44', '96',  '62', '80', '96'],
          ['L',  '46', '100', '64', '84', '100'],
          ['XL', '48', '104', '66', '88', '104'],
        ],
      },
    ],
  },
]

@Injectable()
export class SizeGuideService {
  private r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  constructor(private prisma: PrismaService) {}

  async findAll() {
    const guides = await this.prisma.sizeGuide.findMany({ orderBy: { sortOrder: 'asc' } })
    if (!guides.length) return this.seed()
    return guides
  }

  async findOne(id: string) {
    const guide = await this.prisma.sizeGuide.findUnique({ where: { id } })
    if (!guide) throw new NotFoundException('Size guide not found')
    return guide
  }

  async create(data: { name: string; sortOrder?: number; blocks?: any[] }) {
    return this.prisma.sizeGuide.create({
      data: {
        name:      data.name,
        sortOrder: data.sortOrder ?? 0,
        blocks:    data.blocks    ?? [],
      },
    })
  }

  async update(id: string, data: { name?: string; sortOrder?: number; blocks?: any[] }) {
    await this.findOne(id)
    return this.prisma.sizeGuide.update({ where: { id }, data })
  }

  async remove(id: string) {
    await this.findOne(id)
    // Unassign from products first
    await this.prisma.product.updateMany({ where: { sizeGuideId: id }, data: { sizeGuideId: null } })
    return this.prisma.sizeGuide.delete({ where: { id } })
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase()
    const key = `size-guides/${Date.now()}-${safeName}`
    await this.r2.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME,
      Key:         key,
      Body:        file.buffer,
      ContentType: file.mimetype,
    }))
    return `${process.env.R2_PUBLIC_CDN_URL}/${key}`
  }

  private async seed() {
    const created = await Promise.all(
      DEFAULT_GUIDES.map(g => this.prisma.sizeGuide.create({ data: g as any })),
    )
    return created
  }
}
