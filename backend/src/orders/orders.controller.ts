import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OrdersService } from './orders.service'
import { PrismaService } from '../database/prisma.service'
import { CreateOrderDto } from './dto/create-order.dto'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private prisma: PrismaService,
  ) {}

  @Get()
  getAll(@Req() req: any) { return this.orders.getOrderHistory(req.user.id) }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.orders.getOrder(req.user.id, id)
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(req.user.id, dto)
  }

  @Patch(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.orders.cancelOrder(req.user.id, id)
  }

  // ── User invoices ─────────────────────────────────────────────────────────
  @Get('invoices/all')
  getUserInvoices(@Req() req: any) {
    return this.prisma.invoice.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
  }
}