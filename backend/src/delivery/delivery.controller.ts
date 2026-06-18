import { Controller, Post, Get, Param, Body, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { DeliveryService, ShippingOrder, ShippingResponse } from './delivery.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /**
   * Create shipment (admin only)
   */
  @Post('shipments')
  @Roles('admin')
  async createShipment(@Body() shippingOrder: ShippingOrder): Promise<ShippingResponse> {
    return this.deliveryService.createShipment(shippingOrder);
  }

  /**
   * Track shipment (public)
   */
  @Get('track/:trackingNumber')
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.deliveryService.trackShipment(trackingNumber);
  }

  /**
   * Delivery provider webhooks
   */
  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers('x-webhook-event') event: string,
    @Body() payload: any,
  ) {
    if (!event) {
      throw new BadRequestException('Missing webhook event header');
    }

    await this.deliveryService.handleWebhook(provider, event, payload);
    return { success: true };
  }
}
