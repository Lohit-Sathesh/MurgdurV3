'use client'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { SizeGuide, SizeGuideBlock } from '@/types/product'
import { useSiteConfig } from '@/context/SiteConfigContext'

// ── Block renderers ───────────────────────────────────────────────────────────

function ImageBlock({ block }: { block: SizeGuideBlock }) {
  if (!block.url) return null
  return (
    <div className="relative w-full rounded overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.url} alt="Size guide" className="w-full object-contain" />
    </div>
  )
}

function TableBlock({ block }: { block: SizeGuideBlock }) {
  const cols = block.columns ?? []
  const rows = block.rows   ?? []
  if (!cols.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {cols.map((col, ci) => (
              <th key={ci} className="text-left text-luxury-white text-[10px] tracking-luxury uppercase border-b border-luxury-gray py-2 pr-4 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-luxury-white/[0.02]' : ''}>
              {row.map((cell, ci) => (
                <td key={ci} className="text-luxury-muted py-2 pr-4 border-b border-luxury-gray/20">
                  {ci === 0
                    ? <span className="text-luxury-white font-medium">{cell}</span>
                    : cell
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TextBlock({ block }: { block: SizeGuideBlock }) {
  if (!block.content) return null
  return <p className="text-luxury-muted text-xs leading-relaxed">{block.content}</p>
}

// ── Drawer ────────────────────────────────────────────────────────────────────

interface Props {
  guide:   SizeGuide | null
  isOpen:  boolean
  onClose: () => void
}

export function SizeGuideDrawer({ guide, isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)
  const { sizeGuideContactText, sizeGuideContactLinkText, sizeGuideContactLinkUrl } = useSiteConfig()

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      return
    }
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const stopProp = (e: WheelEvent) => e.stopPropagation()
    const el = panelRef.current   // panel, not backdrop — wheel events bubble through panel to window
    el?.addEventListener('wheel', stopProp, { passive: true })
    return () => {
      el?.removeEventListener('wheel', stopProp)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-400 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel — slides in from right */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-luxury-black border-l border-luxury-gray z-50
                    flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0,0.15,1)]
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-luxury-gray flex-shrink-0">
          <div>
            <p className="text-luxury-muted text-[10px] tracking-luxury uppercase mb-0.5">Size Guide</p>
            <h2 className="font-serif text-xl tracking-luxury text-luxury-white">
              {guide?.name ?? ''}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close size guide"
            className="text-luxury-muted hover:text-luxury-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {guide?.blocks.map((block, i) => (
            <div key={block.id ?? i}>
              {block.type === 'image' && <ImageBlock block={block} />}
              {block.type === 'table' && <TableBlock block={block} />}
              {block.type === 'text'  && <TextBlock  block={block} />}
            </div>
          ))}

          {(!guide?.blocks.length) && (
            <p className="text-luxury-muted text-xs">No size information available for this guide yet.</p>
          )}
        </div>

        {/* Footer — text and link configurable in Admin → Theme → Content */}
        <div className="px-8 py-6 border-t border-luxury-gray flex-shrink-0">
          <p className="text-luxury-muted text-[10px] tracking-luxury leading-relaxed">
            {sizeGuideContactText}{' '}
            <a href={sizeGuideContactLinkUrl}
              className="text-luxury-white underline underline-offset-2 hover:text-luxury-gold transition-colors">
              {sizeGuideContactLinkText}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
