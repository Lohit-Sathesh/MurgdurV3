import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductQueryDto } from './dto/product-query.dto'
import { CreateProductDto } from './dto/create-product.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get('categories')
  getCategories() { return this.products.getCategories() }

  @Get('filters')
  getFilters(@Query('category') category?: string) { return this.products.getFilters(category) }

  @Get()
  findAll(@Query() query: ProductQueryDto) { return this.products.findAll(query) }

  @Get(':slug')
  findOne(@Param('slug') slug: string) { return this.products.findBySlug(slug) }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) { return this.products.create(dto) }
}