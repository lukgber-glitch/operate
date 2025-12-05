/**
 * Tests for Spanish-specific formatting utilities
 */

import {
  formatEuros,
  formatIVA,
  formatIVAAmount,
  formatBaseImponible,
  formatSpanishDate,
  formatSpanishDateTime,
  formatSpanishNumber,
  formatNIF,
  formatCIF,
  formatNIE,
  formatPostalCode,
  formatInvoiceNumber,
  formatTaxPeriod,
  formatSpanishPhone,
  formatIBAN,
  getIVARateLabel,
  IVARates,
  SpanishTaxForms,
  SpanishEntityTypes,
} from '../format-es'

describe('Spanish Currency Formatting', () => {
  test('formatEuros should format with Spanish conventions', () => {
    expect(formatEuros(1234.56)).toContain('1.234,56')
    expect(formatEuros(1234.56)).toContain('€')
  })

  test('formatIVA should format tax rate', () => {
    expect(formatIVA(21)).toBe('21% IVA')
    expect(formatIVA(10)).toBe('10% IVA')
    expect(formatIVA(4)).toBe('4% IVA')
  })

  test('formatIVAAmount should format IVA amount', () => {
    const result = formatIVAAmount(100)
    expect(result).toContain('IVA:')
    expect(result).toContain('€')
  })

  test('formatBaseImponible should format taxable amount', () => {
    const result = formatBaseImponible(500)
    expect(result).toContain('Base Imponible:')
    expect(result).toContain('€')
  })
})

describe('Spanish Date/Time Formatting', () => {
  test('formatSpanishDate should use DD/MM/YYYY format', () => {
    const date = new Date('2024-03-15')
    const formatted = formatSpanishDate(date)
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  test('formatSpanishDateTime should include time', () => {
    const date = new Date('2024-03-15T14:30:00')
    const formatted = formatSpanishDateTime(date)
    expect(formatted).toContain('14:30')
  })
})

describe('Spanish Number Formatting', () => {
  test('formatSpanishNumber should use correct separators', () => {
    expect(formatSpanishNumber(1234.56)).toBe('1.234,56')
    expect(formatSpanishNumber(1000000.99)).toBe('1.000.000,99')
  })

  test('formatSpanishNumber should respect decimal places', () => {
    expect(formatSpanishNumber(10, 0)).toBe('10')
    expect(formatSpanishNumber(10.5, 3)).toBe('10,500')
  })
})

describe('Spanish Tax ID Formatting', () => {
  test('formatNIF should clean and uppercase', () => {
    expect(formatNIF('12345678a')).toBe('12345678A')
    expect(formatNIF('12.345.678-A')).toBe('12345678A')
  })

  test('formatCIF should clean and uppercase', () => {
    expect(formatCIF('a12345678')).toBe('A12345678')
    expect(formatCIF('a-12.345.678')).toBe('A12345678')
  })

  test('formatNIE should clean and uppercase', () => {
    expect(formatNIE('x1234567a')).toBe('X1234567A')
    expect(formatNIE('x-12.345.67-a')).toBe('X1234567A')
  })
})

describe('Spanish Postal Code Formatting', () => {
  test('formatPostalCode should extract 5 digits', () => {
    expect(formatPostalCode('28001')).toBe('28001')
    expect(formatPostalCode('28-001')).toBe('28001')
    expect(formatPostalCode('280011234')).toBe('28001')
  })
})

describe('Spanish Invoice Number Formatting', () => {
  test('formatInvoiceNumber should use YYYY/NNN format', () => {
    expect(formatInvoiceNumber(2024, 1)).toBe('2024/001')
    expect(formatInvoiceNumber(2024, 123)).toBe('2024/123')
    expect(formatInvoiceNumber(2024, 1234)).toBe('2024/1234')
  })
})

describe('Spanish Tax Period Formatting', () => {
  test('formatTaxPeriod should format quarters correctly', () => {
    expect(formatTaxPeriod(1, 2024)).toBe('Primer Trimestre (Enero-Marzo) 2024')
    expect(formatTaxPeriod(2, 2024)).toBe('Segundo Trimestre (Abril-Junio) 2024')
    expect(formatTaxPeriod(3, 2024)).toBe('Tercer Trimestre (Julio-Septiembre) 2024')
    expect(formatTaxPeriod(4, 2024)).toBe('Cuarto Trimestre (Octubre-Diciembre) 2024')
  })

  test('formatTaxPeriod should throw for invalid quarters', () => {
    expect(() => formatTaxPeriod(0, 2024)).toThrow()
    expect(() => formatTaxPeriod(5, 2024)).toThrow()
  })
})

describe('Spanish Phone Formatting', () => {
  test('formatSpanishPhone should format 9-digit numbers', () => {
    expect(formatSpanishPhone('600123456')).toBe('600 123 456')
    expect(formatSpanishPhone('900123456')).toBe('900 123 456')
  })

  test('formatSpanishPhone should format international numbers', () => {
    expect(formatSpanishPhone('34600123456')).toBe('+34 600 123 456')
  })

  test('formatSpanishPhone should handle already formatted numbers', () => {
    expect(formatSpanishPhone('600 123 456')).toBe('600 123 456')
  })
})

describe('Spanish IBAN Formatting', () => {
  test('formatIBAN should format Spanish IBANs', () => {
    expect(formatIBAN('ES1234567890123456789012')).toBe('ES12 3456 7890 1234 5678 9012')
  })

  test('formatIBAN should handle already formatted IBANs', () => {
    expect(formatIBAN('ES12 3456 7890 1234 5678 9012')).toBe('ES12 3456 7890 1234 5678 9012')
  })

  test('formatIBAN should preserve non-Spanish IBANs', () => {
    expect(formatIBAN('DE12345678901234567890')).toBe('DE12 3456 7890 1234 5678 90')
  })
})

describe('Spanish IVA Rate Labels', () => {
  test('getIVARateLabel should return correct labels', () => {
    expect(getIVARateLabel(21)).toBe('IVA General (21%)')
    expect(getIVARateLabel(10)).toBe('IVA Reducido (10%)')
    expect(getIVARateLabel(4)).toBe('IVA Superreducido (4%)')
    expect(getIVARateLabel(0)).toBe('Exento de IVA')
    expect(getIVARateLabel(15)).toBe('IVA (15%)')
  })
})

describe('Spanish Tax Forms Constants', () => {
  test('SpanishTaxForms should contain all common forms', () => {
    expect(SpanishTaxForms.MODELO_303).toBe('Modelo 303 - IVA Trimestral')
    expect(SpanishTaxForms.MODELO_390).toBe('Modelo 390 - IVA Anual')
    expect(SpanishTaxForms.SII).toBe('SII - Suministro Inmediato de Información')
  })
})

describe('Spanish IVA Rates Constants', () => {
  test('IVARates should contain correct rates', () => {
    expect(IVARates.GENERAL).toBe(21)
    expect(IVARates.REDUCIDO).toBe(10)
    expect(IVARates.SUPERREDUCIDO).toBe(4)
    expect(IVARates.EXENTO).toBe(0)
  })
})

describe('Spanish Entity Types Constants', () => {
  test('SpanishEntityTypes should contain common business types', () => {
    expect(SpanishEntityTypes.AUTONOMO).toBe('Autónomo')
    expect(SpanishEntityTypes.SL).toBe('Sociedad Limitada (S.L.)')
    expect(SpanishEntityTypes.SA).toBe('Sociedad Anónima (S.A.)')
  })
})
