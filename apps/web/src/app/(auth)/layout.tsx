import { cookies, headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'

import { locales, defaultLocale, type Locale, isRTL } from '@/i18n'
import { AuthLayoutClient } from './AuthLayoutClient'

async function getLocale(): Promise<Locale> {
  // First check for locale cookie
  const cookieStore = cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale
  }

  // Then check Accept-Language header
  const headersList = headers()
  const acceptLanguage = headersList.get('accept-language')
  if (acceptLanguage) {
    // Parse Accept-Language header and find best match
    const preferredLocales = acceptLanguage
      .split(',')
      .map((lang) => {
        const [locale, priority = 'q=1'] = lang.trim().split(';')
        const q = parseFloat(priority.replace('q=', '')) || 1
        return { locale: locale?.split('-')[0] || '', q }
      })
      .sort((a, b) => b.q - a.q)

    for (const { locale } of preferredLocales) {
      if (locales.includes(locale as Locale)) {
        return locale as Locale
      }
    }
  }

  return defaultLocale
}

async function getMessages(locale: Locale) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default
  } catch {
    return (await import(`../../../messages/${defaultLocale}.json`)).default
  }
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages(locale)
  const rtl = isRTL(locale)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthLayoutClient rtl={rtl}>
        {children}
      </AuthLayoutClient>
    </NextIntlClientProvider>
  )
}
