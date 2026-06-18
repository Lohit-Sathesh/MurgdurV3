export type CurrencyCode = 'INR' | 'USD' | 'EUR'

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
}

// Static conversion rates from INR (base currency all prices are stored in)
export const RATES_FROM_INR: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 1 / 87,
  EUR: 1 / 94,
}

const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'HR',
])

export function currencyForCountry(countryCode: string): CurrencyCode {
  if (countryCode === 'IN') return 'INR'
  if (EUR_COUNTRIES.has(countryCode)) return 'EUR'
  return 'USD'
}

export function convertFromINR(amountInINR: number, currency: CurrencyCode): number {
  return amountInINR * RATES_FROM_INR[currency]
}

export function formatPrice(amountInINR: number | string, currency: CurrencyCode): string {
  const amount = convertFromINR(Number(amountInINR), currency)
  const symbol = CURRENCY_SYMBOLS[currency]
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  const decimals = currency === 'INR' ? 0 : 2
  return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}
