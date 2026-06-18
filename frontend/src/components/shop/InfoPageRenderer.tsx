interface InfoBlock {
  id: string
  heading: string | null
  body: string | null
  mediaUrl: string | null
  mediaType: string
  textTheme: string
  layout: string
  sortOrder: number
}

interface InfoPageRendererProps {
  category: {
    name: string
    description: string | null
    infoBlocks: InfoBlock[]
  }
}

function MediaEl({ block, className }: { block: InfoBlock; className: string }) {
  if (!block.mediaUrl) return null
  return block.mediaType === 'video' ? (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video src={block.mediaUrl} muted loop autoPlay playsInline className={className} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={block.mediaUrl} alt={block.heading ?? ''} className={className} />
  )
}

function TextContent({ block, dark }: { block: InfoBlock; dark?: boolean }) {
  if (!block.heading && !block.body) return null
  return (
    <div className="space-y-4">
      {block.heading && (
        <h2 className={`font-serif text-3xl md:text-5xl tracking-luxury ${dark ? 'text-luxury-black' : 'text-luxury-white'}`}>
          {block.heading}
        </h2>
      )}
      {block.body && (
        <p className={`text-sm md:text-base tracking-wide leading-relaxed whitespace-pre-line ${dark ? 'text-luxury-black/70' : 'text-luxury-muted'}`}>
          {block.body}
        </p>
      )}
    </div>
  )
}

function FullBlock({ block }: { block: InfoBlock }) {
  const dark = block.textTheme === 'light'
  if (!block.mediaUrl) {
    return (
      <section className="py-24 px-8 max-w-3xl mx-auto text-center">
        <TextContent block={block} dark={false} />
      </section>
    )
  }
  return (
    <section className="relative w-full h-[70vh] md:h-screen overflow-hidden">
      <MediaEl block={block} className="absolute inset-0 w-full h-full object-cover" />
      <div className={`absolute inset-0 ${dark ? 'bg-white/10' : 'bg-black/40'}`} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <TextContent block={block} dark={dark} />
      </div>
    </section>
  )
}

function SideBySideBlock({ block, mediaLeft }: { block: InfoBlock; mediaLeft: boolean }) {
  return (
    <section className="flex flex-col md:flex-row min-h-[60vh]">
      {mediaLeft && block.mediaUrl && (
        <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-full overflow-hidden">
          <MediaEl block={block} className="w-full h-full object-cover" />
        </div>
      )}
      <div className={`w-full md:w-1/2 flex items-center justify-center px-10 py-16 ${mediaLeft ? '' : 'order-first md:order-none'}`}>
        <div className="max-w-md">
          <TextContent block={block} dark={false} />
        </div>
      </div>
      {!mediaLeft && block.mediaUrl && (
        <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-full overflow-hidden">
          <MediaEl block={block} className="w-full h-full object-cover" />
        </div>
      )}
    </section>
  )
}

function TextOnlyBlock({ block }: { block: InfoBlock }) {
  return (
    <section className="py-24 px-8 max-w-3xl mx-auto text-center">
      <TextContent block={block} dark={false} />
    </section>
  )
}

export function InfoPageRenderer({ category }: InfoPageRendererProps) {
  const blocks = category.infoBlocks ?? []

  return (
    <div className="bg-luxury-black">
      {/* Page header */}
      <div className="max-w-3xl mx-auto px-8 pt-24 pb-16 text-center">
        <h1 className="font-serif text-5xl md:text-7xl tracking-luxury text-luxury-white mb-6">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-luxury-muted text-sm md:text-base tracking-wide leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Content blocks */}
      {blocks.map(block => {
        if (block.layout === 'full') return <FullBlock key={block.id} block={block} />
        if (block.layout === 'left') return <SideBySideBlock key={block.id} block={block} mediaLeft={true} />
        if (block.layout === 'right') return <SideBySideBlock key={block.id} block={block} mediaLeft={false} />
        return <TextOnlyBlock key={block.id} block={block} />
      })}

      {blocks.length === 0 && (
        <p className="text-luxury-muted text-center text-sm tracking-wide py-16">
          No content yet. Add blocks in the admin panel.
        </p>
      )}
    </div>
  )
}
