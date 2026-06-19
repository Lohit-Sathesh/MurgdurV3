import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import PDFDocument = require('pdfkit');
import * as https from 'https';
import * as http  from 'http';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate invoice as HTML
   */
  async generateInvoiceHtml(orderId: string): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${item.price * item.quantity}</td>
      </tr>
    `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .company-info h1 { font-size: 28px; font-weight: bold; }
          .invoice-info { text-align: right; }
          .invoice-info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #000; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .totals { margin-left: auto; width: 300px; margin-top: 30px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <h1>MURGDUR</h1>
              <p>Luxury e-commerce platform</p>
            </div>
            <div class="invoice-info">
              <p><strong>INVOICE</strong></p>
              <p>Invoice ID: ${order.id}</p>
              <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div style="margin: 30px 0;">
            <h3>Bill To:</h3>
            <p>${order.user.firstName} ${order.user.lastName}</p>
            <p>${order.user.email}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹${order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)}</span>
            </div>
            <div class="totals-row">
              <span>Tax (0%):</span>
              <span>₹0</span>
            </div>
            <div class="totals-row total-final">
              <span>Total:</span>
              <span>₹${order.total}</span>
            </div>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Murgdur. All rights reserved.</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate invoice as PDF
   */
  /** Download a remote image URL into a Buffer (for logo in PDF) */
  private fetchImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const proto = url.startsWith('https') ? https : http
      proto.get(url, res => {
        const chunks: Buffer[] = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    })
  }

  async generateInvoicePdf(orderId: string): Promise<Buffer> {
    const [order, cfg] = await Promise.all([
      this.prisma.order.findUnique({
        where:   { id: orderId },
        include: { items: true, user: true, address: true },
      }),
      this.prisma.siteConfig.findUnique({ where: { id: 'main' } }),
    ])

    if (!order) throw new Error('Order not found')

    const companyName    = (cfg?.invoiceCompanyName    as string) || 'Murgdur'
    const companyAddress = (cfg?.invoiceCompanyAddress as string) || ''
    const footerText     = (cfg?.invoiceFooterText     as string) || 'Thank you for shopping with Murgdur!'
    const logoUrl        = (cfg?.invoiceLogoUrl        as string) || ''

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // ── Logo ──
    if (logoUrl) {
      try {
        const logoBuffer = await this.fetchImage(logoUrl)
        doc.image(logoBuffer, 50, 45, { width: 80, height: 40, fit: [80, 40] })
        doc.moveDown(2)
      } catch {}
    }

    doc.fontSize(20).text(companyName, { align: 'left' });
    if (companyAddress) doc.fontSize(9).text(companyAddress, { align: 'left' })
    doc.fontSize(10).text('Luxury fashion. Crafted for the extraordinary.');
    doc.moveDown();

    doc.fontSize(14).text('INVOICE', { align: 'right' });
    doc.fontSize(10)
      .text(`Order Number: ${order.orderNumber}`, { align: 'right' })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(`${order.user.firstName} ${order.user.lastName}`);
    doc.text(`Customer ID: ${order.user.customerId}`);
    doc.text(order.user.email);
    if (order.address) {
      doc.text(`${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}`);
      doc.text(`${order.address.city}, ${order.address.state} ${order.address.postalCode}`);
    }
    doc.moveDown();

    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Product', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Unit Price', 370, tableTop);
    doc.text('Total', 470, tableTop);
    doc.font('Helvetica');
    doc.moveDown();

    for (const item of order.items) {
      const snapshot = item.snapshot as any;
      const y = doc.y;
      doc.text(snapshot?.name ?? 'Item', 50, y, { width: 240 });
      doc.text(String(item.quantity), 300, y);
      doc.text(`Rs. ${Number(item.unitPrice).toFixed(2)}`, 370, y);
      doc.text(`Rs. ${Number(item.totalPrice).toFixed(2)}`, 470, y);
      doc.moveDown();
    }

    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text(`Subtotal: Rs. ${Number(order.subtotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Tax: Rs. ${Number(order.tax).toFixed(2)}`, { align: 'right' });
    doc.text(`Shipping: Rs. ${Number(order.shippingFee).toFixed(2)}`, { align: 'right' });
    doc.fontSize(12).text(`Total: Rs. ${Number(order.total).toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').text(footerText, { align: 'center' });

    doc.end();
    return done;
  }
}