/**
 * Spanish Localization Demo Component
 * Demonstrates Spanish formatting and translations
 */

'use client'

import { useTranslations, useLocale } from 'next-intl'
import {
  formatEuros,
  formatIVA,
  formatIVAAmount,
  formatBaseImponible,
  formatSpanishDate,
  formatSpanishDateTime,
  formatNIF,
  formatCIF,
  formatInvoiceNumber,
  formatTaxPeriod,
  formatSpanishPhone,
  formatIBAN,
  getIVARateLabel,
  IVARates,
  SpanishTaxForms,
  SpanishEntityTypes,
} from '@/lib/format-es'
import { formatDate, formatCurrency } from '@/lib/locale-utils'
import { Locale } from '@/i18n'

export default function SpanishDemo() {
  const t = useTranslations('invoices')
  const locale = useLocale() as Locale
  const today = new Date()

  // Sample invoice data
  const baseAmount = 1234.56
  const ivaRate = IVARates.GENERAL // 21%
  const ivaAmount = baseAmount * (ivaRate / 100)
  const totalAmount = baseAmount + ivaAmount

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">
          {locale === 'es' ? 'Demostración de Localización Española' : 'Spanish Localization Demo'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === 'es'
            ? 'Ejemplos de formato y terminología para el mercado español'
            : 'Examples of formatting and terminology for the Spanish market'}
        </p>
      </div>

      {/* Translations */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Traducciones' : 'Translations'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="font-medium">{t('title')}:</span>
            <span className="ml-2 text-muted-foreground">Invoice → Factura</span>
          </div>
          <div>
            <span className="font-medium">{t('tax')}:</span>
            <span className="ml-2 text-muted-foreground">Tax → IVA</span>
          </div>
          <div>
            <span className="font-medium">{t('paid')}:</span>
            <span className="ml-2 text-muted-foreground">Paid → Pagada</span>
          </div>
          <div>
            <span className="font-medium">{t('overdue')}:</span>
            <span className="ml-2 text-muted-foreground">Overdue → Vencida</span>
          </div>
        </div>
      </section>

      {/* Currency Formatting */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Formato de Moneda' : 'Currency Formatting'}
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{formatBaseImponible(baseAmount)}</span>
            <span className="font-mono">{baseAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{formatIVAAmount(ivaAmount)}</span>
            <span className="font-mono">
              {formatIVA(ivaRate)} = {ivaAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total:</span>
            <span>{formatEuros(totalAmount)}</span>
          </div>
        </div>
      </section>

      {/* Date Formatting */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Formato de Fecha' : 'Date Formatting'}
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{locale === 'es' ? 'Fecha corta:' : 'Short date:'}</span>
            <span className="font-mono">{formatSpanishDate(today)}</span>
          </div>
          <div className="flex justify-between">
            <span>{locale === 'es' ? 'Fecha y hora:' : 'Date and time:'}</span>
            <span className="font-mono">{formatSpanishDateTime(today)}</span>
          </div>
          <div className="flex justify-between">
            <span>{locale === 'es' ? 'Formato localizado:' : 'Localized format:'}</span>
            <span className="font-mono">{formatDate(today, locale)}</span>
          </div>
        </div>
      </section>

      {/* Tax IDs */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Identificadores Fiscales' : 'Tax IDs'}
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>NIF (Individual):</span>
            <span className="font-mono">{formatNIF('12345678A')}</span>
          </div>
          <div className="flex justify-between">
            <span>CIF (Empresa):</span>
            <span className="font-mono">{formatCIF('A12345678')}</span>
          </div>
          <div className="flex justify-between">
            <span>IBAN:</span>
            <span className="font-mono text-sm">{formatIBAN('ES1234567890123456789012')}</span>
          </div>
        </div>
      </section>

      {/* IVA Rates */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Tipos de IVA' : 'IVA Rates'}
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{getIVARateLabel(IVARates.GENERAL)}</span>
            <span className="font-mono">{formatIVA(IVARates.GENERAL)}</span>
          </div>
          <div className="flex justify-between">
            <span>{getIVARateLabel(IVARates.REDUCIDO)}</span>
            <span className="font-mono">{formatIVA(IVARates.REDUCIDO)}</span>
          </div>
          <div className="flex justify-between">
            <span>{getIVARateLabel(IVARates.SUPERREDUCIDO)}</span>
            <span className="font-mono">{formatIVA(IVARates.SUPERREDUCIDO)}</span>
          </div>
          <div className="flex justify-between">
            <span>{getIVARateLabel(IVARates.EXENTO)}</span>
            <span className="font-mono">{formatIVA(IVARates.EXENTO)}</span>
          </div>
        </div>
      </section>

      {/* Tax Forms */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Modelos de Declaración' : 'Tax Forms'}
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(SpanishTaxForms).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-mono text-xs text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Business Entities */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Tipos de Entidad' : 'Business Entity Types'}
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(SpanishEntityTypes).map(([key, value]) => (
            <div key={key} className="text-sm">
              {value}
            </div>
          ))}
        </div>
      </section>

      {/* Invoice Example */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Ejemplo de Factura' : 'Invoice Example'}
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">
              {locale === 'es' ? 'Número de Factura:' : 'Invoice Number:'}
            </span>
            <span className="font-mono">{formatInvoiceNumber(2024, 1)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">{locale === 'es' ? 'Fecha:' : 'Date:'}</span>
            <span className="font-mono">{formatSpanishDate(today)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">
              {locale === 'es' ? 'Periodo Fiscal:' : 'Tax Period:'}
            </span>
            <span className="text-sm">{formatTaxPeriod(1, 2024)}</span>
          </div>
          <div className="mt-4 space-y-2 bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span>{locale === 'es' ? 'Base Imponible:' : 'Taxable Amount:'}</span>
              <span className="font-mono">{formatEuros(baseAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>
                {locale === 'es' ? 'IVA' : 'VAT'} ({ivaRate}%):
              </span>
              <span className="font-mono">{formatEuros(ivaAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>{locale === 'es' ? 'Total:' : 'Total:'}</span>
              <span className="font-mono">{formatEuros(totalAmount)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {locale === 'es' ? 'Información de Contacto' : 'Contact Information'}
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{locale === 'es' ? 'Teléfono:' : 'Phone:'}</span>
            <span className="font-mono">{formatSpanishPhone('600123456')}</span>
          </div>
          <div className="flex justify-between">
            <span>{locale === 'es' ? 'Internacional:' : 'International:'}</span>
            <span className="font-mono">{formatSpanishPhone('34600123456')}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
