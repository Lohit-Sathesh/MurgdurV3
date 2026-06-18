interface Props {
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
}

export function Input({ label, type = 'text', value, onChange, error }: Props) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={onChange} placeholder=" "
        className="peer w-full bg-transparent border-b border-luxury-gray text-luxury-white pt-5 pb-2 text-sm tracking-wide outline-none focus:border-luxury-gold transition-colors"/>
      <label className="absolute left-0 top-0 text-luxury-muted text-xs tracking-luxury uppercase transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-luxury-gold">
        {label}
      </label>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}