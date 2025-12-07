/**
 * Vendor Pattern Recognition
 * Common vendors and their tax categories
 */

import { TaxCategory } from '../types/tax-categories.types';

/**
 * Vendor pattern definition
 */
export interface VendorPattern {
  /** Pattern to match in transaction description */
  patterns: string[];

  /** Normalized vendor name */
  vendorName: string;

  /** Vendor category */
  category: string;

  /** Default tax category */
  taxCategory: TaxCategory;

  /** Is this typically recurring? */
  recurring: boolean;

  /** Typical frequency if recurring */
  frequency?: 'MONTHLY' | 'YEARLY' | 'QUARTERLY';

  /** Business percentage (default 100) */
  businessPercentage?: number;

  /** Notes for classification */
  notes?: string;
}

/**
 * Common vendor patterns for auto-classification
 */
export const VENDOR_PATTERNS: VendorPattern[] = [
  // Cloud Services
  {
    patterns: ['aws', 'amazon web services'],
    vendorName: 'Amazon Web Services',
    category: 'Cloud Services',
    taxCategory: TaxCategory.FREMDLEISTUNGEN,
    recurring: true,
    frequency: 'MONTHLY',
    notes: 'Cloud infrastructure costs',
  },
  {
    patterns: ['google cloud', 'gcp', 'google workspace', 'gsuite'],
    vendorName: 'Google Cloud',
    category: 'Cloud Services',
    taxCategory: TaxCategory.FREMDLEISTUNGEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['microsoft azure', 'azure'],
    vendorName: 'Microsoft Azure',
    category: 'Cloud Services',
    taxCategory: TaxCategory.FREMDLEISTUNGEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['digitalocean', 'digital ocean'],
    vendorName: 'DigitalOcean',
    category: 'Cloud Services',
    taxCategory: TaxCategory.FREMDLEISTUNGEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['heroku'],
    vendorName: 'Heroku',
    category: 'Cloud Services',
    taxCategory: TaxCategory.FREMDLEISTUNGEN,
    recurring: true,
    frequency: 'MONTHLY',
  },

  // Software Subscriptions
  {
    patterns: ['adobe', 'creative cloud'],
    vendorName: 'Adobe',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['microsoft 365', 'office 365', 'm365'],
    vendorName: 'Microsoft 365',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['github', 'gh'],
    vendorName: 'GitHub',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['slack'],
    vendorName: 'Slack',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['notion'],
    vendorName: 'Notion',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['figma'],
    vendorName: 'Figma',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['canva'],
    vendorName: 'Canva',
    category: 'Software Subscription',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },

  // Communication
  {
    patterns: ['telekom', 'deutsche telekom', 't-mobile'],
    vendorName: 'Deutsche Telekom',
    category: 'Telecommunications',
    taxCategory: TaxCategory.TELEFON_INTERNET,
    recurring: true,
    frequency: 'MONTHLY',
    businessPercentage: 50,
    notes: 'Often mixed business/private use - default 50%',
  },
  {
    patterns: ['vodafone'],
    vendorName: 'Vodafone',
    category: 'Telecommunications',
    taxCategory: TaxCategory.TELEFON_INTERNET,
    recurring: true,
    frequency: 'MONTHLY',
    businessPercentage: 50,
  },
  {
    patterns: ['o2', 'o2 germany'],
    vendorName: 'O2',
    category: 'Telecommunications',
    taxCategory: TaxCategory.TELEFON_INTERNET,
    recurring: true,
    frequency: 'MONTHLY',
    businessPercentage: 50,
  },
  {
    patterns: ['1&1', '1und1'],
    vendorName: '1&1',
    category: 'Telecommunications',
    taxCategory: TaxCategory.TELEFON_INTERNET,
    recurring: true,
    frequency: 'MONTHLY',
    businessPercentage: 50,
  },

  // Office Supplies
  {
    patterns: ['amazon', 'amzn'],
    vendorName: 'Amazon',
    category: 'Office Supplies',
    taxCategory: TaxCategory.BUEROKOSTEN,
    recurring: false,
    notes: 'Check if business-related',
  },
  {
    patterns: ['staples'],
    vendorName: 'Staples',
    category: 'Office Supplies',
    taxCategory: TaxCategory.BUEROKOSTEN,
    recurring: false,
  },

  // Bookkeeping & Accounting
  {
    patterns: ['lexoffice', 'lex office'],
    vendorName: 'LexOffice',
    category: 'Accounting Software',
    taxCategory: TaxCategory.RECHTSBERATUNG,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['sevdesk', 'sev desk'],
    vendorName: 'SevDesk',
    category: 'Accounting Software',
    taxCategory: TaxCategory.RECHTSBERATUNG,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['datev'],
    vendorName: 'DATEV',
    category: 'Accounting Software',
    taxCategory: TaxCategory.RECHTSBERATUNG,
    recurring: true,
    frequency: 'MONTHLY',
  },

  // Payment Processing
  {
    patterns: ['stripe'],
    vendorName: 'Stripe',
    category: 'Payment Processing',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },
  {
    patterns: ['paypal'],
    vendorName: 'PayPal',
    category: 'Payment Processing',
    taxCategory: TaxCategory.SONSTIGE_KOSTEN,
    recurring: true,
    frequency: 'MONTHLY',
  },

  // Transportation
  {
    patterns: ['shell', 'aral', 'esso', 'total', 'jet tankstelle'],
    vendorName: 'Fuel',
    category: 'Vehicle Fuel',
    taxCategory: TaxCategory.KFZKOSTEN,
    recurring: false,
  },
  {
    patterns: ['uber', 'uber trip'],
    vendorName: 'Uber',
    category: 'Transportation',
    taxCategory: TaxCategory.REISEKOSTEN,
    recurring: false,
  },
  {
    patterns: ['deutsche bahn', 'db bahn', 'db vertrieb'],
    vendorName: 'Deutsche Bahn',
    category: 'Transportation',
    taxCategory: TaxCategory.REISEKOSTEN,
    recurring: false,
  },

  // Hotels & Accommodation
  {
    patterns: ['booking.com', 'booking com'],
    vendorName: 'Booking.com',
    category: 'Accommodation',
    taxCategory: TaxCategory.REISEKOSTEN,
    recurring: false,
  },
  {
    patterns: ['airbnb'],
    vendorName: 'Airbnb',
    category: 'Accommodation',
    taxCategory: TaxCategory.REISEKOSTEN,
    recurring: false,
  },

  // Restaurants (Bewirtung)
  {
    patterns: ['restaurant', 'gasthaus', 'bistro', 'cafe'],
    vendorName: 'Restaurant',
    category: 'Business Meals',
    taxCategory: TaxCategory.BEWIRTUNG,
    recurring: false,
    notes: '70% deductible - requires guest names and business purpose',
  },

  // Insurance
  {
    patterns: ['allianz', 'axa', 'ergo', 'huk coburg'],
    vendorName: 'Insurance',
    category: 'Business Insurance',
    taxCategory: TaxCategory.VERSICHERUNGEN,
    recurring: true,
    frequency: 'MONTHLY',
  },

  // Rent/Office
  {
    patterns: ['miete', 'kaltmiete', 'warmmiete'],
    vendorName: 'Rent',
    category: 'Office Rent',
    taxCategory: TaxCategory.MIETE_PACHT,
    recurring: true,
    frequency: 'MONTHLY',
  },
];

