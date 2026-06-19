import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Returns & Exchanges',
  description: 'Returns accepted within 14 days of receipt in unworn, original condition. Learn about the Murgdur returns and exchange process.',
  alternates:  { canonical: '/returns' },
}

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <h1 className="font-serif text-5xl tracking-luxury text-luxury-white mb-12">Returns &amp; Exchanges</h1>

      <div className="space-y-10 text-luxury-muted text-sm leading-relaxed tracking-wide">
        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Return Window</p>
          <p>
            We accept returns within 14 days of delivery, provided the item is unused,
            unworn, and returned in its original packaging with all tags attached.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">How to Initiate a Return</p>
          <p>
            Go to <a href="/orders" className="text-luxury-gold hover:underline">Orders</a> in your
            account, select the order containing the item, and choose &ldquo;Cancel Order&rdquo;
            if it hasn&apos;t shipped yet, or contact our{' '}
            <a href="/contact" className="text-luxury-gold hover:underline">customer care</a> team
            to arrange a pickup for delivered items.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Refunds</p>
          <p>
            Once we receive and inspect your return, a refund will be issued to your original
            payment method within 5&ndash;7 business days. For Cash on Delivery orders, refunds
            are processed to your provided bank account.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Non-Returnable Items</p>
          <p>
            For hygiene reasons, earrings and other pierced jewellery cannot be returned unless
            defective. Items marked as Final Sale are also not eligible for return.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Exchanges</p>
          <p>
            If you&apos;d like a different size or colour, the simplest way is to return the
            original item and place a new order for the desired piece.
          </p>
        </section>
      </div>
    </div>
  )
}
