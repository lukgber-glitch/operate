/**
 * Japanese-specific formatting utilities for Japan market
 * Includes Japanese business terminology and formatting conventions
 */

import { formatCurrency, formatDate, formatNumber } from './locale-utils'

const JA_LOCALE = 'ja' as const

/**
 * Format amount in Japanese Yen (¥1,234)
 */
export function formatYen(amount: number): string {
  return formatCurrency(amount, JA_LOCALE, 'JPY')
}

/**
 * Format consumption tax (消費税) percentage for Japan
 * Current rate: 10% (standard), 8% (reduced)
 */
export function formatConsumptionTax(rate: number): string {
  return `消費税${formatNumber(rate, JA_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}%`
}

/**
 * Format consumption tax amount with label
 */
export function formatConsumptionTaxAmount(amount: number): string {
  return `消費税: ${formatYen(amount)}`
}

/**
 * Format taxable amount (課税標準額)
 */
export function formatTaxableAmount(amount: number): string {
  return `課税標準額: ${formatYen(amount)}`
}

/**
 * Format Japanese date with era (令和6年1月1日)
 * @param useEra - Whether to use Japanese era (default: false for business)
 */
export function formatJapaneseDate(
  date: Date | string | number,
  useEra: boolean = false
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  if (useEra) {
    // Use Japanese calendar with era (令和)
    return new Intl.DateTimeFormat(JA_LOCALE, {
      calendar: 'japanese',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj)
  }

  // Standard Gregorian format (YYYY年MM月DD日)
  return new Intl.DateTimeFormat(JA_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj)
}

/**
 * Format Japanese datetime
 */
export function formatJapaneseDateTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  return new Intl.DateTimeFormat(JA_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj)
}

/**
 * Format number with Japanese separators (1,234)
 * Note: Japanese uses same separators as English for numbers
 */
export function formatJapaneseNumber(value: number, decimals: number = 0): string {
  return formatNumber(value, JA_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format large numbers with Japanese units (万, 億, 兆)
 * 10,000 = 1万
 * 100,000,000 = 1億
 * 1,000,000,000,000 = 1兆
 */
export function formatJapaneseLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    const trillion = value / 1_000_000_000_000
    return `${formatJapaneseNumber(trillion, 2)}兆`
  } else if (value >= 100_000_000) {
    const oku = value / 100_000_000
    return `${formatJapaneseNumber(oku, 2)}億`
  } else if (value >= 10_000) {
    const man = value / 10_000
    return `${formatJapaneseNumber(man, 2)}万`
  }
  return formatJapaneseNumber(value, 0)
}

/**
 * Format amount in Yen with Japanese units for large numbers
 */
export function formatYenWithUnits(amount: number): string {
  return `¥${formatJapaneseLargeNumber(amount)}`
}

/**
 * Validate and format My Number (マイナンバー - Japanese Social Security Number)
 * Format: 1234-5678-9012 (12 digits)
 */
export function formatMyNumber(myNumber: string): string {
  const cleaned = myNumber.replace(/\D/g, '')
  if (cleaned.length !== 12) {
    return myNumber
  }
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
}

/**
 * Format Corporate Number (法人番号)
 * Format: 1234567890123 (13 digits)
 */
export function formatCorporateNumber(corpNumber: string): string {
  const cleaned = corpNumber.replace(/\D/g, '')
  if (cleaned.length !== 13) {
    return corpNumber
  }
  // Usually displayed without separators
  return cleaned
}

/**
 * Format Japanese postal code (〒123-4567)
 */
