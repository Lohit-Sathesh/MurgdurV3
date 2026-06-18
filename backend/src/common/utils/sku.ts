import { randomBytes } from 'crypto'

export function generateSkuSuffix(length = 6): string {
  return randomBytes(length).toString('hex').toUpperCase().slice(0, length)
}

export function skuPrefixFromName(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return (letters.slice(0, 3) || 'PRD')
}

export function generateSku(prefix: string): string {
  return `${prefix}-${generateSkuSuffix()}`
}
