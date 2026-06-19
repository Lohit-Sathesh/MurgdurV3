import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Shipping Information',
  description: 'Complimentary delivery on all Murgdur orders. Learn about our shipping times, delivery partners, and international shipping options.',
  alternates:  { canonical: '/shipping' },
}

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <h1 className="font-serif text-5xl tracking-luxury text-luxury-white mb-12">Shipping Information</h1>

      <div className="space-y-10 text-luxury-muted text-sm leading-relaxed tracking-wide">
        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Delivery Times</p>
          <p>
            Orders within India are typically delivered within 3&ndash;7 business days of dispatch.
            International orders may take 7&ndash;14 business days depending on destination and
            customs processing.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Shipping Charges</p>
          <p>
            Complimentary standard shipping is offered on all domestic orders above &#8377;5,000.
            Orders below this amount incur a flat shipping fee of &#8377;199. Express shipping
            options are available at checkout for an additional charge.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Order Tracking</p>
          <p>
            Once your order is dispatched, you will receive an email with tracking details.
            You can also view the live status of your order from the{' '}
            <a href="/orders" className="text-luxury-gold hover:underline">Orders</a> section of your account.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Packaging</p>
          <p>
            Every Murgdur order is carefully packaged in our signature boxes with protective
            wrapping to ensure your pieces arrive in pristine condition.
          </p>
        </section>
      </div>
    </div>
  )
}
