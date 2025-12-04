/**
 * Spanish-specific formatting utilities for Spain market
 * Includes Spain tax terminology and formatting conventions
 */

import { formatCurrency, formatDate, formatNumber } from './locale-utils'

const ES_LOCALE = 'es' as const

/**
 * Format amount in Euros with Spanish formatting (1.234,56 €)
 */
export function formatEuros(amount: number): string {
  return formatCurrency(amount, ES_LOCALE, 'EUR')
}

/**
 * Format IVA (VAT) percentage for Spain
 * Common rates: 21% (general), 10% (reduced), 4% (super-reduced)
 */
export function formatIVA(rate: number): string {
  return `${formatNumber(rate, ES_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}% IVA`
}

/**
 * Format IVA amount with label
 */
export function formatIVAAmount(amount: number): string {
  return `IVA: ${formatEuros(amount)}`
}

/**
 * Format base imponible (taxable amount)
 */
export function formatBaseImponible(amount: number): string {
  return `Base Imponible: ${formatEuros(amount)}`
}

/**
 * Format Spanish date (DD/MM/YYYY)
 */
export function formatSpanishDate(date: Date | string | number): string {
  return formatDate(date, ES_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format Spanish datetime
 */
export function formatSpanishDateTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat(ES_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj)
}

/**
 * Format number with Spanish thousands/decimal separators (1.234,56)
 */
export function formatSpanishNumber(value: number, decimals: number = 2): string {
  return formatNumber(value, ES_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Validate and format NIF (Spanish tax ID for individuals)
 * Format: 12345678A
 */
export function formatNIF(nif: string): string {
  const cleaned = nif.replace(/[^0-9A-Z]/gi, '').toUpperCase()
  return cleaned
}

/**
 * Validate and format CIF (Spanish tax ID for companies)
 * Format: A12345678
 */
export function formatCIF(cif: string): string {
  const cleaned = cif.replace(/[^0-9A-Z]/gi, '').toUpperCase()
  return cleaned
}

/**
 * Format NIE (Spanish tax ID for foreigners)
 * Format: X1234567A
 */
export function formatNIE(nie: string): string {
  const cleaned = nie.replace(/[^0-9A-Z]/gi, '').toUpperCase()
  return cleaned
}

/**
 * Format Spanish postal code (5 digits)
 */
export function formatPostalCode(code: string): string {
  const cleaned = code.replace(/\D/g, '')
  return cleaned.slice(0, 5)
}

/**
 * Format invoice number with Spanish convention
 * Example: 2024/001
 */
export function formatInvoiceNumber(year: number, number: number): string {
  return `${year}/${String(number).padStart(3, '0')}`
}

/**
 * Format tax period for Spanish quarterly returns (Modelo 303)
 * Q1: Enero-Marzo, Q2: Abril-Junio, Q3: Julio-Septiembre, Q4: Octubre-Diciembre
 */
export function formatTaxPeriod(quarter: number, year: number): string {
  const quarters = [
    'Primer Trimestre (Enero-Marzo)',
    'Segundo Trimestre (Abril-Junio)',
    'Tercer Trimestre (Julio-Septiembre)',
    'Cuarto Trimestre (Octubre-Diciembre)'
  ]

  if (quarter < 1 || quarter > 4) {
    throw new Error('Quarter must be between 1 and 4')
  }

  return `${quarters[quarter - 1]} ${year}`
}

/**
 * Format Spanish phone number
 * Examples: +34 600 123 456 or 900 123 456
 */
export function formatSpanishPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // If starts with 34, add + and format
  if (cleaned.startsWith('34') && cleaned.length === 11) {
    return `+34 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }

  // Format 9-digit Spanish number
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  return phone
}

/**
 * Common Spanish tax form names
 */
export const SpanishTaxForms = {
  MODELO_303: 'Modelo 303 - IVA Trimestral',
  MODELO_390: 'Modelo 390 - IVA Anual',
  MODELO_111: 'Modelo 111 - Retenciones IRPF',
  MODELO_115: 'Modelo 115 - Retenciones Alquileres',
  MODELO_130: 'Modelo 130 - IRPF Trimestral (Autónomos)',
  MODELO_131: 'Modelo 131 - IRPF Trimestral (Estimación Objetiva)',
  MODELO_190: 'Modelo 190 - Resumen Anual IRPF',
  MODELO_347: 'Modelo 347 - Declaración Anual de Operaciones',
  SII: 'SII - Suministro Inmediato de Información'
} as const

/**
 * Spanish IVA rates
 */
export const IVARates = {
  GENERAL: 21,
  REDUCIDO: 10,
  SUPERREDUCIDO: 4,
  EXENTO: 0
} as const

/**
 * Get IVA rate label
 */
export function getIVARateLabel(rate: number): string {
  switch (rate) {
    case 21:
      return 'IVA General (21%)'
    case 10:
      return 'IVA Reducido (10%)'
    case 4:
      return 'IVA Superreducido (4%)'
    case 0:
      return 'Exento de IVA'
    default:
      return `IVA (${rate}%)`
  }
}

/**
 * Format Spanish bank account (IBAN)
 * Format: ES12 1234 5678 9012 3456 7890
 */
export function formatIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()

  if (!cleaned.startsWith('ES')) {
    return iban
  }

  // Format in groups of 4
  return cleaned.match(/.{1,4}/g)?.join(' ') || iban
}

/**
 * Spanish business entity types
 */
export const SpanishEntityTypes = {
  AUTONOMO: 'Autónomo',
  SL: 'Sociedad Limitada (S.L.)',
  SA: 'Sociedad Anónima (S.A.)',
  SLU: 'Sociedad Limitada Unipersonal (S.L.U.)',
  CB: 'Comunidad de Bienes (C.B.)',
  SC: 'Sociedad Civil (S.C.)',
  COOP: 'Cooperativa'
} as const
