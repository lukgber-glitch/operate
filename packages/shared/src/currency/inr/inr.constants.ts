/**
 * INR Currency Constants
 * Indian Rupee formatting and configuration
 */

export const INR_CONSTANTS = {
  code: 'INR',
  symbol: '₹',
  symbolAlt: 'Rs.',
  name: 'Indian Rupee',
  namePlural: 'Indian Rupees',
  nameHindi: 'रुपया',
  namePluralHindi: 'रुपये',

  // ISO 4217
  numericCode: 356,

  // INR has 2 decimal places
  decimalDigits: 2,

  // Formatting - Indian numbering system
  symbolNative: '₹',
  symbolPosition: 'prefix', // ₹1,00,000.00
  thousandSeparator: ',',
  decimalSeparator: '.',

  // Indian numbering system uses different grouping
  // Format: 3 digits, then groups of 2 (e.g., 1,00,00,000)
  numberingSystem: 'indian', // vs 'western' which is 3,3,3

  // Minor unit
  minorUnit: {
    name: 'Paisa',
    namePlural: 'Paise',
    nameHindi: 'पैसा',
    namePluralHindi: 'पैसे',
    ratio: 100, // 100 paise = 1 rupee
  },

  // Common Indian units
  units: {
    lakh: {
      value: 100000, // 1,00,000
      name: 'Lakh',
      nameHindi: 'लाख',
      symbol: 'L',
    },
    crore: {
      value: 10000000, // 1,00,00,000
      name: 'Crore',
      nameHindi: 'करोड़',
      symbol: 'Cr',
    },
    thousand: {
      value: 1000,
      name: 'Thousand',
      nameHindi: 'हज़ार',
      symbol: 'K',
    },
  },
} as const;

/**
 * Exchange rate pairs for INR
 */
export const INR_EXCHANGE_PAIRS = [
  'INR/USD',
  'INR/EUR',
  'INR/GBP',
  'INR/AED',
  'INR/SAR',
  'INR/JPY',
  'INR/SGD',
  'INR/AUD',
  'INR/CAD',
  'INR/CHF',
  'INR/CNY',
  'USD/INR',
  'EUR/INR',
  'GBP/INR',
  'AED/INR',
  'SAR/INR',
  'JPY/INR',
  'SGD/INR',
] as const;

/**
 * Typical INR amount ranges for validation
 */
export const INR_RANGES = {
  minAmount: 0.01, // 1 paisa
  maxAmount: 99999999999.99, // ~1 trillion INR

  // Common business thresholds
  smallTransaction: 1000, // ₹1,000
  mediumTransaction: 100000, // ₹1 lakh
  largeTransaction: 10000000, // ₹1 crore

  // India specific thresholds (Financial Year 2024-25)
  gst_registration_threshold: 4000000, // ₹40 lakhs (normal states)
  gst_registration_threshold_ne: 2000000, // ₹20 lakhs (NE & hill states)
  gst_composition_threshold: 15000000, // ₹1.5 crore

  // Income tax thresholds (AY 2024-25)
  income_tax_basic_exemption: 300000, // ₹3 lakhs (new regime)
  income_tax_basic_exemption_old: 250000, // ₹2.5 lakhs (old regime)
  income_tax_senior_citizen: 300000, // ₹3 lakhs
  income_tax_super_senior_citizen: 500000, // ₹5 lakhs

  // TDS thresholds
  tds_salary_threshold: 250000, // ₹2.5 lakhs
  tds_professional_services: 30000, // ₹30,000 (per transaction)
  tds_rent: 240000, // ₹2.4 lakhs (annual)
} as const;

/**
 * Devanagari numerals for Hindi formatting (optional)
 */
export const DEVANAGARI_NUMERALS = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
} as const;

/**
 * Indian number names (for number to words conversion)
 */
export const INDIAN_NUMBER_NAMES = {
  ones: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
  teens: [
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ],
  tens: ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
  units: {
    hundred: 'hundred',
    thousand: 'thousand',
    lakh: 'lakh',
    crore: 'crore',
  },
} as const;

/**
 * Hindi number names (for Hindi number to words conversion)
 */
export const HINDI_NUMBER_NAMES = {
  ones: ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ'],
  teens: [
    'दस',
    'ग्यारह',
    'बारह',
    'तेरह',
    'चौदह',
    'पंद्रह',
    'सोलह',
    'सत्रह',
    'अठारह',
    'उन्नीस',
  ],
  tens: ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'],
  units: {
    hundred: 'सौ',
    thousand: 'हज़ार',
    lakh: 'लाख',
    crore: 'करोड़',
  },
} as const;

export type INRExchangePair = (typeof INR_EXCHANGE_PAIRS)[number];
