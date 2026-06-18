import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService }  from '../database/prisma.service'
import { EmailService }   from '../email/email.service'
import { InvoiceService } from '../email/invoice.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region:        'auto',
  endpoint:      process.env.CLOUDFLARE_R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

@Injectable()
export class OrdersService {
  constructor(
    private prisma:   PrismaService,
    private email:    EmailService,
    private invoice:  InvoiceService,
  ) {}

  // ── createFromTemp: called by TempOrderService.activate() ─────────────────
  // Skips re-computing prices (uses snapshot values from the temp order),
  // decrements stock, creates the DB record. Invoice sent only on CONFIRMED.
  async createFromTemp(dto: {
    userId:    string
    addressId: string
    items:     Array<{ productId: string; variantId: string | null; quantity: number }>
    subtotal:  number
    tax:       number
    shipping:  number
    total:     number
  }) {
    const orderNumber = `MRG-${Math.floor(100000 + Math.random() * 900000)}`

    const itemsData = await Promise.all(dto.items.map(async item => {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId }, include: { images: { take: 1 } },
      })
      const variant = item.variantId
        ? await this.prisma.productVariant.findUnique({ where: { id: item.variantId } })
        : null
      const unitPrice  = Number(variant?.price ?? product?.price ?? 0)
      const totalPrice = unitPrice * item.quantity
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity:  item.quantity,
        unitPrice,
        totalPrice,
        snapshot:  { name: product?.name, image: product?.images?.[0]?.url },
      }
    }))

    const order = await this.prisma.$transaction(async tx => {
      // Decrement stock
      for (const item of itemsData) {
        if (!item.variantId) continue
        const v = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!v || v.stock < item.quantity)
          throw new BadRequestException(`Insufficient stock for ${item.snapshot.name ?? 'item'}`)
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } })
      }
      return tx.order.create({
        data: {
          orderNumber,
          userId:        dto.userId,
          addressId:     dto.addressId,
          subtotal:      dto.subtotal,
          tax:           dto.tax,
          shippingFee:   dto.shipping,
          total:         dto.total,
          paymentMethod: 'PAY_ON_DELIVERY',
          status:        'PENDING',
          items:         { create: itemsData },
        },
        include: { items: true, user: true, address: true },
      })
    })

    return order
  }

  // ── Invoice: generate, store in R2, save to DB, email when CONFIRMED ────────
  async sendConfirmedInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id: orderId },
      include: { items: true, user: true },
    })
    if (!order) return

    try {
      const pdf = await this.invoice.generateInvoicePdf(orderId)

      // Upload PDF to R2
      const key = `invoices/${order.orderNumber}.pdf`
      await r2.send(new PutObjectCommand({
        Bucket:      process.env.R2_BUCKET_NAME,
        Key:         key,
        Body:        pdf,
        ContentType: 'application/pdf',
      }))
      const pdfUrl = `${process.env.R2_PUBLIC_CDN_URL}/${key}`

      // Save invoice record to DB (upsert so re-confirming doesn't create duplicates)
      await this.prisma.invoice.upsert({
        where:  { orderId },
        update: { pdfUrl },
        create: {
          orderId,
          userId:      order.userId,
          orderNumber: order.orderNumber,
          pdfUrl,
        },
      })

      // Fetch custom invoice template from site config if set
      const cfg = await this.prisma.siteConfig.findUnique({ where: { id: 'main' } })
      const subject = (cfg?.invoiceEmailSubject as string)?.trim()
        || `Your Murgdur invoice — ${order.orderNumber}`
      const bodyTemplate = (cfg?.invoiceEmailBody as string)?.trim()
        || `<p>Dear {{customerName}},</p><p>Thank you for your order <strong>{{orderNumber}}</strong>. Please find your invoice attached.</p><p>Total: {{total}}</p>`
      const body = bodyTemplate
        .replace(/\{\{customerName\}\}/g, order.user.firstName)
        .replace(/\{\{orderNumber\}\}/g,  order.orderNumber)
        .replace(/\{\{total\}\}/g,         `₹${Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)

      // Email to customer
      await this.email.sendEmail(
        order.user.email, subject, body,
        [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdf, contentType: 'application/pdf' }],
      )

      // Email to admin
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        await this.email.sendEmail(
          adminEmail,
          `Order Confirmed: ${order.orderNumber}`,
          `<p>Order ${order.orderNumber} confirmed for ${order.user.firstName} ${order.user.lastName}. Invoice attached.</p>`,
          [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdf, contentType: 'application/pdf' }],
        )
      }
    } catch (e) {
      console.error('Invoice generation failed:', e)
    }
  }

  // ── Standard order creation (kept for legacy; NOT used by WhatsApp flow) ──
  async createOrder(userId: string, dto: CreateOrderDto) {
    const orderNumber = `MRG-ORD-${Date.now()}`

    const items = await Promise.all(dto.items.map(async item => {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId }, include: { images: { take: 1 } } })
      const variant = item.variantId ? await this.prisma.productVariant.findUnique({ where: { id: item.variantId } }) : null
      const unitPrice = Number(variant?.price ?? product?.price ?? 0)
      return { productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity, snapshot: { name: product?.name, image: product?.images?.[0]?.url } }
    }))

    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
    const tax   = subtotal * 0.18
    const total = subtotal + tax

    const order = await this.prisma.$transaction(async tx => {
      for (const item of items) {
        if (!item.variantId) continue
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!variant || variant.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${item.snapshot.name ?? 'item'}`)
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } })
      }
      return tx.order.create({
        data: { orderNumber, userId, addressId: dto.addressId, subtotal, tax, total, paymentMethod: dto.paymentMethod ?? 'PAY_ON_DELIVERY', items: { create: items } },
        include: { items: true },
      })
    })

    return order
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } })
    if (!order) throw new NotFoundException('Order not found')
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) throw new BadRequestException('Order can no longer be cancelled')
    return this.prisma.$transaction(async tx => {
      for (const item of order.items) {
        if (!item.variantId) continue
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
      }
      return tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' }, include: { items: true } })
    })
  }

  async getOrderHistory(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'desc' } })
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true, address: true } })
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  async updatePaymentStatus(orderId: string, paymentStatus: string, paymentRef?: string) {
    return this.prisma.order.update({ where: { id: orderId }, data: { paymentStatus: paymentStatus as any, paymentRef } })
  }
}
