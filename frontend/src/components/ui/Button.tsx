import { LoadingSpinner } from './LoadingSpinner'

interface Props {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  fullWidth?: boolean
  variant?: 'primary' | 'outline'
  disabled?: boolean
}

export function Button({ children, onClick, loading, fullWidth, variant = 'primary', disabled }: Props) {
  const base = 'tracking-luxury text-sm uppercase transition-all duration-300 px-8 py-3 flex items-center justify-center gap-2'
  const variants = {
    primary: 'bg-luxury-gold text-luxury-black hover:bg-luxury-white',
    outline: 'border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black',
  }
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {loading ? <LoadingSpinner size="sm" /> : children}
    </button>
  )
}