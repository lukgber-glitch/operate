/**
 * Tests for Japanese-specific formatting utilities
 */

import {
  formatYen,
  formatConsumptionTax,
  formatConsumptionTaxAmount,
  formatTaxableAmount,
  formatJapaneseDate,
  formatJapaneseDateTime,
  formatJapaneseNumber,
  formatJapaneseLargeNumber,
  formatYenWithUnits,
  formatMyNumber,
  formatCorporateNumber,
  formatPostalCode,
  formatJapaneseAddress,
  formatInvoiceNumber,
  formatTaxPeriod,
  formatFiscalYear,
  formatJapanesePhone,
  formatBusinessName,
  formatBankAccount,
  formatJapaneseDateRange,
  formatJapaneseTime,
  formatBusinessHours,
  getConsumptionTaxLabel,
  ConsumptionTaxRates,
  JapaneseTaxForms,
  JapaneseEntityTypes,
  JapanesePrefectures,
} from '../format-ja'

describe('Japanese Currency Formatting', () => {
  test('formatYen should format with Japanese Yen symbol', () => {
    const result = formatYen(1234)
    expect(result).toContain('¥')
    expect(result).toContain('1,234')
  })

  test('formatYen should handle large amounts', () => {
    const result = formatYen(1234567)
    expect(result).toContain('1,234,567')
  })

  test('formatConsumptionTax should format tax rate', () => {
    expect(formatConsumptionTax(10)).toBe('消費税10%')
    expect(formatConsumptionTax(8)).toBe('消費税8%')
  })

  test('formatConsumptionTaxAmount should format tax amount', () => {
    const result = formatConsumptionTaxAmount(100)
    expect(result).toContain('消費税:')
    expect(result).toContain('¥')
  })

  test('formatTaxableAmount should format taxable amount', () => {
    const result = formatTaxableAmount(1000)
    expect(result).toContain('課税標準額:')
    expect(result).toContain('¥')
  })
})

describe('Japanese Date/Time Formatting', () => {
  test('formatJapaneseDate should use Japanese format (YYYY年MM月DD日)', () => {
    const date = new Date('2024-03-15')
    const formatted = formatJapaneseDate(date)
    expect(formatted).toContain('2024年')
    expect(formatted).toContain('3月')
    expect(formatted).toContain('15日')
  })

  test('formatJapaneseDate with era should use Japanese calendar', () => {
    const date = new Date('2024-01-01')
    const formatted = formatJapaneseDate(date, true)
    expect(formatted).toContain('令和')
  })

  test('formatJapaneseDateTime should include time', () => {
    const date = new Date('2024-03-15T14:30:00')
    const formatted = formatJapaneseDateTime(date)
    expect(formatted).toContain('2024年')
    expect(formatted).toContain('14:30')
  })

  test('formatJapaneseTime should format time correctly', () => {
    const date = new Date('2024-03-15T14:05:00')
    const formatted = formatJapaneseTime(date)
    expect(formatted).toBe('14時05分')
  })

  test('formatJapaneseDateRange should format date ranges', () => {
    const start = new Date('2024-01-01')
    const end = new Date('2024-12-31')
    const formatted = formatJapaneseDateRange(start, end)
    expect(formatted).toContain('2024年1月1日')
    expect(formatted).toContain('～')
    expect(formatted).toContain('2024年12月31日')
  })
})

describe('Japanese Number Formatting', () => {
  test('formatJapaneseNumber should format with comma separators', () => {
    expect(formatJapaneseNumber(1234)).toBe('1,234')
    expect(formatJapaneseNumber(1234567)).toBe('1,234,567')
  })

  test('formatJapaneseNumber should respect decimal places', () => {
    expect(formatJapaneseNumber(10, 0)).toBe('10')
    expect(formatJapaneseNumber(10.5, 2)).toBe('10.50')
  })

  test('formatJapaneseLargeNumber should use 万 for 10,000s', () => {
    expect(formatJapaneseLargeNumber(10000)).toBe('1.00万')
    expect(formatJapaneseLargeNumber(50000)).toBe('5.00万')
  })

  test('formatJapaneseLargeNumber should use 億 for 100,000,000s', () => {
    expect(formatJapaneseLargeNumber(100000000)).toBe('1.00億')
    expect(formatJapaneseLargeNumber(500000000)).toBe('5.00億')
  })

  test('formatJapaneseLargeNumber should use 兆 for trillions', () => {
    expect(formatJapaneseLargeNumber(1000000000000)).toBe('1.00兆')
    expect(formatJapaneseLargeNumber(5000000000000)).toBe('5.00兆')
  })

  test('formatJapaneseLargeNumber should handle small numbers', () => {
    expect(formatJapaneseLargeNumber(1234)).toBe('1,234')
  })

  test('formatYenWithUnits should combine Yen symbol with units', () => {
    expect(formatYenWithUnits(10000)).toBe('¥1.00万')
    expect(formatYenWithUnits(100000000)).toBe('¥1.00億')
  })
})

