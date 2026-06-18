'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Modal({ open, title, children, onClose, className }: { open: boolean; title: string; children: ReactNode; onClose: () => void; className?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn('w-full max-w-lg bg-ivory p-6 shadow-2xl', className)}>
        <div className="flex items-center justify-between gap-4 border-b border-mist pb-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
