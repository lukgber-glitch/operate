import { Locale, localeDateFormats, localeNumberFormats } from '@/i18n'

/**
 * Format a date according to the locale
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(dateObj)
}

/**
 * Format a time according to the locale
 */
export function formatTime(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat(locale, {
    timeStyle: 'short',
    ...options,
  }).format(dateObj)
}

/**
 * Format a date and time according to the locale
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(dateObj)
}

/**
 * Format a number according to the locale
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Format a currency amount according to the locale
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency: string = 'EUR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value)
}

/**
 * Format a percentage according to the locale
 */
export function formatPercent(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

/**
 * Format a file size in bytes to a human-readable format
 */
export function formatFileSize(bytes: number, locale: Locale): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${formatNumber(size, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${units[unitIndex]}`
}

/**
 * Parse a formatted number string back to a number
 */
export function parseFormattedNumber(
  value: string,
  locale: Locale
): number | null {
  const format = localeNumberFormats[locale]

  // Remove thousands separator and replace decimal separator with dot
  const normalized = value
    .replace(new RegExp(`\\${format.thousands}`, 'g'), '')
    .replace(format.decimal, '.')

  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? null : parsed
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000)
  const absDiff = Math.abs(diffInSeconds)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (absDiff < 60) {
    return rtf.format(-diffInSeconds, 'second')
  } else if (absDiff < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  } else if (absDiff < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  } else if (absDiff < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  } else if (absDiff < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
  }
}

/**
 * Get the date format pattern for the locale
 */
export function getDateFormat(locale: Locale): string {
  return localeDateFormats[locale]
}

/**
 * Format a date range
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const start = typeof startDate === 'string' || typeof startDate === 'number'
    ? new Date(startDate)
    : startDate
  const end = typeof endDate === 'string' || typeof endDate === 'number'
    ? new Date(endDate)
    : endDate

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).formatRange(start, end)
}

/**
 * Format a list of items according to locale
 */
export function formatList(
  items: string[],
  locale: Locale,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, { type }).format(items)
}

/**
 * Get locale-specific currency symbol
 */
export function getCurrencySymbol(
  currency: string,
  locale: Locale
): string {
  return (0)
    .toLocaleString(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, '')
    .trim()
}
