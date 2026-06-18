// Estimated delivery windows (business days) by Indian PIN code zone,
// based on distance from the Mumbai warehouse (zone 4).
const ZONE_ESTIMATES: Record<string, [number, number]> = {
  '1': [3, 5], // Delhi/NCR, North India
  '2': [3, 5], // Uttar Pradesh, Uttarakhand
  '3': [2, 4], // Rajasthan, Gujarat
  '4': [1, 2], // Maharashtra, Goa, MP (warehouse zone)
  '5': [2, 4], // Andhra Pradesh, Karnataka, Telangana
  '6': [3, 5], // Tamil Nadu, Kerala
  '7': [4, 6], // West Bengal, Odisha, North East
  '8': [4, 6], // Bihar, Jharkhand
  '9': [4, 6], // Army Post Office / others
}

export interface DeliveryEstimateResult {
  valid: boolean
  minDays?: number
  maxDays?: number
}

export function estimateDelivery(pincode: string): DeliveryEstimateResult {
  const trimmed = pincode.trim()
  if (!/^\d{6}$/.test(trimmed)) return { valid: false }

  const zone = ZONE_ESTIMATES[trimmed[0]] ?? [3, 5]
  return { valid: true, minDays: zone[0], maxDays: zone[1] }
}
