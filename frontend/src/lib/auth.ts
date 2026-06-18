import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider       from 'next-auth/providers/google'
import axios from 'axios'

const API = process.env.INTERNAL_API_URL ?? 'http://localhost:3001'
const ROLE_REFRESH_INTERVAL = 5 * 60 * 1000

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(`${API}/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          })
          const payload = res.data?.data ?? res.data
          if (payload?.accessToken) return payload
          return null
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed'
          throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg))
        }
      },
    }),

    // Google OAuth — only registered when credentials are configured in .env.local
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, call our backend to create/get the user
      if (account?.provider === 'google') {
        try {
          const res = await axios.post(`${API}/auth/google`, {
            email:     user.email,
            firstName: user.name?.split(' ')[0]  ?? '',
            lastName:  user.name?.split(' ').slice(1).join(' ') ?? '',
            picture:   user.image ?? '',
          })
          const payload = res.data?.data ?? res.data
          // Attach tokens to the user object so the jwt callback can pick them up
          ;(user as any).accessToken  = payload.accessToken
          ;(user as any).refreshToken = payload.refreshToken
          ;(user as any).role         = payload.user?.role ?? 'CUSTOMER'
          ;(user as any).firstName    = payload.user?.firstName
          ;(user as any).lastName     = payload.user?.lastName
          ;(user as any).customerId   = payload.user?.customerId
          return true
        } catch {
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.accessToken        = u.accessToken
        token.refreshToken       = u.refreshToken
        token.customerId         = u.customerId
        token.role               = u.user?.role ?? u.role
        token.firstName          = u.user?.firstName ?? u.firstName
        token.lastName           = u.user?.lastName  ?? u.lastName
        token.email              = u.user?.email     ?? u.email
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000
        token.roleRefreshedAt    = Date.now()
        return token
      }

      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        const lastCheck = (token.roleRefreshedAt as number) ?? 0
        if (Date.now() - lastCheck > ROLE_REFRESH_INTERVAL) {
          try {
            const res = await axios.get(`${API}/auth/me`, {
              headers: { Authorization: `Bearer ${token.accessToken}` },
            })
            token.role = res.data?.role ?? token.role
            token.roleRefreshedAt = Date.now()
          } catch {}
        }
        return token
      }

      try {
        const res = await axios.post(`${API}/auth/refresh`, { refreshToken: token.refreshToken })
        const payload = res.data?.data ?? res.data
        token.accessToken        = payload.accessToken
        token.refreshToken       = payload.refreshToken
        token.role               = payload.user?.role ?? token.role
        token.roleRefreshedAt    = Date.now()
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000
      } catch {
        token.error = 'RefreshAccessTokenError'
      }
      return token
    },

    async session({ session, token }) {
      (session as any).accessToken      = token.accessToken
      ;(session as any).error           = token.error
      ;(session.user as any).customerId = token.customerId
      ;(session.user as any).role       = token.role
      ;(session.user as any).firstName  = token.firstName
      ;(session.user as any).lastName   = token.lastName
      if (token.email) session.user!.email = token.email as string
      return session
    },
  },
  pages:   { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
}
