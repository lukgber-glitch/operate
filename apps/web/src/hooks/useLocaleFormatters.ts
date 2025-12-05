'use client'

import { useLocale } from 'next-intl'
import { useMemo } from 'react'

import { Locale } from '@/i18n'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateRange,
  formatFileSize,
  formatList,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTime,
  getCurrencySymbol,
  getDateFormat,
  parseFormattedNumber,
} from '@/lib/locale-utils'

/**
 * Hook that provides locale-aware formatting functions
 * All functions are automatically bound to the current locale
 */
export function useLocaleFormatters() {
  const locale = useLocale() as Locale

  return useMemo(
    () => ({
      // Date and time formatters
      formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDate(date, locale, options),

      formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatTime(date, locale, options),

      formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDateTime(date, locale, options),

      formatDateRange: (
        startDate: Date | string | number,
        endDate: Date | string | number,
        options?: Intl.DateTimeFormatOptions
      ) => formatDateRange(startDate, endDate, locale, options),

      formatRelativeTime: (date: Date | string | number, baseDate?: Date) =>
        formatRelativeTime(date, locale, baseDate),

      // Number formatters
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, locale, options),

      formatCurrency: (
        value: number,
        currency?: string,
        options?: Intl.NumberFormatOptions
      ) => formatCurrency(value, locale, currency, options),

      formatPercent: (value: number, options?: Intl.NumberFormatOptions) =>
        formatPercent(value, locale, options),

      formatFileSize: (bytes: number) => formatFileSize(bytes, locale),

      // Parsers
      parseFormattedNumber: (value: string) =>
        parseFormattedNumber(value, locale),

      // List formatters
      formatList: (items: string[], type?: 'conjunction' | 'disjunction') =>
        formatList(items, locale, type),

      // Utility functions
      getDateFormat: () => getDateFormat(locale),

      getCurrencySymbol: (currency: string) =>
        getCurrencySymbol(currency, locale),

      // Current locale
      locale,
    }),
    [locale]
  )
}
