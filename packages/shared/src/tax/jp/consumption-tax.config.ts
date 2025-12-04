/**
 * Japanese Consumption Tax (消費税 - Shōhizei) Configuration
 * Qualified Invoice System (適格請求書等保存方式 - インボイス制度) Support
 * Task: W27-T4 - Japanese tax configuration
 */

/**
 * Consumption Tax Rates (消費税率)
 * Current rates as of October 1, 2019
 */
export const JAPAN_CONSUMPTION_TAX_RATES = {
  STANDARD: 10.0, // 標準税率 (Hyōjun zeiritsu)
  REDUCED: 8.0, // 軽減税率 (Keigen zeiritsu)
  ZERO: 0.0, // 非課税 (Hikazei) or 免税 (Menzei)
} as const;

/**
 * Tax breakdown for transparency
 * National (国税) + Local (地方税) consumption tax
 */
export const JAPAN_TAX_BREAKDOWN = {
  STANDARD: {
    total: 10.0,
    national: 7.8, // 国税 (Kokuzei)
    local: 2.2, // 地方消費税 (Chihō shōhizei)
  },
  REDUCED: {
    total: 8.0,
    national: 6.24, // 国税
    local: 1.76, // 地方消費税
  },
} as const;

/**
 * Tax Categories for Japan
 */
export const JAPAN_TAX_CATEGORIES = {
  STANDARD: 'STANDARD', // 標準税率対象 - Standard rate items
  REDUCED: 'REDUCED', // 軽減税率対象 - Reduced rate items
  EXEMPT: 'EXEMPT', // 非課税 - Tax-exempt items
  TAX_FREE: 'TAX_FREE', // 免税 - Tax-free (exports, duty-free sales)
} as const;

/**
 * Reduced Rate Items (軽減税率対象品目)
 * Effective from October 1, 2019
 */
export const JAPAN_REDUCED_RATE_ITEMS = {
  FOOD_AND_BEVERAGES: {
    description: '飲食料品 - Food and beverages',
    rate: 8.0,
    examples: [
      'Food for human consumption (excluding alcohol)',
      'Non-alcoholic beverages',
      'Takeout food',
      'Delivered food (e.g., Uber Eats)',
      'Groceries',
      'Packaged food items',
    ],
    exclusions: [
      'Alcoholic beverages',
      'Dining in restaurants (standard 10%)',
      'Catering services (standard 10%)',
      'Medicine and supplements',
    ],
    notes: 'Takeout = 8%, Eat-in = 10%',
  },
  NEWSPAPERS: {
    description: '新聞 - Newspapers',
    rate: 8.0,
    examples: [
      'Subscription newspapers (twice weekly or more)',
      'Daily newspapers',
      'Sports newspapers (if published 2+ times/week)',
    ],
    conditions: [
      'Must be published at least twice per week',
      'Must be subscription-based (定期購読)',
      'Electronic newspapers do not qualify',
    ],
  },
} as const;

/**
 * Tax-Exempt Items (非課税取引)
 * These items are not subject to consumption tax
 */
export const JAPAN_TAX_EXEMPT_ITEMS = {
  LAND: 'Sale or lease of land',
  SECURITIES: 'Transfer of securities',
  INTEREST_INCOME: 'Interest on deposits and loans',
  POSTAL_STAMPS: 'Postal stamps and revenue stamps',
  GOVERNMENT_FEES: 'Government administrative fees',
  MEDICAL_SERVICES: 'Medical care services covered by insurance',
  SOCIAL_WELFARE: 'Social welfare services',
  EDUCATION: 'Tuition fees for schools',
  HOUSING_RENT: 'Residential property rental (non-commercial)',
} as const;

/**
 * Tax-Free Items (免税取引)
 * These items have 0% tax rate
 */
export const JAPAN_TAX_FREE_ITEMS = {
  EXPORTS: 'Export of goods',
  INTERNATIONAL_TRANSPORT: 'International transportation services',
  FOREIGN_SERVICES: 'Services provided to foreign businesses',
  DUTY_FREE_SALES: 'Duty-free sales to foreign tourists (over ¥5,000)',
} as const;

/**
 * Qualified Invoice System (適格請求書等保存方式 - インボイス制度)
 * Effective: October 1, 2023
 */
