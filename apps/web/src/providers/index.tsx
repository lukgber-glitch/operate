'use client'

import { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { NativeProvider } from './NativeProvider'
import { TransitionProvider } from '@/components/animation'

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
        <TransitionProvider>
          <NativeProvider>
            {children}
          </NativeProvider>
        </TransitionProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
