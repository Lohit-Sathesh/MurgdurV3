'use client'
import { useEffect, useState } from 'react'
import { api }                  from '@/lib/api'
import { FileText, Download }   from 'lucide-react'

interface Invoice {
  id:          string
  orderNumber: string
  pdfUrl:      string
  createdAt:   string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/orders/invoices/all')
      .then(r => setInvoices(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-luxury mb-2">Invoices</h1>
      <p className="text-luxury-muted text-sm tracking-luxury mb-10">
        Invoices are generated when your order payment is confirmed.
      </p>

      {loading ? (
        <p className="text-luxury-muted text-sm">Loading…</p>
      ) : invoices.length === 0 ? (
        <div className="border border-luxury-gray p-8 text-center">
          <FileText className="w-10 h-10 text-luxury-muted/40 mx-auto mb-4" />
          <p className="text-luxury-muted text-sm">No invoices yet.</p>
          <p className="text-luxury-muted text-xs mt-1">Invoices appear here once your order is confirmed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="border border-luxury-gray p-5 flex items-center justify-between hover:border-luxury-gold/40 transition-colors">
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-luxury-gold shrink-0" />
                <div>
                  <p className="text-luxury-white text-sm font-medium tracking-wide">{inv.orderNumber}</p>
                  <p className="text-luxury-muted text-xs mt-0.5">
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <a
                href={inv.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors border border-luxury-gold/40 px-4 py-2 rounded-full hover:border-luxury-white"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
