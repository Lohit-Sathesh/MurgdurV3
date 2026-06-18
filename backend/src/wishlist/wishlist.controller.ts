import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WishlistService } from './wishlist.service'

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlist: WishlistService) {}

  @Get()
  get(@Req() req: any) { return this.wishlist.getWishlist(req.user.id) }

  @Post()
  add(@Req() req: any, @Body('productId') productId: string) {
    return this.wishlist.addToWishlist(req.user.id, productId)
  }

  @Delete(':productId')
  remove(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlist.removeFromWishlist(req.user.id, productId)
  }
}