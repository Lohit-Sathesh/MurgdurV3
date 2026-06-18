'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/types/product'

const AUTO_SLIDE_INTERVAL = 4000

export function ProductImageGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused || images?.length <= 1) return
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % images.length)
    }, AUTO_SLIDE_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, images?.length])

  if (!images?.length) return <div className="aspect-[3/4] bg-luxury-gray" />

  return (
    <div className="flex gap-4">
      {images.length > 1 && (
        <div className="flex flex-col gap-3 w-16">
          {images.slice(0, 6).map((img, i) => (
            <button key={img.id} onClick={() => setActive(i)}
              className={`relative aspect-square border transition-all overflow-hidden ${
                i === active ? 'border-luxury-gold' : 'border-luxury-gray hover:border-luxury-white'
              }`}>
              {img.isVideo ? (
                <video src={img.url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <Image src={img.url} alt={img.altText ?? ''} fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 aspect-[3/4] overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        {images.map((img, i) => (
          img.isVideo ? (
            <video key={img.id} src={img.url} muted loop autoPlay playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`} />
          ) : (
            <Image key={img.id} src={img.url} alt={img.altText ?? ''}
              fill
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
              priority={i === 0} />
          )
        ))}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === active ? 'bg-luxury-gold' : 'bg-luxury-white/40'
                }`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
