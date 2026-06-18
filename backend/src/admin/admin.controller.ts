import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminOnly } from '../common/decorators/admin.decorator';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { SearchService } from '../search/search.service';
import { OrdersService } from '../orders/orders.service';
import { generateSku } from '../common/utils/sku';
import { slugify } from '../common/utils/slug';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly search: SearchService,
    private readonly orders: OrdersService,
  ) {}

  /**
   * Get all orders (admin or support)
   */
  @Get('orders')
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all invoices (admin)
   */
  @Get('invoices')
  @AdminOnly()
  async getAllInvoices() {
    return this.prisma.invoice.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get order details (admin or support)
   */
  @Get('orders/:orderId')
  async getOrderDetails(@Param('orderId') orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Update order status (admin or support)
   */
  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: body.status as any },
    });
    // Send invoice when admin confirms payment
    if (body.status === 'CONFIRMED') {
      this.orders.sendConfirmedInvoice(orderId).catch(() => {})
    }
    return updated;
  }

  /**
   * Get all categories, flat list with parent info (admin only)
   */
  @Get('categories')
  @AdminOnly()
  async getAllCategories() {
    return this.prisma.category.findMany({
      include: { parent: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  /**
   * Create a category or subcategory (admin only)
   */
  @Post('categories')
  @AdminOnly()
  async createCategory(@Body() body: { name: string; parentId?: string; pageType?: string; slug?: string; linkUrl?: string }) {
    let slug = body.slug ? slugify(body.slug) || slugify(body.name) : slugify(body.name) || 'category';
    const base = slug;
    let counter = 2;
    while (await this.prisma.category.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }
    const category = await this.prisma.category.create({
      data: {
        name:     body.name,
        slug,
        parentId: body.parentId || null,
        pageType: body.pageType ?? 'products',
        linkUrl:  body.linkUrl  || null,
      },
    });
    await this.redis.del('categories:tree');
    return category;
  }

  /**
   * Update a category's display details (admin only)
   */
  @Patch('categories/:id')
  @AdminOnly()
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; imageUrl?: string; pageType?: string; linkUrl?: string | null; slug?: string },
  ) {
    const data: any = { ...body }
    // Handle custom slug: sanitise and ensure uniqueness
    if (body.slug) {
      const candidate = slugify(body.slug) || body.slug
      const conflict = await this.prisma.category.findFirst({ where: { slug: candidate, NOT: { id } } })
      if (conflict) throw new BadRequestException(`Slug "${candidate}" is already in use.`)
      data.slug = candidate
    }
    const category = await this.prisma.category.update({ where: { id }, data })
    await this.redis.del('categories:tree')
    return category
  }

  /**
   * Remove a category (admin only)
   */
  @Delete('categories/:id')
  @AdminOnly()
  async deleteCategory(@Param('id') id: string) {
    const [productCount, childCount] = await Promise.all([
      this.prisma.product.count({ where: { categoryId: id } }),
      this.prisma.category.count({ where: { parentId: id } }),
    ]);

    if (productCount > 0 || childCount > 0) {
      throw new BadRequestException(
        'This category has products or subcategories and cannot be deleted. Move or remove them first.',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    await this.redis.del('categories:tree');
    return { id };
  }

  /**
   * Get highlight images for a category (admin only)
   */
  @Get('categories/:id/highlights')
  @AdminOnly()
  async getCategoryHighlights(@Param('id') id: string, @Query('placement') placement?: string) {
    return this.prisma.categoryHighlight.findMany({
      where: { categoryId: id, ...(placement ? { placement } : {}) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Add a highlight image to a category (admin only)
   */
  @Post('categories/:id/highlights')
  @AdminOnly()
  async createCategoryHighlight(@Param('id') id: string, @Body() body: {
    imageUrl: string; mediaType?: string; title?: string; subheading?: string; linkUrl?: string; sortOrder?: number; placement?: string; textTheme?: string; textPosition?: string; layout?: string; showAfterRows?: number;
  }) {
    const highlight = await this.prisma.categoryHighlight.create({
      data: {
        categoryId: id,
        imageUrl: body.imageUrl,
        mediaType: body.mediaType ?? 'image',
        title: body.title,
        subheading: body.subheading,
        linkUrl: body.linkUrl,
        sortOrder: body.sortOrder ?? 0,
        placement: body.placement ?? 'menu',
        textTheme: body.textTheme ?? 'dark',
        layout: body.layout ?? 'full',
      },
    });
    await this.redis.del('categories:tree');
    return highlight;
  }

  /**
   * Update a category highlight image (admin only)
   */
  @Patch('category-highlights/:id')
  @AdminOnly()
  async updateCategoryHighlight(@Param('id') id: string, @Body() body: {
    imageUrl?: string; mediaType?: string; title?: string; subheading?: string; linkUrl?: string; sortOrder?: number; isActive?: boolean; placement?: string; textTheme?: string; textPosition?: string; layout?: string; showAfterRows?: number;
  }) {
    const highlight = await this.prisma.categoryHighlight.update({
      where: { id },
      data: body,
    });
    await this.redis.del('categories:tree');
    return highlight;
  }

  /**
   * Get info blocks for a category (admin only)
   */
  @Get('categories/:id/info-blocks')
  @AdminOnly()
  async getCategoryInfoBlocks(@Param('id') id: string) {
    return this.prisma.categoryInfoBlock.findMany({
      where: { categoryId: id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create an info block for a category (admin only)
   */
  @Post('categories/:id/info-blocks')
  @AdminOnly()
  async createCategoryInfoBlock(@Param('id') id: string, @Body() body: {
    heading?: string; body?: string; mediaUrl?: string; mediaType?: string; textTheme?: string; layout?: string; sortOrder?: number;
  }) {
    return this.prisma.categoryInfoBlock.create({
      data: {
        categoryId: id,
        heading: body.heading,
        body: body.body,
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType ?? 'image',
        textTheme: body.textTheme ?? 'dark',
        layout: body.layout ?? 'full',
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  /**
   * Update an info block (admin only)
   */
  @Patch('category-info-blocks/:id')
  @AdminOnly()
  async updateCategoryInfoBlock(@Param('id') id: string, @Body() body: {
    heading?: string; body?: string; mediaUrl?: string; mediaType?: string; textTheme?: string; layout?: string; sortOrder?: number;
  }) {
    return this.prisma.categoryInfoBlock.update({ where: { id }, data: body });
  }

  /**
   * Delete an info block (admin only)
   */
  @Delete('category-info-blocks/:id')
  @AdminOnly()
  async deleteCategoryInfoBlock(@Param('id') id: string) {
    await this.prisma.categoryInfoBlock.delete({ where: { id } });
    return { id };
  }

  /**
   * Remove a category highlight image (admin only)
   */
  @Delete('category-highlights/:id')
  @AdminOnly()
  async deleteCategoryHighlight(@Param('id') id: string) {
    await this.prisma.categoryHighlight.delete({ where: { id } });
    await this.redis.del('categories:tree');
    return { id };
  }

  /**
   * Get all products (admin only)
   */
  @Get('products')
  @AdminOnly()
  async getAllProducts() {
    return this.prisma.product.findMany({
      include: { variants: true, category: true, images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update product fields (admin only)
   */
  @Patch('products/:id')
  @AdminOnly()
  async updateProduct(
    @Param('id') id: string,
    @Body() body: {
      name?: string; description?: string; material?: string; categoryId?: string;
      price?: number; comparePrice?: number | null; isActive?: boolean; isFeatured?: boolean;
      styleFontSize?: number | null; styleTextColor?: string | null;
      styleAccentColor?: string | null; styleBgColor?: string | null;
      sizeGuideId?: string | null; slug?: string;
    },
  ) {
    const data: any = { ...body }
    if (body.slug) {
      const candidate = slugify(body.slug) || body.slug
      const conflict = await this.prisma.product.findFirst({ where: { slug: candidate, NOT: { id } } })
      if (conflict) throw new BadRequestException(`Slug "${candidate}" is already in use.`)
      data.slug = candidate
    }
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    await this.search.syncProduct(product);
    return product;
  }

  /**
   * Remove a product from the catalog (admin only)
   */
  @Delete('products/:id')
  @AdminOnly()
  async deleteProduct(@Param('id') id: string) {
    const [orderItemCount, reviewCount] = await Promise.all([
      this.prisma.orderItem.count({ where: { productId: id } }),
      this.prisma.review.count({ where: { productId: id } }),
    ]);

    if (orderItemCount > 0 || reviewCount > 0) {
      throw new BadRequestException(
        'This product has order or review history and cannot be deleted. Deactivate it instead.',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { id };
  }

  /**
   * Add a new variant (color/size) to an existing product (admin only)
   */
  @Post('products/:id/variants')
  @AdminOnly()
  async createVariant(
    @Param('id') productId: string,
    @Body() body: { color?: string; colorHex?: string; size?: string; stock?: number; price?: number },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new BadRequestException('Product not found.');
    }
    let sku = generateSku(product.sku);
    while (await this.prisma.productVariant.findUnique({ where: { sku } })) {
      sku = generateSku(product.sku);
    }
    return this.prisma.productVariant.create({
      data: {
        productId,
        sku,
        color: body.color || null,
        colorHex: body.colorHex || null,
        size: body.size || null,
        stock: body.stock ?? 0,
        price: body.price,
      },
    });
  }

  /**
   * Update product variant fields (admin only)
   */
  @Patch('products/variants/:id')
  @AdminOnly()
  async updateVariant(
    @Param('id') id: string,
    @Body() body: { stock?: number; price?: number; isActive?: boolean; color?: string; colorHex?: string; size?: string },
  ) {
    return this.prisma.productVariant.update({
      where: { id },
      data: body,
    });
  }

  /**
   * Remove a product variant (admin only)
   */
  @Delete('products/variants/:id')
  @AdminOnly()
  async deleteVariant(@Param('id') id: string) {
    const orderItemCount = await this.prisma.orderItem.count({ where: { variantId: id } });
    if (orderItemCount > 0) {
      throw new BadRequestException(
        'This variant has order history and cannot be deleted. Deactivate it instead.',
      );
    }
    await this.prisma.productVariant.delete({ where: { id } });
    return { id };
  }

  /**
   * Get all users (admin only)
   */
  @Get('users')
  @AdminOnly()
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update user role (admin only)
   */
  @Patch('users/:userId/role')
  @AdminOnly()
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: 'CUSTOMER' | 'ADMIN' | 'SUPPORT' },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  /**
   * Get dashboard analytics (admin only)
   */
  @Get('analytics/dashboard')
  @AdminOnly()
  async getDashboardAnalytics() {
    const totalOrders = await this.prisma.order.count();
    const totalRevenue = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: 'CONFIRMED',
      },
    });
    const totalUsers = await this.prisma.user.count();
    const totalProducts = await this.prisma.product.count();

    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalUsers,
      totalProducts,
      recentOrders,
    };
  }

  /**
   * Get sales by date range (admin only)
   */
  @Post('analytics/sales')
  @AdminOnly()
  async getSalesByDateRange(@Body() body: { startDate: Date; endDate: Date }) {
    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(body.startDate),
          lte: new Date(body.endDate),
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Get top selling products (admin only)
   */
  @Get('analytics/top-products')
  @AdminOnly()
  async getTopSellingProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        orderItems: {
          select: {
            quantity: true,
          },
        },
      },
    });

    return products
      .map((product: any) => ({
        ...product,
        totalSold: product.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
      }))
      .sort((a: any, b: any) => b.totalSold - a.totalSold)
      .slice(0, 10);
  }

  /**
   * Get inventory status (admin only)
   */
  @Get('inventory')
  @AdminOnly()
  async getInventoryStatus() {
    return this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
      },
    });
  }

  /**
   * Rebuild the search index from the database (admin only)
   */
  @Post('search/reindex')
  @AdminOnly()
  async reindexSearch() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    await this.search.reindexAll(products);
    return { reindexed: products.length };
  }

  // ── Homepage Blocks (page builder) ──────────────────────────────────────────

  @Get('homepage-blocks')
  @AdminOnly()
  getBlocks() {
    return this.prisma.homepageBlock.findMany({ orderBy: { sortOrder: 'asc' } })
  }

  @Post('homepage-blocks')
  @AdminOnly()
  createBlock(@Body() body: { type: string; sortOrder?: number; content?: any }) {
    return this.prisma.homepageBlock.create({
      data: { type: body.type, sortOrder: body.sortOrder ?? 0, content: body.content ?? {} },
    })
  }

  @Patch('homepage-blocks/:id')
  @AdminOnly()
  updateBlock(@Param('id') id: string, @Body() body: { sortOrder?: number; isActive?: boolean; content?: any }) {
    return this.prisma.homepageBlock.update({ where: { id }, data: body })
  }

  @Delete('homepage-blocks/:id')
  @AdminOnly()
  deleteBlock(@Param('id') id: string) {
    return this.prisma.homepageBlock.delete({ where: { id } })
  }

  /**
   * Get all homepage slides (admin only)
   */
  @Get('homepage-slides')
  @AdminOnly()
  async getHomepageSlides() {
    return this.prisma.homepageSlide.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create a homepage slide (admin only)
   */
  @Post('homepage-slides')
  @AdminOnly()
  async createHomepageSlide(@Body() body: {
    mediaUrl: string; mediaType?: string; placement?: string; headline?: string; subheading?: string; linkUrl?: string; sortOrder?: number; textTheme?: string; textPosition?: string;
  }) {
    return this.prisma.homepageSlide.create({
      data: {
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType ?? 'image',
        placement: body.placement ?? 'hero',
        headline: body.headline,
        subheading: body.subheading,
        linkUrl: body.linkUrl,
        sortOrder: body.sortOrder ?? 0,
        textTheme: body.textTheme ?? 'dark',
      },
    });
  }

  /**
   * Update a homepage slide (admin only)
   */
  @Patch('homepage-slides/:id')
  @AdminOnly()
  async updateHomepageSlide(@Param('id') id: string, @Body() body: {
    mediaUrl?: string; mediaType?: string; placement?: string; headline?: string; subheading?: string; linkUrl?: string; sortOrder?: number; isActive?: boolean; textTheme?: string; textPosition?: string;
  }) {
    return this.prisma.homepageSlide.update({
      where: { id },
      data: body,
    });
  }

  /**
   * Remove a homepage slide (admin only)
   */
  @Delete('homepage-slides/:id')
  @AdminOnly()
  async deleteHomepageSlide(@Param('id') id: string) {
    await this.prisma.homepageSlide.delete({ where: { id } });
    return { id };
  }
}