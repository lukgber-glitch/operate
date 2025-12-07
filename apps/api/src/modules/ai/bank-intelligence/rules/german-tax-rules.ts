/**
 * German Tax Rules for EÜR (Einnahmen-Überschuss-Rechnung)
 * Comprehensive tax deduction rules for German freelancers and small businesses
 */

import { TaxCategory } from '../types/tax-categories.types';

/**
 * VAT (Umsatzsteuer) rates in Germany
 */
export const VAT_RATES = {
  /** Standard rate (Regelsteuersatz) */
  STANDARD: 0.19,

  /** Reduced rate (Ermäßigter Steuersatz) - books, newspapers, food, etc. */
  REDUCED: 0.07,

  /** Tax exempt (Steuerfrei) */
  EXEMPT: 0.0,
} as const;

/**
 * Documentation types required for tax deductions
 */
export type DocumentationType =
  | 'RECEIPT' // Simple receipt (Beleg)
  | 'INVOICE' // Full invoice (Rechnung)
  | 'CONTRACT' // Contract (Vertrag)
  | 'PROOF_OF_PAYMENT' // Payment proof (Zahlungsnachweis)
  | 'BEWIRTUNGSBELEG' // Special hospitality receipt
  | 'FAHRTENBUCH' // Mileage log
  | 'EIGENBELEG'; // Self-created receipt

/**
 * Deduction rule for a specific expense type
 */
export interface DeductionRule {
  /** Deduction percentage (0-100) or 'CALCULATED' for special calculations */
  percentage: number | 'CALCULATED' | 'FAHRTENBUCH_OR_1%';

  /** Required documentation type */
  documentation: DocumentationType | DocumentationType[];

  /** Special notes and requirements */
  notes?: string[];

  /** Maximum deductible amount per year (in cents) */
  maxAmountPerYear?: number;

  /** Maximum deductible amount per person per year (in cents, e.g., gifts) */
  maxAmountPerPersonPerYear?: number;

  /** VAT reclaimable? */
  vatReclaimable?: boolean;

  /** Requires specific documentation fields (e.g., guest names for Bewirtung) */
  specialRequirements?: string[];
}

/**
 * German tax deduction rules by category
 */
