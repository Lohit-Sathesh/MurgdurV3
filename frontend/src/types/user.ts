export interface Address {
  id: string
  label: string | null
  firstName: string
  lastName: string
  line1: string
  line2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  phone: string | null
  isDefault: boolean
}

export interface User {
  id: string
  customerId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  addresses: Address[]
}