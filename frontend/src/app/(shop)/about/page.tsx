import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'About Us',
  description: 'Founded in 2018, Murgdur is a luxury fashion house dedicated to crafting timeless pieces. Learn about our philosophy, craftsmanship, and commitment to sustainability.',
  alternates:  { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <h1 className="font-serif text-5xl tracking-luxury text-luxury-white mb-12">About Murgdur</h1>

      <div className="space-y-10 text-luxury-muted text-sm leading-relaxed tracking-wide">
        <p>
          Founded in 2018, Murgdur is a luxury fashion house dedicated to crafting timeless
          pieces for the modern wardrobe. From ready-to-wear collections to statement bags
          and accessories, every Murgdur piece is designed in-house and produced in limited
          runs to preserve exclusivity and quality.
        </p>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Our Philosophy</p>
          <p>
            We believe luxury should be quiet but unmistakable. Our design studio draws on
            classic silhouettes and reinterprets them with modern materials, ethical
            sourcing, and meticulous craftsmanship &mdash; built to last well beyond a season.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Craftsmanship</p>
          <p>
            Each collection is produced in small batches by artisans we&apos;ve partnered
            with for years. From hand-stitched leather goods to precision tailoring, quality
            control happens at every stage before a piece ever reaches you.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Sustainability</p>
          <p>
            We are committed to reducing our environmental footprint &mdash; from responsibly
            sourced materials to recyclable packaging, and a take-back programme for
            pre-loved Murgdur pieces.
          </p>
        </section>

        <section>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Visit Us</p>
          <p>
            Murgdur Pvt. Ltd., 4th Floor, Aurum Towers, Bandra Kurla Complex, Mumbai 400051, India.
          </p>
        </section>
      </div>
    </div>
  )
}
