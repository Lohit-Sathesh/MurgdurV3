import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Optional() @InjectQueue('email') private emailQueue?: Queue) {}

  private ensureQueue() {
    if (!this.emailQueue) {
      throw new Error('Email queue is not configured');
    }
    return this.emailQueue;
  }

  /**
   * Enqueue order confirmation email
   */
  async enqueueOrderConfirmation(data: {
    customerEmail: string;
    customerName: string;
    orderId: string;
    items: any[];
    totalAmount: number;
  }) {
    try {
      const queue = this.ensureQueue();
      const job = await queue.add('order-confirmation', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(`Order confirmation email queued: ${job.id}`);
      return job;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue order confirmation email: ${message}`);
      throw error;
    }
  }

  /**
   * Enqueue shipping notification email
   */
  async enqueueShippingNotification(data: {
    customerEmail: string;
    customerName: string;
    orderId: string;
    trackingNumber: string;
    carrier: string;
  }) {
    try {
      const queue = this.ensureQueue();
      const job = await queue.add('shipping-notification', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(`Shipping notification email queued: ${job.id}`);
      return job;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue shipping notification email: ${message}`);
      throw error;
    }
  }

  /**
   * Enqueue invoice email
   */
  async enqueueInvoice(data: {
    customerEmail: string;
    customerName: string;
    orderId: string;
  }) {
    try {
      const queue = this.ensureQueue();
      const job = await queue.add('invoice', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(`Invoice email queued: ${job.id}`);
      return job;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue invoice email: ${message}`);
      throw error;
    }
  }

  /**
   * Enqueue refund notification email
   */
  async enqueueRefundNotification(data: {
    customerEmail: string;
    customerName: string;
    orderId: string;
    refundAmount: number;
    reason: string;
  }) {
    try {
      const queue = this.ensureQueue();
      const job = await queue.add('refund-notification', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      this.logger.log(`Refund notification email queued: ${job.id}`);
      return job;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue refund notification email: ${message}`);
      throw error;
    }
  }
}
