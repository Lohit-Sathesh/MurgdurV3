'use client'
import type { Address } from '@/types/user'

export function AddressCard({ address, onEdit, onDelete }: { address: Address; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="border border-luxury-gray p-6 space-y-2">
      {address.isDefault && (
        <span className="text-luxury-gold text-xs tracking-luxury uppercase">Default</span>
      )}
      {address.label && (
        <p className="text-luxury-white text-sm tracking-wide">{address.label}</p>
      )}
      <p className="text-luxury-muted text-sm">
        {address.firstName} {address.lastName}
      </p>
      <p className="text-luxury-muted text-sm">{address.line1}</p>
      {address.line2 && <p className="text-luxury-muted text-sm">{address.line2}</p>}
      <p className="text-luxury-muted text-sm">
        {address.city}, {address.state} {address.postalCode}
      </p>
      {address.phone && <p className="text-luxury-muted text-sm">{address.phone}</p>}
      <div className="flex gap-4 mt-2">
        {onEdit && (
          <button onClick={onEdit}
            className="text-luxury-gold text-xs tracking-luxury uppercase hover:text-luxury-white transition-colors">
            Edit
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete}
            className="text-luxury-muted text-xs tracking-luxury uppercase hover:text-red-400 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}