export const DEDUCTION_RULES: Record<string, DeductionRule> = {
  // 100% Deductible Business Expenses
  OFFICE_SUPPLIES: {
    percentage: 100,
    documentation: 'RECEIPT',
    vatReclaimable: true,
    notes: ['Büromaterial voll abzugsfähig'],
  },

  SOFTWARE: {
    percentage: 100,
    documentation: 'INVOICE',
    vatReclaimable: true,
    notes: [
      'Software-Abos und Lizenzen voll abzugsfähig',
      'Bei Kaufsoftware über 800€: ggf. Abschreibung über Nutzungsdauer',
    ],
  },

  CLOUD_SERVICES: {
    percentage: 100,
    documentation: 'INVOICE',
    vatReclaimable: true,
    notes: ['Cloud-Dienste (AWS, Azure, etc.) voll abzugsfähig'],
  },

  PROFESSIONAL_SERVICES: {
    percentage: 100,
    documentation: 'INVOICE',
    vatReclaimable: true,
    notes: ['Beratungsleistungen, Steuerberater, Rechtsanwalt voll abzugsfähig'],
  },

  OFFICE_RENT: {
    percentage: 100,
    documentation: ['CONTRACT', 'PROOF_OF_PAYMENT'],
    vatReclaimable: true,
    notes: [
      'Büromiete voll abzugsfähig',
      'Mietvertrag erforderlich',
      'Bei häuslichem Arbeitszimmer: besondere Regeln',
    ],
  },

  // Partial Deductions
  MEALS_BUSINESS: {
    percentage: 70,
    documentation: 'BEWIRTUNGSBELEG',
    vatReclaimable: false, // VAT not reclaimable on Bewirtung
    specialRequirements: [
      'Namen der bewirteten Personen',
      'Anlass der Bewirtung',
      'Ort und Datum',
      'Unterschrift',
    ],
    notes: [
      'Nur 70% abzugsfähig!',
      'Bewirtungsbeleg mit allen Angaben erforderlich',
      'Geschäftlicher Anlass muss dokumentiert sein',
    ],
  },

  HOME_OFFICE: {
    percentage: 'CALCULATED',
    documentation: ['CONTRACT', 'EIGENBELEG'],
    notes: [
      'Pauschale: 1.260€/Jahr (6€/Tag, max 210 Tage)',
      'Oder anteilige Miete nach qm',
      'Arbeitszimmer muss Mittelpunkt der Tätigkeit sein',
      'Oder: kein anderer Arbeitsplatz vorhanden',
    ],
    maxAmountPerYear: 126000, // 1,260 EUR in cents
  },

  CAR: {
    percentage: 'FAHRTENBUCH_OR_1%',
    documentation: ['FAHRTENBUCH', 'INVOICE'],
    vatReclaimable: true,
    notes: [
      'Fahrtenbuch: tatsächliche Kosten nach betrieblichem Anteil',
      '1%-Regelung: 1% des Bruttolistenpreises pro Monat',
      'Fahrtenbuch ist genauer bei hohem betrieblichen Anteil',
      'Benzinbelege, Reparaturen, Versicherung aufbewahren',
    ],
  },

  PHONE_INTERNET: {
    percentage: 50,
    documentation: 'INVOICE',
    vatReclaimable: true,
    notes: [
      'Standardmäßig 50% Geschäftsanteil',
      '100% möglich bei Einzelverbindungsnachweis',
      'Oder: Pauschale 20€/Monat ohne Nachweis',
    ],
  },

  MEALS_TRAVEL: {
    percentage: 0, // Use Verpflegungspauschalen instead
    documentation: 'RECEIPT',
    notes: [
      'Verpflegungspauschalen nutzen statt tatsächlicher Kosten',
      '> 8 Stunden: 14€',
      '> 24 Stunden: 28€',
      'An- und Abreisetag: 14€',
    ],
  },

  // Special Cases
  GIFTS: {
    percentage: 100,
    documentation: ['RECEIPT', 'EIGENBELEG'],
    maxAmountPerPersonPerYear: 3500, // 35 EUR in cents per person per year
    vatReclaimable: false,
    notes: [
      'Max 35€ pro Person und Jahr!',
      'Geschäftsbeziehung dokumentieren',
      'Empfänger notieren',
      'Werbekosten ohne Begrenzung',
    ],
  },

  TRAINING_EDUCATION: {
    percentage: 100,
    documentation: 'INVOICE',
    vatReclaimable: true,
    notes: [
      'Fortbildung voll abzugsfähig',
      'Beruflicher Bezug muss gegeben sein',
      'Erstausbildung nicht abzugsfähig',
    ],
  },

  INSURANCE_BUSINESS: {
    percentage: 100,
    documentation: ['INVOICE', 'CONTRACT'],
    vatReclaimable: false,
    notes: [
      'Nur betriebliche Versicherungen',
      'Berufshaftpflicht, Betriebshaftpflicht, etc.',
      'Private Versicherungen: Anlage Vorsorgeaufwand',
    ],
  },

  // Not Deductible
  PRIVATE_EXPENSES: {
    percentage: 0,
    documentation: 'RECEIPT',
    notes: ['Nicht abzugsfähig', 'Private Ausgaben'],
  },

  FINES_PENALTIES: {
    percentage: 0,
    documentation: 'RECEIPT',
    notes: [
      'Bußgelder und Strafen nicht abzugsfähig',
      'Auch betrieblich veranlasst',
    ],
  },

  DONATIONS: {
    percentage: 0, // Special deduction in Sonderausgaben, not Betriebsausgaben
    documentation: 'RECEIPT',
    notes: [
      'Spenden als Sonderausgaben, nicht Betriebsausgaben',
      'Separate Erfassung in Steuererklärung',
    ],
  },
};

/**
 * Income tax brackets for Germany (2024)
 * Progressive tax system
 */
export const INCOME_TAX_BRACKETS = [
  { min: 0, max: 11604, rate: 0.0, name: 'Grundfreibetrag' },
  { min: 11605, max: 17005, rate: 0.14, name: 'Progressionszone 1', progressive: true },
  { min: 17006, max: 66760, rate: 0.24, name: 'Progressionszone 2', progressive: true },
  { min: 66761, max: 277825, rate: 0.42, name: 'Spitzensteuersatz' },
  { min: 277826, max: Infinity, rate: 0.45, name: 'Reichensteuer' },
] as const;

/**
 * Solidarity surcharge (Solidaritätszuschlag)
 * 5.5% on income tax (with allowances)
 */
export const SOLIDARITY_SURCHARGE = {
  rate: 0.055,
  allowanceSingle: 16956, // Income tax amount below which no Soli is charged (singles)
  allowanceMarried: 33912, // Income tax amount below which no Soli is charged (married)
} as const;