export function formatPostalCode(code: string): string {
  const cleaned = code.replace(/\D/g, '')
  if (cleaned.length === 7) {
    return `〒${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }
  return code
}

/**
 * Format Japanese address in proper order
 * Format: 〒XXX-XXXX 都道府県 市区町村 町域 番地 建物名
 */
export function formatJapaneseAddress(address: {
  postalCode?: string
  prefecture?: string
  city?: string
  street?: string
  building?: string
}): string {
  const parts: string[] = []

  if (address.postalCode) {
    parts.push(formatPostalCode(address.postalCode))
  }
  if (address.prefecture) {
    parts.push(address.prefecture)
  }
  if (address.city) {
    parts.push(address.city)
  }
  if (address.street) {
    parts.push(address.street)
  }
  if (address.building) {
    parts.push(address.building)
  }

  return parts.join(' ')
}

/**
 * Format invoice number with Japanese convention
 * Example: 令和6-0001 or 2024-0001
 */
export function formatInvoiceNumber(year: number, number: number, useEra: boolean = false): string {
  if (useEra) {
    // Convert to Reiwa era (令和 started in 2019)
    const reiwaYear = year - 2018
    return `令和${reiwaYear}-${String(number).padStart(4, '0')}`
  }
  return `${year}-${String(number).padStart(4, '0')}`
}

/**
 * Format tax period for Japanese quarterly/monthly returns
 */
export function formatTaxPeriod(period: number, year: number, type: 'quarterly' | 'monthly' = 'quarterly'): string {
  if (type === 'quarterly') {
    const quarters = [
      '第1四半期（1月～3月）',
      '第2四半期（4月～6月）',
      '第3四半期（7月～9月）',
      '第4四半期（10月～12月）'
    ]

    if (period < 1 || period > 4) {
      throw new Error('Quarter must be between 1 and 4')
    }

    return `${year}年 ${quarters[period - 1]}`
  } else {
    if (period < 1 || period > 12) {
      throw new Error('Month must be between 1 and 12')
    }
    return `${year}年${period}月`
  }
}

/**
 * Format Japanese fiscal year (会計年度)
 * Japanese fiscal year typically runs April to March
 */
export function formatFiscalYear(year: number): string {
  return `${year}年度（${year}年4月～${year + 1}年3月）`
}

/**
 * Format Japanese phone number
 * Examples:
 * - 03-1234-5678 (Tokyo landline)
 * - 090-1234-5678 (mobile)
 * - 0120-123-456 (toll-free)
 */
export function formatJapanesePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // Mobile (090, 080, 070)
  if (cleaned.match(/^(090|080|070)/) && cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  // Toll-free (0120, 0800)
  if (cleaned.match(/^(0120|0800)/) && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Tokyo (03)
  if (cleaned.match(/^03/) && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // Osaka (06)
  if (cleaned.match(/^06/) && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // Other area codes (usually 3-4 digits)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

/**
 * Add business honorific (様 for individuals, 御中 for companies)
 */
export function formatBusinessName(name: string, isCompany: boolean = false): string {
  if (isCompany) {
    return `${name}御中`
  }
  return `${name}様`
}

/**
 * Common Japanese tax form names
 */
export const JapaneseTaxForms = {
  CONSUMPTION_TAX: '消費税及び地方消費税の確定申告書',
  INCOME_TAX: '所得税の確定申告書',
  CORPORATE_TAX: '法人税の確定申告書',
  WITHHOLDING_TAX: '源泉所得税の納付書',
  YEAR_END_ADJUSTMENT: '年末調整',
  BLUE_RETURN: '青色申告決算書',
  WHITE_RETURN: '収支内訳書（白色申告）'
} as const

/**
 * Japanese consumption tax rates
 */
export const ConsumptionTaxRates = {
  STANDARD: 10,      // 標準税率
  REDUCED: 8,        // 軽減税率
  OLD_STANDARD: 8,   // 旧標準税率（2019年9月30日まで）
  EXEMPT: 0          // 非課税
} as const

/**
 * Get consumption tax rate label
 */
export function getConsumptionTaxLabel(rate: number): string {
  switch (rate) {
    case 10:
      return '標準税率（10%）'
    case 8:
      return '軽減税率（8%）'
    case 0:
      return '非課税'
    default:
      return `消費税（${rate}%）`
  }
}

/**
 * Format Japanese bank account
 * Format: 銀行名 支店名 口座種別 口座番号
 */
export function formatBankAccount(account: {
  bankName?: string
  branchName?: string
  accountType?: '普通' | '当座' | '貯蓄'
  accountNumber?: string
}): string {
  const parts: string[] = []

  if (account.bankName) {
    parts.push(account.bankName)
  }
  if (account.branchName) {
    parts.push(account.branchName)
  }
  if (account.accountType) {
    parts.push(account.accountType)
  }
  if (account.accountNumber) {
    parts.push(account.accountNumber)
  }

  return parts.join(' ')
}

/**
 * Japanese business entity types
 */
export const JapaneseEntityTypes = {
  KABUSHIKI_KAISHA: '株式会社（K.K.）',
  GODO_KAISHA: '合同会社（G.K.）',
  GOMEI_KAISHA: '合名会社',
  GOSHI_KAISHA: '合資会社',
  KOJIN_JIGYO: '個人事業主',
  YUGEN_KAISHA: '有限会社（Y.K.）',
  NPO: '特定非営利活動法人（NPO）'
} as const

/**
 * Format Japanese date range for business documents
 */
export function formatJapaneseDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number
): string {
  const start = typeof startDate === 'string' || typeof startDate === 'number'
    ? new Date(startDate)
    : startDate
  const end = typeof endDate === 'string' || typeof endDate === 'number'
    ? new Date(endDate)
    : endDate

  return `${formatJapaneseDate(start)}～${formatJapaneseDate(end)}`
}

/**
 * Format time in Japanese 24-hour format (HH時mm分)
 */
export function formatJapaneseTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date

  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()

  return `${String(hours).padStart(2, '0')}時${String(minutes).padStart(2, '0')}分`
}

/**
 * Format business hours (営業時間)
 */
export function formatBusinessHours(openTime: string, closeTime: string): string {
  return `営業時間: ${openTime}～${closeTime}`
}

/**
 * Format Japanese prefecture names
 */
export const JapanesePrefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
] as const
