import { Injectable, NotFoundException } from '@nestjs/common'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { PrismaService } from '../database/prisma.service'
import sharp = require('sharp')

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  private r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  async uploadProductImages(files: Express.Multer.File[], sku: string, variantId?: string) {
    if (!files?.length) throw new NotFoundException('No files provided.')

    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: { images: true },
    })
    if (!product) throw new NotFoundException(`No product found with SKU "${sku}".`)

    const sizes = [
      { suffix: 'hero', width: 1200 },
      { suffix: 'medium', width: 800 },
      { suffix: 'thumb', width: 400 },
    ]

    const baseSortOrder = product.images.length

    // Process all files concurrently; within each image all 3 size variants are
    // also generated + uploaded in parallel — this is the main timeout fix.
    const created = await Promise.all(files.map(async (file, idx) => {
      const sortOrder = baseSortOrder + idx
      const isVideo = file.mimetype.startsWith('video/')
      const isGif = file.mimetype === 'image/gif'

      if (isVideo || isGif) {
        const ext = file.originalname.split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'gif')
        const key = `products/${product.slug}/${Date.now() + idx}-${sortOrder}.${ext}`
        await this.r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }))
        const url = `${process.env.R2_PUBLIC_CDN_URL}/${key}`
        return this.prisma.productImage.create({
          data: { productId: product.id, variantId: variantId || null, url, sortOrder, isVideo },
        })
      }

      // All 3 resize + upload operations run in parallel per image
      const ts = Date.now() + idx
      const sizeResults = await Promise.all(sizes.map(async ({ suffix, width }) => {
        const webp = await sharp(file.buffer).resize(width).webp({ quality: 90 }).toBuffer()
        const key = `products/${product.slug}/${ts}-${suffix}-${sortOrder}.webp`
        await this.r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: webp,
          ContentType: 'image/webp',
        }))
        return { suffix, url: `${process.env.R2_PUBLIC_CDN_URL}/${key}` }
      }))

      const urls = Object.fromEntries(sizeResults.map(r => [r.suffix, r.url]))
      const image = await this.prisma.productImage.create({
        data: { productId: product.id, variantId: variantId || null, url: urls.hero, sortOrder },
      })
      return { ...image, ...urls }
    }))

    return { product: { id: product.id, name: product.name, sku: product.sku }, images: created }
  }

  async uploadGenericImage(file: Express.Multer.File, prefix: string) {
    if (!file) throw new NotFoundException('No file provided.')
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase()
    const key = `${prefix}/${Date.now()}-${safeName}`
    await this.r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }))
    return { url: `${process.env.R2_PUBLIC_CDN_URL}/${key}` }
  }

  async uploadHomepageMedia(file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file provided.')

    const isVideo = file.mimetype.startsWith('video/')
    const key = `homepage/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`

    await this.r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }))

    let textTheme = 'dark'
    if (!isVideo) {
      try {
        const { data, info } = await sharp(file.buffer).resize(8, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
        // Sample only the centre 4×4 region (rows/cols 2–5) — this is where
        // the headline overlays the image, giving a more accurate reading than
        // averaging the full frame.
        let total = 0, count = 0
        const ch = info.channels
        for (let row = 2; row <= 5; row++) {
          for (let col = 2; col <= 5; col++) {
            const i = (row * 8 + col) * ch
            total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            count++
          }
        }
        textTheme = (total / count) > 128 ? 'light' : 'dark'
      } catch {}
    }

    return { url: `${process.env.R2_PUBLIC_CDN_URL}/${key}`, mediaType: isVideo ? 'video' : 'image', textTheme }
  }

  async reorderProductImage(imageId: string, sortOrder: number) {
    return this.prisma.productImage.update({ where: { id: imageId }, data: { sortOrder } })
  }

  async getProductImages(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!product) throw new NotFoundException(`No product found with SKU "${sku}".`)

    return { product: { id: product.id, name: product.name, sku: product.sku }, images: product.images }
  }

  async deleteProductImage(sku: string, imageId: string) {
    const product = await this.prisma.product.findUnique({ where: { sku } })
    if (!product) throw new NotFoundException(`No product found with SKU "${sku}".`)

    const image = await this.prisma.productImage.findFirst({ where: { id: imageId, productId: product.id } })
    if (!image) throw new NotFoundException('Image not found for this product.')

    const prefix = process.env.R2_PUBLIC_CDN_URL + '/'
    if (image.url.startsWith(prefix)) {
      const heroKey = image.url.slice(prefix.length)
      const keys = [heroKey, heroKey.replace('-hero-', '-medium-'), heroKey.replace('-hero-', '-thumb-')]
      await Promise.all(keys.map((key) =>
        this.r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })),
      ))
    }

    await this.prisma.productImage.delete({ where: { id: imageId } })
    return { id: imageId }
  }
}