/**
 * Trade tax (Gewerbesteuer) - only for Gewerbetreibende, not Freiberufler
 */
export const TRADE_TAX = {
  allowance: 24500, // EUR - Freibetrag
  baseRate: 0.035, // 3.5% base rate
  // Actual rate depends on municipality (Hebesatz)
  typicalHebesatz: 400, // 400% typical
  effectiveRate: 0.14, // 3.5% * 400% = 14%
} as const;

/**
 * VAT small business exemption (Kleinunternehmerregelung §19 UStG)
 */
export const SMALL_BUSINESS_EXEMPTION = {
  revenueThresholdPreviousYear: 22000, // EUR
  revenueThresholdCurrentYear: 50000, // EUR
} as const;

/**
 * Low-value assets (Geringwertige Wirtschaftsgüter - GWG)
 */
export const GWG_LIMITS = {
  /** Items below this can be immediately expensed (no AfA) */
  immediateExpense: 80000, // 800 EUR in cents (net)

  /** Items below this can be pooled and depreciated over 5 years */
  poolDepreciation: 100000, // 1,000 EUR in cents (net)
} as const;

/**
 * Mileage rates (Kilometerpauschale)
 */
export const MILEAGE_RATES = {
  /** Car: 0.30 EUR per km (first 20km one-way) */
  carFirst20km: 0.3,

  /** Car: 0.38 EUR per km (from 21st km one-way) - since 2022 */
  carAbove20km: 0.38,

  /** Motorcycle: 0.20 EUR per km */
  motorcycle: 0.2,

  /** Bicycle: no official rate, but 0.05-0.10 EUR accepted */
  bicycle: 0.05,
} as const;

/**
 * Daily meal allowances (Verpflegungspauschalen) for business trips
 */
export const MEAL_ALLOWANCES = {
  /** Absence > 8 hours: 14 EUR */
  over8hours: 14,

  /** Absence 24 hours: 28 EUR */
  fullDay: 28,

  /** Arrival/Departure day: 14 EUR */
  arrivalDeparture: 14,

  /** Foreign countries have different rates */
  foreign: {
    // Examples (full rates vary by country)
    usa: 68,
    uk: 48,
    france: 53,
    austria: 42,
  },
} as const;

/**
 * Map TaxCategory to deduction rules
 */
export function getDeductionRuleForCategory(category: TaxCategory): DeductionRule {
  switch (category) {
    case TaxCategory.BUEROKOSTEN:
      return DEDUCTION_RULES.OFFICE_SUPPLIES;

    case TaxCategory.SONSTIGE_KOSTEN:
      return {
        percentage: 100,
        documentation: 'RECEIPT',
        vatReclaimable: true,
        notes: ['Sonstige Betriebsausgaben voll abzugsfähig'],
      };

    case TaxCategory.TELEFON_INTERNET:
      return DEDUCTION_RULES.PHONE_INTERNET;

    case TaxCategory.BEWIRTUNG:
      return DEDUCTION_RULES.MEALS_BUSINESS;

    case TaxCategory.KFZKOSTEN:
      return DEDUCTION_RULES.CAR;

    case TaxCategory.WERBUNG:
      return DEDUCTION_RULES.GIFTS; // Gifts are part of Werbung

    case TaxCategory.VERSICHERUNGEN:
      return DEDUCTION_RULES.INSURANCE_BUSINESS;

    case TaxCategory.RECHTSBERATUNG:
      return DEDUCTION_RULES.PROFESSIONAL_SERVICES;

    case TaxCategory.MIETE_PACHT:
      return DEDUCTION_RULES.OFFICE_RENT;

    case TaxCategory.REISEKOSTEN:
      return {
        percentage: 100,
        documentation: 'RECEIPT',
        vatReclaimable: true,
        notes: [
          'Reisekosten voll abzugsfähig',
          'Verpflegungspauschalen nutzen',
          'Geschäftlicher Anlass dokumentieren',
        ],
      };

    case TaxCategory.FREMDLEISTUNGEN:
    case TaxCategory.PERSONAL:
    case TaxCategory.WAREN_MATERIAL:
    case TaxCategory.ABSCHREIBUNGEN:
    case TaxCategory.ZINSEN:
      return {
        percentage: 100,
        documentation: 'INVOICE',
        vatReclaimable: true,
        notes: ['Voll abzugsfähig mit Rechnung/Vertrag'],
      };

    case TaxCategory.PRIVATE_ENTNAHME:
    case TaxCategory.PRIVATE_EINLAGE:
    case TaxCategory.KEINE_STEUERRELEVANZ:
      return {
        percentage: 0,
        documentation: 'EIGENBELEG',
        notes: ['Keine steuerliche Relevanz'],
      };

    // Income categories
    case TaxCategory.EINNAHMEN_7:
    case TaxCategory.EINNAHMEN_19:
    case TaxCategory.EINNAHMEN_STEUERFREI:
    case TaxCategory.EINNAHMEN_KLEINUNTERNEHMER:
      return {
        percentage: 0,
        documentation: 'INVOICE',
        notes: ['Einnahmen - keine Abzüge'],
      };

    default:
      return {
        percentage: 100,
        documentation: 'RECEIPT',
        vatReclaimable: true,
        notes: ['Standard-Betriebsausgabe'],
      };
  }
}

