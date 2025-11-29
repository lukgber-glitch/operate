/**
 * German Deduction Rules
 *
 * Based on German tax law (EStG - Einkommensteuergesetz)
 */

import { DeductionRule } from '../types';

import {
  TransactionCategories as TC,
  DeductionCategoryCodes as DCC,
  DepreciationLimits,
  condition,
} from './base-rules';

/**
 * German deduction rules
 *
 * References:
 * - §9 EStG: Werbungskosten (Work-related expenses for employees)
 * - §4 EStG: Betriebsausgaben (Business expenses for self-employed)
 */
export const GERMANY_RULES: DeductionRule[] = [
  // =========================================================================
  // WORK EQUIPMENT (Arbeitsmittel)
  // =========================================================================
  {
    id: 'de-werbungskosten-arbeitsmittel',
    countryCode: 'DE',
    categoryCode: DCC.WORK_EQUIPMENT,
    transactionCategories: [
      TC.OFFICE_SUPPLIES,
      TC.EQUIPMENT,
      TC.COMPUTER_HARDWARE,
    ],
    maxAmountPerItem: DepreciationLimits.DE_GWG_NET,
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 6 EStG',
    legalDescription:
      'Arbeitsmittel als Werbungskosten - Gegenstände bis 800€ netto sofort abziehbar',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  {
    id: 'de-werbungskosten-software',
    countryCode: 'DE',
    categoryCode: DCC.WORK_EQUIPMENT,
    transactionCategories: [TC.SOFTWARE_SUBSCRIPTIONS, TC.SUBSCRIPTIONS],
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 6 EStG',
    legalDescription:
      'Software und digitale Arbeitsmittel als Werbungskosten',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // HOME OFFICE (Häusliches Arbeitszimmer / Homeoffice-Pauschale)
  // =========================================================================
  {
    id: 'de-homeoffice-pauschale',
    countryCode: 'DE',
    categoryCode: DCC.HOME_OFFICE,
    transactionCategories: [TC.RENT, TC.UTILITIES],
    maxAmountPerYear: 1260, // 6€ per day, max 210 days
    percentageDeductible: 100,
    legalReference: '§4 Abs. 5 Nr. 6b EStG',
    legalDescription:
      'Homeoffice-Pauschale: 6€ pro Tag, max. 210 Tage (1.260€/Jahr)',
    requiresReceipt: false, // Flat rate doesn't need receipts
    requiresBusinessPurpose: true,
    requiresLogbook: true, // Need to track home office days
    additionalRequirements: [
      'Nachweis der Homeoffice-Tage',
      'Kein anderer Arbeitsplatz verfügbar',
    ],
    priority: 15,
  },

  {
    id: 'de-haeusliches-arbeitszimmer',
    countryCode: 'DE',
    categoryCode: DCC.HOME_OFFICE,
    transactionCategories: [TC.RENT, TC.UTILITIES, TC.INTERNET],
    maxAmountPerYear: 1250, // If not the center of professional activity
    percentageDeductible: 100,
    legalReference: '§4 Abs. 5 Nr. 6b EStG',
    legalDescription:
      'Häusliches Arbeitszimmer - max. 1.250€ wenn nicht Mittelpunkt der Tätigkeit',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Separater Raum erforderlich',
      'Flächennachweis',
      'Kein anderer Arbeitsplatz verfügbar',
    ],
    priority: 12,
    conditions: [
      condition('has_dedicated_room', 'eq', 'true'),
    ],
  },

  // =========================================================================
  // COMMUTE (Entfernungspauschale)
  // =========================================================================
  {
    id: 'de-entfernungspauschale',
    countryCode: 'DE',
    categoryCode: DCC.COMMUTE,
    transactionCategories: [
      TC.FUEL,
      TC.PUBLIC_TRANSPORT,
      TC.PARKING,
    ],
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 4 EStG',
    legalDescription:
      'Entfernungspauschale: 0,30€/km (ab 21km: 0,38€/km) für einfache Strecke',
    requiresReceipt: false, // Flat rate per km
    requiresBusinessPurpose: false, // Commute is inherently work-related
    requiresLogbook: true,
    additionalRequirements: [
      'Fahrtenbuch oder Nachweis der Arbeitstage',
      'Entfernungsberechnung',
    ],
    priority: 10,
  },

  // =========================================================================
  // BUSINESS TRAVEL (Reisekosten)
  // =========================================================================
  {
    id: 'de-reisekosten-fahrt',
    countryCode: 'DE',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [
      TC.TRAVEL_BUSINESS,
      TC.VEHICLE_BUSINESS,
      TC.FUEL,
    ],
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 4a EStG',
    legalDescription:
      'Reisekosten: Fahrtkosten 0,30€/km oder tatsächliche Kosten',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Reisezweck dokumentiert',
      'Fahrtenbuch bei Firmenwagen',
    ],
    priority: 15,
  },

  {
    id: 'de-reisekosten-unterkunft',
    countryCode: 'DE',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.ACCOMMODATION],
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 5a EStG',
    legalDescription:
      'Reisekosten: Übernachtungskosten - tatsächliche Kosten abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: ['Geschäftlicher Anlass dokumentiert'],
    priority: 15,
  },

  {
    id: 'de-reisekosten-verpflegung',
    countryCode: 'DE',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.MEALS_BUSINESS],
    percentageDeductible: 100,
    legalReference: '§9 Abs. 4a EStG',
    legalDescription:
      'Verpflegungspauschale: 14€ (8-24h), 28€ (24h+) - bei Geschäftsreisen',
    requiresReceipt: false, // Flat rate
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Abwesenheit >8 Stunden',
      'Geschäftsreise dokumentiert',
    ],
    priority: 12,
    conditions: [
      condition('absence_hours', 'gte', 8),
    ],
  },

  // =========================================================================
  // BUSINESS MEALS (Bewirtungskosten)
  // =========================================================================
  {
    id: 'de-bewirtung',
    countryCode: 'DE',
    categoryCode: DCC.BUSINESS_MEALS,
    transactionCategories: [TC.MEALS_BUSINESS, TC.CLIENT_ENTERTAINMENT],
    percentageDeductible: 70, // Only 70% deductible
    legalReference: '§4 Abs. 5 Nr. 2 EStG',
    legalDescription:
      'Bewirtungskosten: 70% abzugsfähig bei geschäftlichem Anlass',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Bewirtungsbeleg mit Teilnehmerliste',
      'Anlass der Bewirtung',
      'Datum und Ort',
    ],
    priority: 20,
  },

  // =========================================================================
  // PROFESSIONAL DEVELOPMENT (Fortbildung)
  // =========================================================================
  {
    id: 'de-fortbildung',
    countryCode: 'DE',
    categoryCode: DCC.PROFESSIONAL_DEVELOPMENT,
    transactionCategories: [TC.TRAINING, TC.SUBSCRIPTIONS],
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 7 EStG',
    legalDescription:
      'Fortbildungskosten: Kosten für berufliche Weiterbildung voll abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Beruflicher Bezug nachgewiesen',
      'Teilnahmebestätigung',
    ],
    priority: 10,
  },

  // =========================================================================
  // PROFESSIONAL SERVICES
  // =========================================================================
  {
    id: 'de-beratungskosten',
    countryCode: 'DE',
    categoryCode: DCC.PROFESSIONAL_SERVICES,
    transactionCategories: [
      TC.LEGAL_FEES,
      TC.ACCOUNTING_FEES,
      TC.CONSULTING,
    ],
    percentageDeductible: 100,
    legalReference: '§4 Abs. 4 EStG',
    legalDescription:
      'Beratungskosten: Steuerberatung, Rechtsberatung voll abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // COMMUNICATIONS (Telefon, Internet)
  // =========================================================================
  {
    id: 'de-telekommunikation',
    countryCode: 'DE',
    categoryCode: DCC.OFFICE_COSTS,
    transactionCategories: [TC.PHONE, TC.INTERNET],
    percentageDeductible: 20, // 20% flat rate if private use
    legalReference: '§9 Abs. 1 Nr. 6 EStG',
    legalDescription:
      'Telekommunikationskosten: 20% Pauschale oder tatsächliche berufliche Nutzung',
    requiresReceipt: true,
    requiresBusinessPurpose: false, // Flat rate assumption
    requiresLogbook: false,
    additionalRequirements: [
      'Bei höherem Anteil: Nutzungsnachweis erforderlich',
    ],
    priority: 5,
  },

  // =========================================================================
  // INSURANCE (Versicherungen)
  // =========================================================================
  {
    id: 'de-berufshaftpflicht',
    countryCode: 'DE',
    categoryCode: DCC.INSURANCE,
    transactionCategories: [TC.LIABILITY_INSURANCE, TC.BUSINESS_INSURANCE],
    percentageDeductible: 100,
    legalReference: '§10 Abs. 1 Nr. 3a EStG',
    legalDescription:
      'Berufshaftpflichtversicherung: Voll abzugsfähig als Vorsorgeaufwendung',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // VEHICLE EXPENSES (Kfz-Kosten)
  // =========================================================================
  {
    id: 'de-kfz-1-prozent',
    countryCode: 'DE',
    categoryCode: DCC.VEHICLE_EXPENSES,
    transactionCategories: [
      TC.VEHICLE_BUSINESS,
      TC.FUEL,
      TC.PARKING,
    ],
    percentageDeductible: 100,
    legalReference: '§6 Abs. 1 Nr. 4 Satz 2 EStG',
    legalDescription:
      'Kfz-Kosten: 1%-Regelung oder Fahrtenbuch - tatsächliche Kosten abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Fahrtenbuch oder 1%-Regelung',
      'Privatanteil versteuern',
    ],
    priority: 15,
  },

  // =========================================================================
  // MARKETING & ADVERTISING (Werbung)
  // =========================================================================
  {
    id: 'de-werbekosten',
    countryCode: 'DE',
    categoryCode: DCC.MARKETING_COSTS,
    transactionCategories: [
      TC.ADVERTISING,
      TC.MARKETING,
      TC.WEBSITE,
    ],
    percentageDeductible: 100,
    legalReference: '§4 Abs. 4 EStG',
    legalDescription:
      'Werbe- und Marketingkosten: Voll abzugsfähig als Betriebsausgabe',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // BANK FEES
  // =========================================================================
  {
    id: 'de-kontoführung',
    countryCode: 'DE',
    categoryCode: DCC.OFFICE_COSTS,
    transactionCategories: [TC.BANK_FEES],
    maxAmountPerYear: 16, // Kontoführungspauschale
    percentageDeductible: 100,
    legalReference: '§9 Abs. 1 Nr. 1 EStG',
    legalDescription:
      'Kontoführungsgebühren: 16€ Pauschale oder tatsächliche Kosten mit Nachweis',
    requiresReceipt: false, // Flat rate
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    priority: 5,
  },
];

/**
 * Get all German rules
 */
export function getGermanyRules(): DeductionRule[] {
  return GERMANY_RULES;
}

/**
 * Get German rules by category
 */
export function getGermanyRulesByCategory(categoryCode: string): DeductionRule[] {
  return GERMANY_RULES.filter((rule) => rule.categoryCode === categoryCode);
}
