'use client'
import { useEffect, useState } from 'react'
import { api }                 from '@/lib/api'
import { FileText, Download }  from 'lucide-react'

interface AdminInvoice {
  id:          string
  orderNumber: string
  pdfUrl:      string
  createdAt:   string
  user: { firstName: string; lastName: string; email: string }
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    api.get('/admin/invoices')
      .then(r => setInvoices(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    return !q ||
      inv.orderNumber.toLowerCase().includes(q) ||
      inv.user.email.toLowerCase().includes(q) ||
      `${inv.user.firstName} ${inv.user.lastName}`.toLowerCase().includes(q)
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl tracking-luxury">Invoices</h1>
        <p className="text-luxury-muted text-sm mt-1 tracking-luxury">
          All invoices generated when orders are marked "Confirmed (payment received)".
        </p>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by order number, customer name or email…"
        className="w-full max-w-md bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-4 py-2.5 outline-none focus:border-luxury-gold rounded-lg"
      />

      {loading ? (
        <p className="text-luxury-muted text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-luxury-gray p-8 text-center">
          <FileText className="w-10 h-10 text-luxury-muted/40 mx-auto mb-4" />
          <p className="text-luxury-muted text-sm">No invoices found.</p>
        </div>
      ) : (
        <div className="border border-luxury-gray overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-luxury-muted uppercase text-xs tracking-luxury border-b border-luxury-gray bg-luxury-white/[0.02]">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-luxury-gray/50 last:border-0 hover:bg-luxury-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-luxury-gold font-medium">{inv.orderNumber}</td>
                  <td className="py-3 px-4">
                    <p className="text-luxury-white">{inv.user.firstName} {inv.user.lastName}</p>
                    <p className="text-luxury-muted text-xs">{inv.user.email}</p>
                  </td>
                  <td className="py-3 px-4 text-luxury-muted">
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-luxury-muted text-xs px-4 py-3 border-t border-luxury-gray/30">
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
        </div>
      )}
    </section>
  )
}
