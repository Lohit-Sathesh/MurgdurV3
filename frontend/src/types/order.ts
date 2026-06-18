export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: string
  totalPrice: string
  snapshot: { name: string; image: string }
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotal: string
  tax: string
  shippingFee: string
  total: string
  currency: string
  createdAt: string
  items: OrderItem[]
}