describe('Japanese ID Number Formatting', () => {
  test('formatMyNumber should format My Number correctly', () => {
    expect(formatMyNumber('123456789012')).toBe('1234-5678-9012')
  })

  test('formatMyNumber should handle already formatted numbers', () => {
    expect(formatMyNumber('1234-5678-9012')).toBe('1234-5678-9012')
  })

  test('formatMyNumber should preserve invalid format', () => {
    expect(formatMyNumber('12345')).toBe('12345')
  })

  test('formatCorporateNumber should format 13-digit number', () => {
    expect(formatCorporateNumber('1234567890123')).toBe('1234567890123')
  })

  test('formatCorporateNumber should preserve invalid format', () => {
    expect(formatCorporateNumber('12345')).toBe('12345')
  })
})

describe('Japanese Postal Code Formatting', () => {
  test('formatPostalCode should format 7-digit codes', () => {
    expect(formatPostalCode('1234567')).toBe('〒123-4567')
  })

  test('formatPostalCode should handle already formatted codes', () => {
    expect(formatPostalCode('123-4567')).toBe('〒123-4567')
  })

  test('formatPostalCode should preserve invalid format', () => {
    expect(formatPostalCode('12345')).toBe('12345')
  })
})

describe('Japanese Address Formatting', () => {
  test('formatJapaneseAddress should format complete address', () => {
    const address = {
      postalCode: '1000001',
      prefecture: '東京都',
      city: '千代田区',
      street: '千代田1-1',
      building: '千代田ビル101号室',
    }
    const formatted = formatJapaneseAddress(address)
    expect(formatted).toContain('〒100-0001')
    expect(formatted).toContain('東京都')
    expect(formatted).toContain('千代田区')
    expect(formatted).toContain('千代田1-1')
    expect(formatted).toContain('千代田ビル101号室')
  })

  test('formatJapaneseAddress should handle partial address', () => {
    const address = {
      prefecture: '大阪府',
      city: '大阪市',
    }
    const formatted = formatJapaneseAddress(address)
    expect(formatted).toBe('大阪府 大阪市')
  })
})

describe('Japanese Invoice Number Formatting', () => {
  test('formatInvoiceNumber should use YYYY-NNNN format', () => {
    expect(formatInvoiceNumber(2024, 1)).toBe('2024-0001')
    expect(formatInvoiceNumber(2024, 123)).toBe('2024-0123')
  })

  test('formatInvoiceNumber with era should use Reiwa', () => {
    expect(formatInvoiceNumber(2024, 1, true)).toBe('令和6-0001')
    expect(formatInvoiceNumber(2019, 1, true)).toBe('令和1-0001')
  })
})

describe('Japanese Tax Period Formatting', () => {
  test('formatTaxPeriod should format quarterly periods', () => {
    expect(formatTaxPeriod(1, 2024, 'quarterly')).toBe('2024年 第1四半期（1月～3月）')
    expect(formatTaxPeriod(2, 2024, 'quarterly')).toBe('2024年 第2四半期（4月～6月）')
    expect(formatTaxPeriod(3, 2024, 'quarterly')).toBe('2024年 第3四半期（7月～9月）')
    expect(formatTaxPeriod(4, 2024, 'quarterly')).toBe('2024年 第4四半期（10月～12月）')
  })

  test('formatTaxPeriod should format monthly periods', () => {
    expect(formatTaxPeriod(1, 2024, 'monthly')).toBe('2024年1月')
    expect(formatTaxPeriod(12, 2024, 'monthly')).toBe('2024年12月')
  })

  test('formatTaxPeriod should throw for invalid quarters', () => {
    expect(() => formatTaxPeriod(0, 2024, 'quarterly')).toThrow()
    expect(() => formatTaxPeriod(5, 2024, 'quarterly')).toThrow()
  })

  test('formatTaxPeriod should throw for invalid months', () => {
    expect(() => formatTaxPeriod(0, 2024, 'monthly')).toThrow()
    expect(() => formatTaxPeriod(13, 2024, 'monthly')).toThrow()
  })
})

describe('Japanese Fiscal Year Formatting', () => {
  test('formatFiscalYear should format fiscal year', () => {
    const result = formatFiscalYear(2024)
    expect(result).toBe('2024年度（2024年4月～2025年3月）')
  })
})

