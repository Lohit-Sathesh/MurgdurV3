'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { AdminNavLink }    from './AdminNavLink'
import { AdminSidebarLogo } from './AdminSidebarLogo'
import { LogoutButton }    from '@/components/account/LogoutButton'

interface NavItem { href: string; label: string; icon: React.ReactNode }

interface Props {
  nav:       NavItem[]
  user:      { name?: string; email?: string } | null
  children:  React.ReactNode
}

export function AdminShell({ nav, user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebar = (
    <div className="flex flex-col h-full p-6 md:p-8">
      <AdminSidebarLogo />
      <nav className="mt-8 md:mt-12 flex flex-col gap-1 text-sm uppercase tracking-luxury">
        {nav.map(({ href, label, icon }) => (
          <div key={href} onClick={() => setSidebarOpen(false)}>
            <AdminNavLink href={href} label={label} icon={icon} />
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-luxury-gray space-y-3">
        {user && (
          <div className="mb-2">
            <p className="text-luxury-white text-sm truncate">{user.name ?? user.email}</p>
            <p className="text-luxury-muted text-xs truncate">{user.email}</p>
          </div>
        )}
        <Link href="/" className="block text-sm tracking-wide text-luxury-muted hover:text-luxury-gold transition-colors">
          Back to Site
        </Link>
        <LogoutButton className="block text-sm tracking-wide text-luxury-white hover:text-luxury-gold transition-colors" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-white">

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-luxury-black/95 backdrop-blur border-b border-luxury-gray flex items-center justify-between px-4 h-14">
        <AdminSidebarLogo />
        <button onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu"
          className="text-luxury-white hover:text-luxury-gold transition-colors">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile sidebar drawer ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-luxury-black border-r border-luxury-gray h-full pt-14 overflow-y-auto">
            {sidebar}
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Desktop layout ───────────────────────────────────────────────── */}
      <div className="md:grid md:grid-cols-[260px_1fr] md:min-h-screen">

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:flex flex-col border-r border-luxury-gray md:fixed md:h-screen md:w-[260px]">
          {sidebar}
        </aside>

        {/* Content */}
        <main className="pt-14 md:pt-0 p-4 md:p-8 lg:p-12 max-w-6xl md:col-start-2">
          {children}
        </main>
      </div>
    </div>
  )
}
