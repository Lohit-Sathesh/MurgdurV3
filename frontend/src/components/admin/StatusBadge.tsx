const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-amber-400/10 text-amber-400 border-amber-400/30',
  CONFIRMED:  'bg-blue-400/10 text-blue-400 border-blue-400/30',
  PROCESSING: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  SHIPPED:    'bg-purple-400/10 text-purple-400 border-purple-400/30',
  DELIVERED:  'bg-green-400/10 text-green-400 border-green-400/30',
  CANCELLED:  'bg-red-400/10 text-red-400 border-red-400/30',
  REFUNDED:   'bg-luxury-muted/10 text-luxury-muted border-luxury-muted/30',
  PAID:       'bg-green-400/10 text-green-400 border-green-400/30',
  FAILED:     'bg-red-400/10 text-red-400 border-red-400/30',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 text-xs uppercase tracking-luxury border rounded-sm ${
      STATUS_STYLES[status] ?? 'bg-luxury-white/5 text-luxury-white border-luxury-gray'
    }`}>
      {status}
    </span>
  )
}
