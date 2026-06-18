'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

// ── Context ───────────────────────────────────────────────────────────────────

interface ToastItem { id: number; message: string; type: 'success' | 'error' }
interface ToastCtx  { toast: (msg: string, type?: 'success' | 'error') => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function useAdminToast() { return useContext(Ctx) }

// ── Provider + renderer ───────────────────────────────────────────────────────

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    // Auto-dismiss after 2 seconds
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000)
  }, [])

  function dismiss(id: number) { setToasts(prev => prev.filter(t => t.id !== id)) }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}

      {/* Toast stack — bottom right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl
              border text-sm tracking-wide
              animate-[slideInRight_0.3s_ease-out]
              ${t.type === 'success'
                ? 'bg-luxury-black border-luxury-gold/40 text-luxury-white'
                : 'bg-luxury-black border-red-400/40 text-red-300'}
            `}
            style={{ minWidth: 220 }}
          >
            {t.type === 'success'
              ? <CheckCircle className="w-4 h-4 text-luxury-gold shrink-0" />
              : <X className="w-4 h-4 text-red-400 shrink-0" />
            }
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-luxury-muted hover:text-luxury-white shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
