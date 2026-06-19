import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Contact Us',
  description: 'Get in touch with Murgdur. Our team is available to assist with orders, styling advice, sizing, and any other enquiries.',
  alternates:  { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <h1 className="font-serif text-5xl tracking-luxury text-luxury-white mb-12">Contact Us</h1>

      <div className="space-y-10 text-luxury-muted text-sm leading-relaxed tracking-wide">
        <p>
          We&apos;d love to hear from you. Whether you have a question about an order,
          a product, or simply want to share feedback, our team is here to help.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Customer Care</p>
            <p>Email: <a href="mailto:care@murgdur.com" className="text-luxury-gold hover:underline">care@murgdur.com</a></p>
            <p>Phone: +91 98765 43210</p>
            <p>Hours: Mon&ndash;Sat, 10:00 AM &ndash; 7:00 PM IST</p>
          </div>

          <div>
            <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Head Office</p>
            <p>Murgdur Pvt. Ltd.</p>
            <p>4th Floor, Aurum Towers</p>
            <p>Bandra Kurla Complex, Mumbai 400051</p>
            <p>India</p>
          </div>
        </div>

        <div>
          <p className="text-luxury-white text-xs tracking-luxury uppercase mb-3">Press &amp; Partnerships</p>
          <p>Email: <a href="mailto:press@murgdur.com" className="text-luxury-gold hover:underline">press@murgdur.com</a></p>
        </div>
      </div>
    </div>
  )
}
