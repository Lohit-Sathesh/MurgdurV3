import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { OrdersService } from '../orders/orders.service'

export interface TempOrderItem {
  productId: string
  variantId: string | null
  productName: string
  productSku:  string
  quantity:    number
  unitPrice:   number
  totalPrice:  number
  image:       string
  color?:      string
  size?:       string
}

export interface CreateTempOrderDto {
  userId:       string
  addressId:    string
  customerName: string
  items:        TempOrderItem[]
  subtotal:     number
  tax:          number
  shipping:     number
  total:        number
}

@Injectable()
export class TempOrderService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
  ) {}

  // Run cleanup once on startup, then every 24 hours
  onModuleInit() {
    this.deleteExpired().catch(() => {})
    setInterval(() => this.deleteExpired().catch(() => {}), 24 * 60 * 60 * 1000)
  }

  /** Generate a unique 6-digit temp ID */
  private async generateId(): Promise<string> {
    let id: string
    let attempts = 0
    do {
      id = Math.floor(100000 + Math.random() * 900000).toString()
      attempts++
      if (attempts > 20) throw new Error('Unable to generate unique temp ID')
    } while (await this.prisma.tempOrder.findUnique({ where: { id } }))
    return id
  }

  async create(dto: CreateTempOrderDto) {
    const id        = await this.generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return this.prisma.tempOrder.create({
      data: {
        id,
        userId:       dto.userId,
        addressId:    dto.addressId,
        customerName: dto.customerName,
        items:        dto.items as any,
        subtotal:     dto.subtotal,
        tax:          dto.tax,
        shipping:     dto.shipping,
        total:        dto.total,
        expiresAt,
      },
    })
  }

  async findById(id: string) {
    const temp = await this.prisma.tempOrder.findUnique({ where: { id }, include: { user: true } })
    if (!temp) throw new NotFoundException(`Temp order ${id} not found.`)
    if (temp.expiresAt < new Date()) {
      await this.prisma.tempOrder.delete({ where: { id } })
      throw new NotFoundException(`Temp order ${id} has expired.`)
    }
    return temp
  }

  /** Admin activates a temp order → creates a real order and deletes the temp record */
  async activate(tempId: string) {
    const temp = await this.findById(tempId)
    const items = temp.items as unknown as TempOrderItem[]

    // Create the real order via the orders service
    const order = await this.orders.createFromTemp({
      userId:       temp.userId,
      addressId:    temp.addressId,
      items:        items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity:  i.quantity,
      })),
      subtotal: temp.subtotal,
      tax:      temp.tax,
      shipping: temp.shipping,
      total:    temp.total,
    })

    // Delete the temp record
    await this.prisma.tempOrder.delete({ where: { id: tempId } })

    return order
  }

  /** Cron: delete all expired temp orders (called by JobsService) */
  async deleteExpired() {
    const result = await this.prisma.tempOrder.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return result.count
  }
}
