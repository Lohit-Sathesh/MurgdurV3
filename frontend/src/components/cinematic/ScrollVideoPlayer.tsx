'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function ScrollVideoPlayer({ videoUrl }: { videoUrl?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video   = videoRef.current
    const section = sectionRef.current
    if (!video || !section) return

    video.pause()

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        if (video.duration) {
          video.currentTime = video.duration * self.progress
        }
      },
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [videoUrl])

  if (!videoUrl) return null

  return (
    <div ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <video ref={videoRef} muted playsInline preload="auto"
          className="w-full h-full object-cover"
          src={videoUrl}
        />
        <div className="absolute inset-0 bg-luxury-black/30" />
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-luxury-white/60 text-xs tracking-luxury uppercase animate-bounce">
            Scroll to explore
          </p>
        </div>
      </div>
    </div>
  )
}