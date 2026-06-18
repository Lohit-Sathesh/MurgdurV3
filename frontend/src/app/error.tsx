'use client'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-luxury-white">
      <h1 className="font-serif text-6xl tracking-luxury mb-8">Something went wrong</h1>
      <button onClick={reset}
        className="border border-luxury-gold text-luxury-gold px-8 py-3 tracking-luxury hover:bg-luxury-gold hover:text-luxury-black transition-all">
        Try again
      </button>
    </div>
  )
}