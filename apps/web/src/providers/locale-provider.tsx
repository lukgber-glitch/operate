'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'

interface LocaleProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, unknown>
  timeZone?: string
}

export function LocaleProvider({
  children,
  locale,
  messages,
  timeZone = 'UTC',
}: LocaleProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  )
}
