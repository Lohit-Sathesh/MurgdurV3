'use client'
import { createContext, useContext, useState } from 'react'

interface HeroThemeContextType {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

const HeroThemeContext = createContext<HeroThemeContextType | null>(null)

export function HeroThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  return (
    <HeroThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </HeroThemeContext.Provider>
  )
}

export function useHeroTheme() {
  const ctx = useContext(HeroThemeContext)
  if (!ctx) throw new Error('useHeroTheme must be used within HeroThemeProvider')
  return ctx
}
