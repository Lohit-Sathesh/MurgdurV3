import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  /**
   * Send generic email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
  ) {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
        attachments: attachments || [],
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    customerEmail: string,
    customerName: string,
    orderId: string,
    items: any[],
    totalAmount: number,
  ) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
            .total { font-size: 18px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Thank you for your purchase! Your order has been confirmed.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Items:</strong></p>
              ${items
                .map(
                  (item) => `
                <div class="item">
                  <p>${item.productName}</p>
                  <p>Quantity: ${item.quantity} x ₹${item.price}</p>
                </div>
              `,
                )
                .join('')}
              <div class="total">Total: ₹${totalAmount}</div>
              <p>Your order will be processed soon. You will receive a shipping update shortly.</p>
              <p>Thank you for shopping with Murgdur!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Murgdur. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(customerEmail, `Order Confirmation - ${orderId}`, html);
  }

  /**
   * Send shipping notification
   */
  async sendShippingNotification(
    customerEmail: string,
    customerName: string,
    orderId: string,
    trackingNumber: string,
    carrier: string,
  ) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .tracking { background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Order is On the Way!</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Great news! Your order has been shipped.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <div class="tracking">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Carrier:</strong> ${carrier}</p>
                <p>You can track your order using the tracking number above.</p>
              </div>
              <p>Thank you for shopping with Murgdur!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Murgdur. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(customerEmail, `Your order ${orderId} has been shipped!`, html);
  }

  /**
   * Send invoice email
   */
  async sendInvoice(
    customerEmail: string,
    customerName: string,
    orderId: string,
    invoicePdf: Buffer,
  ) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Please find attached your invoice for order <strong>${orderId}</strong>.</p>
              <p>Thank you for shopping with Murgdur!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Murgdur. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(customerEmail, `Invoice - Order ${orderId}`, html, [
      {
        filename: `invoice-${orderId}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      },
    ]);
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(
    customerEmail: string,
    customerName: string,
    orderId: string,
    refundAmount: number,
    reason: string,
  ) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .refund { background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Processed</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>Your refund has been processed.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <div class="refund">
                <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>The refund will be credited to your original payment method within 5-7 business days.</p>
              </div>
              <p>If you have any questions, please contact us.</p>
              <p>Thank you for shopping with Murgdur!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Murgdur. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(customerEmail, `Refund for order ${orderId}`, html);
  }

  /**
   * Send newsletter subscription welcome email
   */
  async sendNewsletterWelcome(email: string) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 30px; text-align: center; letter-spacing: 4px; }
            .content { padding: 30px; background-color: #fff; }
            .gold { color: #d4af37; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MURGDUR</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for subscribing to the <span class="gold">Murgdur</span> Private List!</p>
              <p>You'll now be the first to know about new collections, limited releases, private events, and curated editorial stories from Maison Murgdur.</p>
              <p>Welcome to the world of timeless luxury.</p>
              <p>Warm regards,<br/>The Murgdur Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Murgdur. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'Welcome to the Murgdur Private List', html);
  }

  /**
   * Send newsletter unsubscribe confirmation email
   */
  async sendNewsletterGoodbye(email: string) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 30px; text-align: center; letter-spacing: 4px; }
            .content { padding: 30px; background-color: #fff; }
            .gold { color: #d4af37; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MURGDUR</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We're sorry to see you go.</p>
              <p>You have been removed from the <span class="gold">Murgdur</span> Private List and will no longer receive news of our collections, private events, and editorial stories.</p>
              <p>Should you ever wish to return, our doors — and our private list — are always open.</p>
              <p>Until then, with warm regards,<br/>The Murgdur Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Murgdur. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'You have been unsubscribed from the Murgdur Private List', html);
  }
}
