'use client'
import { useState, useEffect } from 'react'

// Country dial codes with expected local digit count
export const COUNTRIES = [
  { code: 'IN', name: 'India',        dial: '+91',  digits: 10 },
  { code: 'US', name: 'USA',          dial: '+1',   digits: 10 },
  { code: 'GB', name: 'UK',           dial: '+44',  digits: 10 },
  { code: 'AE', name: 'UAE',          dial: '+971', digits: 9  },
  { code: 'SG', name: 'Singapore',    dial: '+65',  digits: 8  },
  { code: 'AU', name: 'Australia',    dial: '+61',  digits: 9  },
  { code: 'CA', name: 'Canada',       dial: '+1',   digits: 10 },
  { code: 'DE', name: 'Germany',      dial: '+49',  digits: 11 },
  { code: 'FR', name: 'France',       dial: '+33',  digits: 9  },
  { code: 'IT', name: 'Italy',        dial: '+39',  digits: 10 },
  { code: 'JP', name: 'Japan',        dial: '+81',  digits: 10 },
  { code: 'CN', name: 'China',        dial: '+86',  digits: 11 },
  { code: 'NZ', name: 'New Zealand',  dial: '+64',  digits: 9  },
  { code: 'ZA', name: 'South Africa', dial: '+27',  digits: 9  },
  { code: 'MY', name: 'Malaysia',     dial: '+60',  digits: 9  },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', digits: 9  },
  { code: 'QA', name: 'Qatar',        dial: '+974', digits: 8  },
  { code: 'KW', name: 'Kuwait',       dial: '+965', digits: 8  },
  { code: 'BH', name: 'Bahrain',      dial: '+973', digits: 8  },
  { code: 'OM', name: 'Oman',         dial: '+968', digits: 8  },
]

function parsePhone(full: string): { dial: string; local: string } {
  for (const c of COUNTRIES) {
    if (full.startsWith(c.dial)) return { dial: c.dial, local: full.slice(c.dial.length) }
  }
  return { dial: '+91', local: full.replace(/^\+91/, '') }
}

interface Props {
  label?: string
  value: string        // full number: "+91XXXXXXXXXX"
  onChange: (full: string, valid: boolean) => void
  /** Called whenever the country dial code changes — passes the country name */
  onCountryChange?: (countryName: string) => void
  className?: string
}

export function PhoneInput({ label = 'Phone', value, onChange, onCountryChange, className }: Props) {
  const parsed = parsePhone(value)
  const [dial,  setDial]  = useState(parsed.dial)
  const [local, setLocal] = useState(parsed.local)

  useEffect(() => {
    const p = parsePhone(value)
    setDial(p.dial)
    setLocal(p.local)
  }, []) // only on mount

  const country  = COUNTRIES.find(c => c.dial === dial) ?? COUNTRIES[0]
  const digits   = local.replace(/\D/g, '')
  const valid    = digits.length === country.digits
  const full     = dial + digits
  const hasValue = digits.length > 0

  function onDialChange(newDial: string) {
    setDial(newDial)
    const c = COUNTRIES.find(x => x.dial === newDial) ?? COUNTRIES[0]
    const d = digits
    onChange(newDial + d, d.length === c.digits)
    onCountryChange?.(c.name)
  }

  function onLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, '').slice(0, country.digits)
    setLocal(d)
    onChange(dial + d, d.length === country.digits)
  }

  return (
    <div className={className}>
      {label && <label className="block text-luxury-muted text-xs tracking-luxury uppercase mb-2">{label}</label>}
      <div className="flex gap-2">
        <select
          value={dial}
          onChange={e => onDialChange(e.target.value)}
          className="bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-2 py-2 outline-none focus:border-luxury-gold shrink-0 w-32"
        >
          {COUNTRIES.map(c => (
            <option key={c.code + c.dial} value={c.dial}>
              {c.dial} {c.name}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          value={local}
          onChange={onLocalChange}
          placeholder={`${country.digits} digits`}
          className="flex-1 bg-luxury-black border border-luxury-gray text-luxury-white text-sm px-3 py-2 outline-none focus:border-luxury-gold"
        />
      </div>
      {hasValue && !valid && (
        <p className="text-red-400 text-xs mt-1 tracking-wide">
          {country.name} numbers must be {country.digits} digits.
        </p>
      )}
      {hasValue && valid && (
        <p className="text-green-400 text-xs mt-1 tracking-luxury">✓ {full}</p>
      )}
    </div>
  )
}