describe('Japanese Phone Formatting', () => {
  test('formatJapanesePhone should format mobile numbers', () => {
    expect(formatJapanesePhone('09012345678')).toBe('090-1234-5678')
    expect(formatJapanesePhone('08012345678')).toBe('080-1234-5678')
    expect(formatJapanesePhone('07012345678')).toBe('070-1234-5678')
  })

  test('formatJapanesePhone should format Tokyo landlines', () => {
    expect(formatJapanesePhone('0312345678')).toBe('03-1234-5678')
  })

  test('formatJapanesePhone should format Osaka landlines', () => {
    expect(formatJapanesePhone('0612345678')).toBe('06-1234-5678')
  })

  test('formatJapanesePhone should format toll-free numbers', () => {
    expect(formatJapanesePhone('0120123456')).toBe('0120-123-456')
    expect(formatJapanesePhone('0800123456')).toBe('0800-123-456')
  })

  test('formatJapanesePhone should handle already formatted numbers', () => {
    expect(formatJapanesePhone('090-1234-5678')).toBe('090-1234-5678')
  })
})

describe('Japanese Business Name Formatting', () => {
  test('formatBusinessName should add 様 for individuals', () => {
    expect(formatBusinessName('山田太郎')).toBe('山田太郎様')
  })

  test('formatBusinessName should add 御中 for companies', () => {
    expect(formatBusinessName('株式会社サンプル', true)).toBe('株式会社サンプル御中')
  })
})

describe('Japanese Bank Account Formatting', () => {
  test('formatBankAccount should format complete account info', () => {
    const account = {
      bankName: '三菱UFJ銀行',
      branchName: '新宿支店',
      accountType: '普通' as const,
      accountNumber: '1234567',
    }
    const formatted = formatBankAccount(account)
    expect(formatted).toBe('三菱UFJ銀行 新宿支店 普通 1234567')
  })

  test('formatBankAccount should handle partial info', () => {
    const account = {
      bankName: '三井住友銀行',
      accountType: '当座' as const,
    }
    const formatted = formatBankAccount(account)
    expect(formatted).toBe('三井住友銀行 当座')
  })
})

describe('Japanese Business Hours Formatting', () => {
  test('formatBusinessHours should format hours correctly', () => {
    const result = formatBusinessHours('09:00', '18:00')
    expect(result).toBe('営業時間: 09:00～18:00')
  })
})

describe('Consumption Tax Rate Labels', () => {
  test('getConsumptionTaxLabel should return correct labels', () => {
    expect(getConsumptionTaxLabel(10)).toBe('標準税率（10%）')
    expect(getConsumptionTaxLabel(8)).toBe('軽減税率（8%）')
    expect(getConsumptionTaxLabel(0)).toBe('非課税')
    expect(getConsumptionTaxLabel(15)).toBe('消費税（15%）')
  })
})

describe('Japanese Tax Forms Constants', () => {
  test('JapaneseTaxForms should contain all common forms', () => {
    expect(JapaneseTaxForms.CONSUMPTION_TAX).toBe('消費税及び地方消費税の確定申告書')
    expect(JapaneseTaxForms.INCOME_TAX).toBe('所得税の確定申告書')
    expect(JapaneseTaxForms.CORPORATE_TAX).toBe('法人税の確定申告書')
    expect(JapaneseTaxForms.BLUE_RETURN).toBe('青色申告決算書')
  })
})

describe('Consumption Tax Rates Constants', () => {
  test('ConsumptionTaxRates should contain correct rates', () => {
    expect(ConsumptionTaxRates.STANDARD).toBe(10)
    expect(ConsumptionTaxRates.REDUCED).toBe(8)
    expect(ConsumptionTaxRates.OLD_STANDARD).toBe(8)
    expect(ConsumptionTaxRates.EXEMPT).toBe(0)
  })
})

describe('Japanese Entity Types Constants', () => {
  test('JapaneseEntityTypes should contain common business types', () => {
    expect(JapaneseEntityTypes.KABUSHIKI_KAISHA).toBe('株式会社（K.K.）')
    expect(JapaneseEntityTypes.GODO_KAISHA).toBe('合同会社（G.K.）')
    expect(JapaneseEntityTypes.KOJIN_JIGYO).toBe('個人事業主')
  })
})

describe('Japanese Prefectures Constants', () => {
  test('JapanesePrefectures should contain all 47 prefectures', () => {
    expect(JapanesePrefectures).toHaveLength(47)
    expect(JapanesePrefectures[0]).toBe('北海道')
    expect(JapanesePrefectures[12]).toBe('東京都')
    expect(JapanesePrefectures[26]).toBe('大阪府')
    expect(JapanesePrefectures[46]).toBe('沖縄県')
  })
})