/**
 * Find matching vendor pattern
 */
export function findVendorPattern(description: string): VendorPattern | null {
  const normalizedDesc = description.toLowerCase();

  for (const vendor of VENDOR_PATTERNS) {
    for (const pattern of vendor.patterns) {
      if (normalizedDesc.includes(pattern.toLowerCase())) {
        return vendor;
      }
    }
  }

  return null;
}

/**
 * Extract vendor name from description
 */
export function extractVendorName(description: string): string {
  const pattern = findVendorPattern(description);
  if (pattern) {
    return pattern.vendorName;
  }

  // Try to extract from description
  // Remove common prefixes
  const cleaned = description
    .replace(/^(SEPA|Lastschrift|Überweisung|Kartenzahlung|POS)\s*/i, '')
    .replace(/\s+\d{2}\.\d{2}\.\d{4}.*$/, '') // Remove dates
    .replace(/\s+\d+[,.]?\d*\s*(EUR|€).*$/, '') // Remove amounts
    .trim();

  return cleaned.split(/\s{2,}/)[0] || cleaned;
}

/**
 * Determine if transaction is likely recurring
 */
export function isLikelyRecurring(description: string): boolean {
  const pattern = findVendorPattern(description);
  if (pattern) {
    return pattern.recurring;
  }

  // Check for recurring indicators
  const recurringIndicators = [
    'abonnement',
    'subscription',
    'monthly',
    'monatlich',
    'jährlich',
    'yearly',
    'abo',
    'mitgliedschaft',
    'membership',
  ];

  const normalizedDesc = description.toLowerCase();
  return recurringIndicators.some((indicator) =>
    normalizedDesc.includes(indicator),
  );
}
