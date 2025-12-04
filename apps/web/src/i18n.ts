import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Supported locales for the application
export const locales = ['en', 'de', 'es', 'fr', 'it', 'nl', 'sv', 'ja', 'ar', 'hi'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  sv: 'Svenska',
  ja: '日本語',
  ar: 'العربية',
  hi: 'हिन्दी',
}

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
  nl: '🇳🇱',
  sv: '🇸🇪',
  ja: '🇯🇵',
  ar: '🇸🇦',
  hi: '🇮🇳',
}

// Locale date formats
export const localeDateFormats: Record<Locale, string> = {
  en: 'MM/dd/yyyy',
  de: 'dd.MM.yyyy',
  es: 'dd/MM/yyyy',
  fr: 'dd/MM/yyyy',
  it: 'dd/MM/yyyy',
  nl: 'dd-MM-yyyy',
  sv: 'yyyy-MM-dd',
  ja: 'yyyy年MM月dd日',
  ar: 'dd/MM/yyyy',
  hi: 'dd/MM/yyyy',
}

// Locale time formats
export const localeTimeFormats: Record<Locale, string> = {
  en: 'h:mm a',
  de: 'HH:mm',
  es: 'HH:mm',
  fr: 'HH:mm',
  it: 'HH:mm',
  nl: 'HH:mm',
  sv: 'HH:mm',
  ja: 'HH時mm分',
  ar: 'HH:mm',
  hi: 'HH:mm',
}

// Locale number formats
export const localeNumberFormats: Record<
  Locale,
  { decimal: string; thousands: string }
> = {
  en: { decimal: '.', thousands: ',' },
  de: { decimal: ',', thousands: '.' },
  es: { decimal: ',', thousands: '.' },
  fr: { decimal: ',', thousands: ' ' },
  it: { decimal: ',', thousands: '.' },
  nl: { decimal: ',', thousands: '.' },
  sv: { decimal: ',', thousands: ' ' },
  ja: { decimal: '.', thousands: ',' },
  ar: { decimal: '.', thousands: ',' },
  hi: { decimal: '.', thousands: ',' },
}

// RTL (Right-to-Left) languages
export const rtlLocales: Locale[] = ['ar']

// Check if locale is RTL
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
