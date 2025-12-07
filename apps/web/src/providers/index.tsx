'use client'

import { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { NativeProvider } from './NativeProvider'

import { QueryProvider } from './query-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        enableColorScheme
        disableTransitionOnChange={false}
        storageKey="operate-theme"
      >
        <NativeProvider>
          {children}
        </NativeProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
