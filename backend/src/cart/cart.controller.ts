import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CartService, UpsertItemDto } from './cart.service'

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  getCart(@Req() req: any) {
    return this.cart.getCart(req.user.id)
  }

  @Post('items')
  addItem(@Req() req: any, @Body() dto: UpsertItemDto) {
    return this.cart.addItem(req.user.id, dto)
  }

  @Patch('items/:id')
  updateItem(@Req() req: any, @Param('id') id: string, @Body('quantity') quantity: number) {
    return this.cart.updateItem(req.user.id, id, quantity)
  }

  @Delete('items/:id')
  removeItem(@Req() req: any, @Param('id') id: string) {
    return this.cart.removeItem(req.user.id, id)
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cart.clearCart(req.user.id)
  }

  /** Called after login to merge guest cart items into the server cart */
  @Post('merge')
  mergeItems(@Req() req: any, @Body('items') items: UpsertItemDto[]) {
    return this.cart.mergeItems(req.user.id, items ?? [])
  }
}
