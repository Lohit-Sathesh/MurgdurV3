import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postal: string;
}

export interface ShippingOrder {
  orderId: string;
  productName: string;
  quantity: number;
  weight: number; // in kg
  price: number;
  customerAddress: ShippingAddress;
}

export interface ShippingResponse {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
  status: string;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  private shiprocketClient: AxiosInstance;
  private provider: 'shiprocket' | 'delhivery' | 'bluedart';

  constructor(private readonly configService: ConfigService) {
    this.provider = 'shiprocket'; // Default provider

    // Initialize Shiprocket client
    this.shiprocketClient = axios.create({
      baseURL: 'https://apiv2.shiprocket.in/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create shipment with Shiprocket
   */
  async createShipmentShiprocket(shippingOrder: ShippingOrder): Promise<ShippingResponse> {
    try {
      const token = await this.getShiprocketToken();

      const payload = {
        order_id: shippingOrder.orderId,
        order_date: new Date().toISOString(),
        pickup_location_id: '123456', // Your Shiprocket pickup location ID
        billing_customer_name: shippingOrder.customerAddress.name,
        billing_last_name: '',
        billing_email: shippingOrder.customerAddress.email,
        billing_phone: shippingOrder.customerAddress.phone,
        billing_address: shippingOrder.customerAddress.line1,
        billing_address_2: shippingOrder.customerAddress.line2 || '',
        billing_city: shippingOrder.customerAddress.city,
        billing_state: shippingOrder.customerAddress.state,
        billing_country: shippingOrder.customerAddress.country,
        billing_pincode: shippingOrder.customerAddress.postal,
        shipping_is_default: true,
        shipping_customer_name: shippingOrder.customerAddress.name,
        shipping_last_name: '',
        shipping_email: shippingOrder.customerAddress.email,
        shipping_phone: shippingOrder.customerAddress.phone,
        shipping_address: shippingOrder.customerAddress.line1,
        shipping_address_2: shippingOrder.customerAddress.line2 || '',
        shipping_city: shippingOrder.customerAddress.city,
        shipping_state: shippingOrder.customerAddress.state,
        shipping_country: shippingOrder.customerAddress.country,
        shipping_pincode: shippingOrder.customerAddress.postal,
        order_items: [
          {
            name: shippingOrder.productName,
            sku: shippingOrder.orderId,
            units: shippingOrder.quantity,
            selling_price: shippingOrder.price,
          },
        ],
        payment_method: 'Prepaid',
        sub_total: shippingOrder.price * shippingOrder.quantity,
        length: 10,
        breadth: 10,
        height: 10,
        weight: shippingOrder.weight,
      };

      const response = await this.shiprocketClient.post('/external/orders/create/adhoc', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const trackingNumber = response.data.data.shipments[0].shipment_id;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // Assume 5 days delivery

      this.logger.log(`Shiprocket shipment created: ${trackingNumber}`);

      return {
        trackingNumber,
        carrier: 'Shiprocket',
        estimatedDelivery,
        status: 'created',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Shiprocket shipment: ${message}`);
      throw new BadRequestException('Failed to create shipment');
    }
  }

  /**
   * Create shipment with Delhivery
   */
  async createShipmentDelhivery(shippingOrder: ShippingOrder): Promise<ShippingResponse> {
    try {
      const payload = {
        pickup_location_id: 'MRG001', // Your Delhivery pickup location
        order_id: shippingOrder.orderId,
        customer_name: shippingOrder.customerAddress.name,
        customer_email: shippingOrder.customerAddress.email,
        customer_phone: shippingOrder.customerAddress.phone,
        delivery_address: `${shippingOrder.customerAddress.line1}, ${shippingOrder.customerAddress.line2 || ''}, ${shippingOrder.customerAddress.city}, ${shippingOrder.customerAddress.state}, ${shippingOrder.customerAddress.postal}`,
        delivery_city: shippingOrder.customerAddress.city,
        delivery_state: shippingOrder.customerAddress.state,
        delivery_pincode: shippingOrder.customerAddress.postal,
        order_date: new Date().toISOString(),
        product_description: shippingOrder.productName,
        product_quantity: shippingOrder.quantity,
        product_weight: shippingOrder.weight,
        order_value: shippingOrder.price * shippingOrder.quantity,
        payment_mode: 'Prepaid',
      };

      // TODO: Implement actual Delhivery API call
      // For now, return mock response
      const trackingNumber = `DHL${Date.now()}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 4); // 4 days delivery

      this.logger.log(`Delhivery shipment created: ${trackingNumber}`);

      return {
        trackingNumber,
        carrier: 'Delhivery',
        estimatedDelivery,
        status: 'created',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Delhivery shipment: ${message}`);
      throw new BadRequestException('Failed to create shipment');
    }
  }

  /**
   * Create shipment with BlueDart
   */
  async createShipmentBlueDart(shippingOrder: ShippingOrder): Promise<ShippingResponse> {
    try {
      const payload = {
        order_id: shippingOrder.orderId,
        customer_name: shippingOrder.customerAddress.name,
        customer_email: shippingOrder.customerAddress.email,
        customer_phone: shippingOrder.customerAddress.phone,
        delivery_address: `${shippingOrder.customerAddress.line1}, ${shippingOrder.customerAddress.city}`,
        delivery_pincode: shippingOrder.customerAddress.postal,
        product_name: shippingOrder.productName,
        product_weight: shippingOrder.weight,
        order_value: shippingOrder.price * shippingOrder.quantity,
      };

      // TODO: Implement actual BlueDart API call
      // For now, return mock response
      const trackingNumber = `BDE${Date.now()}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 days delivery

      this.logger.log(`BlueDart shipment created: ${trackingNumber}`);

      return {
        trackingNumber,
        carrier: 'BlueDart',
        estimatedDelivery,
        status: 'created',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create BlueDart shipment: ${message}`);
      throw new BadRequestException('Failed to create shipment');
    }
  }

  /**
   * Create shipment with default provider
   */
  async createShipment(shippingOrder: ShippingOrder): Promise<ShippingResponse> {
    switch (this.provider) {
      case 'shiprocket':
        return this.createShipmentShiprocket(shippingOrder);
      case 'delhivery':
        return this.createShipmentDelhivery(shippingOrder);
      case 'bluedart':
        return this.createShipmentBlueDart(shippingOrder);
      default:
        throw new BadRequestException(`Unsupported delivery provider: ${this.provider}`);
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const token = await this.getShiprocketToken();

      const response = await this.shiprocketClient.get(
        `/external/shipments/track`,
        {
          params: {
            shipment_id: trackingNumber,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.tracking_data || {};
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to track shipment: ${message}`);
      throw new BadRequestException('Failed to track shipment');
    }
  }

  /**
   * Handle delivery webhook
   */
  async handleWebhook(provider: string, event: string, payload: any) {
    try {
      this.logger.log(`Webhook received from ${provider}: ${event}`);

      switch (provider) {
        case 'shiprocket':
          await this.handleShiprocketWebhook(event, payload);
          break;
        case 'delhivery':
          await this.handleDelhiveryWebhook(event, payload);
          break;
        case 'bluedart':
          await this.handleBlueDartWebhook(event, payload);
          break;
        default:
          this.logger.warn(`Unhandled delivery provider: ${provider}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Webhook handling failed: ${message}`);
      throw error;
    }
  }

  private async handleShiprocketWebhook(event: string, payload: any) {
    // Handle Shiprocket events
    this.logger.log(`Handling Shiprocket event: ${event}`);
  }

  private async handleDelhiveryWebhook(event: string, payload: any) {
    // Handle Delhivery events
    this.logger.log(`Handling Delhivery event: ${event}`);
  }

  private async handleBlueDartWebhook(event: string, payload: any) {
    // Handle BlueDart events
    this.logger.log(`Handling BlueDart event: ${event}`);
  }

  /**
   * Get Shiprocket authentication token
   */
  private async getShiprocketToken(): Promise<string> {
    try {
      const response = await this.shiprocketClient.post('/external/auth/login', {
        email: this.configService.get<string>('SHIPROCKET_EMAIL'),
        password: this.configService.get<string>('SHIPROCKET_PASSWORD'),
      });

      if (!response.data.success) {
        throw new Error('Failed to authenticate with Shiprocket');
      }

      return response.data.data.token;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get Shiprocket token: ${message}`);
      throw error;
    }
  }
}
