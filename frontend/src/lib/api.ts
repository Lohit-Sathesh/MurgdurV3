import axios from 'axios'
import { getSession } from 'next-auth/react'

// Browser requests go through the Next.js rewrite proxy (relative path avoids CORS);
// server-side requests (Server Components) need an absolute URL since there's no page origin.
const baseURL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL ?? 'http://localhost:3001')
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach JWT token to every request (browser only — server components pass their own Authorization header)
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession()
    if (session) {
      config.headers.Authorization = `Bearer ${(session as any).accessToken}`
    }
  }
  return config
})

// Unwrap { success: true, data: {...} } from every response
api.interceptors.response.use(
  (response) => {
    if (response.data?.success && response.data?.data !== undefined) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    // Unwrap error message from backend too
    const message = error?.response?.data?.message
    if (message) {
      error.message = Array.isArray(message) ? message.join(', ') : message
    }
    return Promise.reject(error)
  }
)