export const JAPAN_QUALIFIED_INVOICE_SYSTEM = {
  effectiveDate: '2023-10-01',
  name: '適格請求書等保存方式',
  nameEnglish: 'Qualified Invoice System',
  shortName: 'インボイス制度',

  requirements: {
    registrationNumber: {
      required: true,
      format: 'T + 13 digits',
      description: '登録番号 (Tōroku bangō) - Invoice Registration Number',
      prefix: 'T',
      length: 14, // 'T' + 13 digits
    },
    mandatoryFields: [
      "Supplier's name and Invoice Registration Number (T番号)",
      'Transaction date (取引年月日)',
      'Description of goods/services (取引内容)',
      'Total amount including tax (税込金額)',
      'Tax rate and tax amount by rate (税率ごとの消費税額)',
      "Recipient's name (買手の氏名または名称)",
    ],
    taxBreakdown: {
      required: true,
      description: 'Must show tax amount separately for 10% and 8% rates',
      example: {
        subtotal10: '¥10,000',
        tax10: '¥1,000',
        subtotal8: '¥5,000',
        tax8: '¥400',
        total: '¥16,400',
      },
    },
  },

  registration: {
    authority: '国税庁 (National Tax Agency)',
    process: 'Application to NTA required',
    eligibility: 'VAT-registered businesses (課税事業者)',
    exemptBusiness: {
      note: '免税事業者 (Tax-exempt businesses) must register to issue qualified invoices',
      threshold: '¥10,000,000 annual sales',
    },
  },

  transitionPeriod: {
    phase1: {
      period: '2023-10-01 to 2026-09-30',
      deductionRate: 80,
      description: '80% of tax on non-qualified invoices can be deducted',
    },
    phase2: {
      period: '2026-10-01 to 2029-09-30',
      deductionRate: 50,
      description: '50% of tax on non-qualified invoices can be deducted',
    },
    phase3: {
      period: '2029-10-01 onwards',
      deductionRate: 0,
      description: 'No deduction for non-qualified invoices',
    },
  },
} as const;

/**
 * Tax Filing Periods
 */
export const JAPAN_TAX_PERIODS = {
  ANNUAL: {
    description: '年次申告 - Annual filing',
    applicableTo: 'Most businesses',
    filingDeadline: 'Within 2 months after fiscal year end',
    form: '消費税及び地方消費税の確定申告書',
  },
  QUARTERLY: {
    description: '中間申告（四半期） - Quarterly interim filing',
    applicableTo: 'Businesses with annual tax over ¥4,800,000',
    filingDeadline: 'Within 2 months after each quarter',
    note: 'Optional for eligible businesses',
  },
  MONTHLY: {
    description: '中間申告（毎月） - Monthly interim filing',
    applicableTo: 'Businesses with annual tax over ¥48,000,000',
    filingDeadline: 'Within 2 months after each month',
    mandatory: true,
  },
} as const;

/**
 * Filing Thresholds
 */
export const JAPAN_FILING_THRESHOLDS = {
  SMALL_BUSINESS_EXEMPTION: {
    amount: 10_000_000, // ¥10 million
    currency: 'JPY',
    description: '小規模事業者の納税義務免除',
    note: 'Businesses with annual taxable sales below this are exempt from consumption tax filing',
    baseYear: '2 years prior (基準期間)',
  },
  QUARTERLY_INTERIM_THRESHOLD: {
    amount: 4_800_000, // ¥4.8 million annual tax
    currency: 'JPY',
    description: 'Threshold for quarterly interim filing',
  },
  MONTHLY_INTERIM_THRESHOLD: {
    amount: 48_000_000, // ¥48 million annual tax
    currency: 'JPY',
    description: 'Threshold for mandatory monthly interim filing',
  },
} as const;

/**
 * Tax Inclusive Pricing Display
 * Japan requires tax-inclusive pricing for consumer-facing prices
 */
export const JAPAN_PRICING_DISPLAY = {
  required: true,
  effectiveDate: '2021-04-01',
  name: '総額表示義務 (Sōgaku hyōji gimu)',
  description: 'Mandatory tax-inclusive pricing display',
  rules: {
    consumerFacing: {
      required: true,
      format: 'Must show tax-inclusive price prominently',
      examples: [
        '¥1,100 (税込)',
        '¥1,100 (税込み)',
        '¥1,100 (内税)',
      ],
      optional: 'Tax-exclusive price may be shown in smaller print',
    },
    b2b: {
      required: false,
      note: 'B2B transactions may show tax-exclusive prices',
    },
  },
} as const;

