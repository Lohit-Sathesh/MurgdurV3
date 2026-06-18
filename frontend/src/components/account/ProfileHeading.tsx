'use client'
import { useTextStyle } from '@/context/SiteConfigContext'

export function ProfileHeading({ customerId }: { customerId?: string }) {
  const s = useTextStyle('profile')
  return (
    <div style={s}>
      <h1 className="font-serif text-3xl tracking-luxury mb-2">Profile</h1>
      {customerId && (
        <p className="text-luxury-muted text-sm tracking-luxury mb-12">
          Customer ID: {customerId}
        </p>
      )}
    </div>
  )
}
