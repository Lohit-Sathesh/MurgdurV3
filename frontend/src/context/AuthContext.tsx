'use client'
import { createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
import type { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoggedIn: false, isLoading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  return (
    <AuthContext.Provider value={{
      user: (session?.user as User) ?? null,
      isLoggedIn: !!session,
      isLoading: status === 'loading',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() { return useContext(AuthContext) }