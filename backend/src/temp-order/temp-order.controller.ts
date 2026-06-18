import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard }   from '../common/guards/admin.guard'
import { TempOrderService, CreateTempOrderDto } from './temp-order.service'

@Controller('temp-orders')
export class TempOrderController {
  constructor(private svc: TempOrderService) {}

  // ── Customer: create a temp order when they start WhatsApp flow ──────────
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: Omit<CreateTempOrderDto, 'userId'>, @Req() req: any) {
    return this.svc.create({ ...body, userId: req.user.id })
  }

  // ── Admin: look up a temp order by its 6-digit ID ────────────────────────
  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findById(@Param('id') id: string) {
    return this.svc.findById(id)
  }

  // ── Admin: convert temp order → real order ───────────────────────────────
  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  activate(@Param('id') id: string) {
    return this.svc.activate(id)
  }
}
