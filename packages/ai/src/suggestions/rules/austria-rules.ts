/**
 * Austrian Deduction Rules
 *
 * Based on Austrian tax law (EStG - Einkommensteuergesetz)
 */

import { DeductionRule } from '../types';

import {
  TransactionCategories as TC,
  DeductionCategoryCodes as DCC,
  DepreciationLimits,
  condition,
} from './base-rules';

/**
 * Austrian deduction rules
 *
 * References:
 * - §16 EStG: Werbungskosten
 * - §4 EStG: Betriebsausgaben
 */
export const AUSTRIA_RULES: DeductionRule[] = [
  // =========================================================================
  // WORK EQUIPMENT (Arbeitsmittel)
  // =========================================================================
  {
    id: 'at-arbeitsmittel',
    countryCode: 'AT',
    categoryCode: DCC.WORK_EQUIPMENT,
    transactionCategories: [
      TC.OFFICE_SUPPLIES,
      TC.EQUIPMENT,
      TC.COMPUTER_HARDWARE,
      TC.SOFTWARE_SUBSCRIPTIONS,
    ],
    maxAmountPerItem: DepreciationLimits.AT_GWG,
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 6 EStG',
    legalDescription:
      'Arbeitsmittel als Werbungskosten - bis 800€ sofort abschreibbar',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // HOME OFFICE (Homeoffice)
  // =========================================================================
  {
    id: 'at-homeoffice-pauschale',
    countryCode: 'AT',
    categoryCode: DCC.HOME_OFFICE,
    transactionCategories: [TC.RENT, TC.UTILITIES, TC.INTERNET],
    maxAmountPerYear: 1200, // 3€ per day, max 100 days
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 6 lit. d EStG',
    legalDescription:
      'Homeoffice-Pauschale: 3€ pro Tag, max. 100 Tage (300€/Jahr)',
    requiresReceipt: false,
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Nachweis der Homeoffice-Tage',
      'Arbeitgeber bestätigt Homeoffice',
    ],
    priority: 15,
  },

  {
    id: 'at-arbeitszimmer',
    countryCode: 'AT',
    categoryCode: DCC.HOME_OFFICE,
    transactionCategories: [TC.RENT, TC.UTILITIES],
    maxAmountPerYear: 1200,
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 6 lit. d EStG',
    legalDescription:
      'Arbeitszimmer: max. 1.200€ wenn nicht Mittelpunkt der Tätigkeit',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Separater Raum erforderlich',
      'Nachweis der beruflichen Nutzung',
    ],
    priority: 12,
  },

  // =========================================================================
  // COMMUTE (Pendlerpauschale)
  // =========================================================================
  {
    id: 'at-pendlerpauschale-klein',
    countryCode: 'AT',
    categoryCode: DCC.COMMUTE,
    transactionCategories: [TC.FUEL, TC.PUBLIC_TRANSPORT],
    maxAmountPerYear: 696, // Small commuter allowance
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 6 lit. a EStG',
    legalDescription:
      'Kleine Pendlerpauschale: für Strecken 20-40km mit öffentlichen Verkehrsmitteln',
    requiresReceipt: false,
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    additionalRequirements: [
      'Pendlerrechner-Nachweis',
      'Arbeitgeber-Bestätigung',
    ],
    priority: 10,
    conditions: [
      condition('distance_km', 'gte', 20),
      condition('distance_km', 'lte', 40),
    ],
  },

  {
    id: 'at-pendlerpauschale-gross',
    countryCode: 'AT',
    categoryCode: DCC.COMMUTE,
    transactionCategories: [TC.FUEL, TC.VEHICLE_BUSINESS],
    maxAmountPerYear: 3672, // Large commuter allowance (>60km)
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 6 lit. a EStG',
    legalDescription:
      'Große Pendlerpauschale: für Strecken ohne zumutbare öffentliche Verkehrsmittel',
    requiresReceipt: false,
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    additionalRequirements: [
      'Pendlerrechner-Nachweis',
      'Keine zumutbare Öffi-Verbindung',
    ],
    priority: 12,
  },

  // =========================================================================
  // BUSINESS TRAVEL (Reisekosten)
  // =========================================================================
  {
    id: 'at-reisekosten-km',
    countryCode: 'AT',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.TRAVEL_BUSINESS, TC.VEHICLE_BUSINESS],
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 9 EStG',
    legalDescription:
      'Reisekosten: Kilometergeld 0,42€/km (Pkw) - amtliches Kilometergeld',
    requiresReceipt: false, // Flat rate
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Fahrtenbuch',
      'Geschäftsreise dokumentiert',
    ],
    priority: 15,
  },

  {
    id: 'at-reisekosten-unterkunft',
    countryCode: 'AT',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.ACCOMMODATION],
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 9 EStG',
    legalDescription:
      'Übernachtungskosten: Tatsächliche Kosten bei Geschäftsreisen',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 15,
  },

  {
    id: 'at-reisekosten-tagegeld',
    countryCode: 'AT',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.MEALS_BUSINESS],
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 9 EStG',
    legalDescription:
      'Taggelder: 26,40€ (Inland >24h), verschiedene Sätze für Ausland',
    requiresReceipt: false,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Abwesenheit >3 Stunden',
      'Reise dokumentiert',
    ],
    priority: 12,
    conditions: [
      condition('absence_hours', 'gte', 3),
    ],
  },

  // =========================================================================
  // BUSINESS MEALS (Bewirtungskosten)
  // =========================================================================
  {
    id: 'at-bewirtung',
    countryCode: 'AT',
    categoryCode: DCC.BUSINESS_MEALS,
    transactionCategories: [TC.MEALS_BUSINESS, TC.CLIENT_ENTERTAINMENT],
    percentageDeductible: 50, // Only 50% deductible in Austria
    legalReference: '§20 Abs. 1 Z 3 EStG',
    legalDescription:
      'Bewirtungskosten: 50% abzugsfähig bei geschäftlichem Anlass',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Bewirtungsbeleg',
      'Teilnehmer dokumentiert',
      'Geschäftlicher Anlass',
    ],
    priority: 20,
  },

  // =========================================================================
  // PROFESSIONAL DEVELOPMENT (Fortbildung)
  // =========================================================================
  {
    id: 'at-fortbildung',
    countryCode: 'AT',
    categoryCode: DCC.PROFESSIONAL_DEVELOPMENT,
    transactionCategories: [TC.TRAINING, TC.SUBSCRIPTIONS],
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 10 EStG',
    legalDescription:
      'Fortbildungskosten: Berufliche Weiterbildung voll abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Beruflicher Bezug',
      'Teilnahmebestätigung',
    ],
    priority: 10,
  },

  // =========================================================================
  // PROFESSIONAL SERVICES
  // =========================================================================
  {
    id: 'at-beratungskosten',
    countryCode: 'AT',
    categoryCode: DCC.PROFESSIONAL_SERVICES,
    transactionCategories: [TC.LEGAL_FEES, TC.ACCOUNTING_FEES, TC.CONSULTING],
    percentageDeductible: 100,
    legalReference: '§4 Abs. 4 EStG',
    legalDescription:
      'Beratungskosten: Steuer- und Rechtsberatung voll abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // COMMUNICATIONS
  // =========================================================================
  {
    id: 'at-telekommunikation',
    countryCode: 'AT',
    categoryCode: DCC.OFFICE_COSTS,
    transactionCategories: [TC.PHONE, TC.INTERNET],
    percentageDeductible: 20,
    legalReference: '§16 Abs. 1 Z 6 EStG',
    legalDescription:
      'Telekommunikationskosten: 20% Pauschale oder Einzelnachweis',
    requiresReceipt: true,
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    priority: 5,
  },

  // =========================================================================
  // INSURANCE
  // =========================================================================
  {
    id: 'at-berufshaftpflicht',
    countryCode: 'AT',
    categoryCode: DCC.INSURANCE,
    transactionCategories: [TC.LIABILITY_INSURANCE, TC.BUSINESS_INSURANCE],
    percentageDeductible: 100,
    legalReference: '§18 Abs. 1 Z 2 EStG',
    legalDescription:
      'Berufshaftpflichtversicherung: Voll abzugsfähig als Sonderausgabe',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // VEHICLE EXPENSES
  // =========================================================================
  {
    id: 'at-kfz-kosten',
    countryCode: 'AT',
    categoryCode: DCC.VEHICLE_EXPENSES,
    transactionCategories: [TC.VEHICLE_BUSINESS, TC.FUEL, TC.PARKING],
    percentageDeductible: 100,
    legalReference: '§16 Abs. 1 Z 9 EStG',
    legalDescription:
      'Kfz-Kosten: Kilometergeld oder tatsächliche Kosten mit Fahrtenbuch',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Fahrtenbuch erforderlich',
      'Privatanteil ermitteln',
    ],
    priority: 15,
  },

  // =========================================================================
  // MARKETING & ADVERTISING
  // =========================================================================
  {
    id: 'at-werbekosten',
    countryCode: 'AT',
    categoryCode: DCC.MARKETING_COSTS,
    transactionCategories: [TC.ADVERTISING, TC.MARKETING, TC.WEBSITE],
    percentageDeductible: 100,
    legalReference: '§4 Abs. 4 EStG',
    legalDescription:
      'Werbekosten: Voll abzugsfähig als Betriebsausgabe',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },
];

/**
 * Get all Austrian rules
 */
export function getAustriaRules(): DeductionRule[] {
  return AUSTRIA_RULES;
}

/**
 * Get Austrian rules by category
 */
export function getAustriaRulesByCategory(categoryCode: string): DeductionRule[] {
  return AUSTRIA_RULES.filter((rule) => rule.categoryCode === categoryCode);
}
