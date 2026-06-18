interface Props {
  variant: 'out-of-stock' | 'low-stock' | 'new' | 'limited'
  children: React.ReactNode
}

export function Badge({ variant, children }: Props) {
  const styles = {
    'out-of-stock': 'border-red-500/50 text-red-400',
    'low-stock':    'border-amber-500/50 text-amber-400',
    'new':          'border-luxury-gold/50 text-luxury-gold',
    'limited':      'border-luxury-white/50 text-luxury-white',
  }
  return (
    <span className={`border px-3 py-1 text-xs tracking-luxury uppercase ${styles[variant]}`}>
      {children}
    </span>
  )
}