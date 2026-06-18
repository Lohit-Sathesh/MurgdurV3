'use client'
import { signOut } from 'next-auth/react'

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className={className ?? 'text-luxury-white hover:text-luxury-gold transition-colors text-sm tracking-luxury'}
    >
      Logout
    </button>
  )
}