/**
 * Historical Tax Rates
 */
export const JAPAN_HISTORICAL_TAX_RATES = [
  {
    effectiveDate: '1989-04-01',
    rate: 3.0,
    description: 'Introduction of consumption tax',
  },
  {
    effectiveDate: '1997-04-01',
    rate: 5.0,
    description: 'First rate increase',
  },
  {
    effectiveDate: '2014-04-01',
    rate: 8.0,
    description: 'Second rate increase',
  },
  {
    effectiveDate: '2019-10-01',
    rate: 10.0,
    description: 'Current rate with reduced rate introduction',
    notes: 'Introduced 8% reduced rate for food and newspapers',
  },
] as const;

/**
 * Penalties for Late Filing
 */
export const JAPAN_PENALTIES = {
  LATE_FILING: {
    baseRate: 5, // 5% penalty
    overOneMonth: 10, // 10% if over 1 month late
    over2Months: 15, // 15% if over 2 months late
    maxRate: 40, // Maximum 40% for fraudulent cases
  },
  LATE_PAYMENT: {
    dailyRate: 0.01, // Approximately 3.65% annual
    description: '延滞税 (Entaizei) - Late payment tax',
    calculation: 'Calculated from day after deadline',
  },
  UNDER_REPORTING: {
    baseRate: 10, // 10% penalty
    over50million: 15, // 15% if underreporting exceeds ¥50 million
    description: '過少申告加算税 (Kashō shinkoku kasanzei)',
  },
  NON_FILING: {
    baseRate: 15, // 15% penalty
    description: '無申告加算税 (Mushinkoku kasanzei)',
    maxRate: 40, // Up to 40% for malicious non-filing
  },
} as const;

/**
 * Tax Authority Information
 */
export const JAPAN_TAX_AUTHORITY = {
  name: '国税庁',
  nameEnglish: 'National Tax Agency (NTA)',
  abbreviation: 'NTA',
  website: 'https://www.nta.go.jp',
  e_tax_system: {
    name: 'e-Tax',
    website: 'https://www.e-tax.nta.go.jp',
    description: 'Electronic tax filing system',
    required: 'Mandatory for most businesses',
  },
  invoiceRegistration: {
    website: 'https://www.invoice-kohyo.nta.go.jp',
    description: 'Qualified Invoice Registration System',
  },
} as const;

/**
 * Consumption Tax Calculation Methods
 */
export const JAPAN_TAX_CALCULATION_METHODS = {
  GENERAL_METHOD: {
    name: '一般課税方式 (Ippan kazei hōshiki)',
    description: 'Input tax credit method',
    calculation: 'Output tax - Input tax = Tax payable',
    applicableTo: 'Most businesses',
  },
  SIMPLIFIED_METHOD: {
    name: '簡易課税方式 (Kan\'i kazei hōshiki)',
    description: 'Simplified tax calculation',
    eligibility: 'Businesses with annual taxable sales ≤ ¥50 million',
    calculation: 'Output tax × (1 - deemed purchase rate)',
    deemedPurchaseRates: {
      TYPE1: { rate: 90, description: 'Wholesale' },
      TYPE2: { rate: 80, description: 'Retail' },
      TYPE3: { rate: 70, description: 'Manufacturing' },
      TYPE4: { rate: 60, description: 'Restaurants, food services' },
      TYPE5: { rate: 50, description: 'Services, transportation, finance' },
      TYPE6: { rate: 40, description: 'Real estate' },
    },
    note: 'Must file notification to use this method',
  },
} as const;

/**
 * Tax Return Forms
 */
export const JAPAN_TAX_FORMS = {
  ANNUAL_RETURN: '消費税及び地方消費税の確定申告書',
  INTERIM_RETURN: '消費税及び地方消費税の中間申告書',
  SIMPLIFIED_RETURN: '消費税簡易課税制度選択届出書',
  REGISTRATION_NOTIFICATION: '課税事業者届出書',
  INVOICE_REGISTRATION: '適格請求書発行事業者の登録申請書',
} as const;