/**
 * Calculate income tax based on German progressive tax system
 */
export function calculateIncomeTax(taxableIncome: number): {
  tax: number;
  effectiveRate: number;
  bracket: string;
} {
  if (taxableIncome <= 11604) {
    return { tax: 0, effectiveRate: 0, bracket: 'Grundfreibetrag' };
  }

  let tax = 0;

  // Simplified calculation (actual German formula is more complex with polynomials)
  if (taxableIncome <= 17005) {
    // Progressive zone 1: 14% to 24%
    const base = taxableIncome - 11604;
    tax = (base * 0.14) + (base * base * 0.000097); // Simplified
  } else if (taxableIncome <= 66760) {
    // Progressive zone 2: 24% to 42%
    const zone1Tax = (17005 - 11604) * 0.14 + ((17005 - 11604) ** 2) * 0.000097;
    const base = taxableIncome - 17005;
    tax = zone1Tax + (base * 0.24) + (base * base * 0.000018); // Simplified
  } else if (taxableIncome <= 277825) {
    // Top rate: 42%
    const zone1Tax = (17005 - 11604) * 0.14 + ((17005 - 11604) ** 2) * 0.000097;
    const zone2Tax = (66760 - 17005) * 0.24 + ((66760 - 17005) ** 2) * 0.000018;
    const base = taxableIncome - 66760;
    tax = zone1Tax + zone2Tax + (base * 0.42);
  } else {
    // Wealth tax: 45%
    const zone1Tax = (17005 - 11604) * 0.14 + ((17005 - 11604) ** 2) * 0.000097;
    const zone2Tax = (66760 - 17005) * 0.24 + ((66760 - 17005) ** 2) * 0.000018;
    const zone3Tax = (277825 - 66760) * 0.42;
    const base = taxableIncome - 277825;
    tax = zone1Tax + zone2Tax + zone3Tax + (base * 0.45);
  }

  const effectiveRate = tax / taxableIncome;
  const bracket = INCOME_TAX_BRACKETS.find(
    (b) => taxableIncome >= b.min && taxableIncome <= b.max,
  )?.name || 'Unknown';

  return {
    tax: Math.round(tax),
    effectiveRate,
    bracket,
  };
}

/**
 * Calculate solidarity surcharge
 */
export function calculateSolidaritySurcharge(
  incomeTax: number,
  isMarried = false,
): number {
  const allowance = isMarried
    ? SOLIDARITY_SURCHARGE.allowanceMarried
    : SOLIDARITY_SURCHARGE.allowanceSingle;

  if (incomeTax <= allowance) {
    return 0;
  }

  return Math.round(incomeTax * SOLIDARITY_SURCHARGE.rate);
}

/**
 * Extract VAT from gross amount (reverse calculation)
 */
export function extractVatFromGross(
  grossAmount: number,
  vatRate: number,
): { net: number; vat: number } {
  const net = Math.round(grossAmount / (1 + vatRate));
  const vat = grossAmount - net;

  return { net, vat };
}

/**
 * Calculate VAT amount from net
 */
export function calculateVat(netAmount: number, vatRate: number): number {
  return Math.round(netAmount * vatRate);
}

/**
 * Check if amount qualifies as GWG (low-value asset)
 */
export function isGWG(netAmount: number): {
  isGWG: boolean;
  canImmediatelyExpense: boolean;
  canPool: boolean;
} {
  const canImmediatelyExpense = netAmount <= GWG_LIMITS.immediateExpense;
  const canPool =
    netAmount > GWG_LIMITS.immediateExpense &&
    netAmount <= GWG_LIMITS.poolDepreciation;

  return {
    isGWG: canImmediatelyExpense || canPool,
    canImmediatelyExpense,
    canPool,
  };
}
