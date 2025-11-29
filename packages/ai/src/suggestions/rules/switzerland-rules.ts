/**
 * Swiss Deduction Rules
 *
 * Based on Swiss tax law (DBG - Bundesgesetz über die direkte Bundessteuer)
 */

import { DeductionRule } from '../types';

import {
  TransactionCategories as TC,
  DeductionCategoryCodes as DCC,
  DepreciationLimits,
} from './base-rules';

/**
 * Swiss deduction rules
 *
 * References:
 * - Art. 26 DBG: Berufskosten (Professional expenses)
 * - Art. 27 DBG: Allgemeine Abzüge (General deductions)
 *
 * Note: Switzerland has federal and cantonal taxes with varying rules.
 * These are federal-level rules; cantonal rules may differ.
 */
export const SWITZERLAND_RULES: DeductionRule[] = [
  // =========================================================================
  // WORK EQUIPMENT (Arbeitsmittel)
  // =========================================================================
  {
    id: 'ch-arbeitsmittel',
    countryCode: 'CH',
    categoryCode: DCC.WORK_EQUIPMENT,
    transactionCategories: [
      TC.OFFICE_SUPPLIES,
      TC.EQUIPMENT,
      TC.COMPUTER_HARDWARE,
      TC.SOFTWARE_SUBSCRIPTIONS,
    ],
    maxAmountPerItem: DepreciationLimits.CH_GWG,
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Berufsauslagen für Arbeitsmittel - bis CHF 2\'000 sofort abschreibbar',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // HOME OFFICE (Arbeitszimmer)
  // =========================================================================
  {
    id: 'ch-arbeitszimmer',
    countryCode: 'CH',
    categoryCode: DCC.HOME_OFFICE,
    transactionCategories: [TC.RENT, TC.UTILITIES],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Arbeitszimmer: Anteilige Kosten bei ausschließlicher beruflicher Nutzung',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Separater Raum erforderlich',
      'Ausschließlich berufliche Nutzung',
      'Flächennachweis',
    ],
    priority: 15,
  },

  // =========================================================================
  // COMMUTE (Fahrkosten)
  // =========================================================================
  {
    id: 'ch-fahrkosten-oeffentlich',
    countryCode: 'CH',
    categoryCode: DCC.COMMUTE,
    transactionCategories: [TC.PUBLIC_TRANSPORT],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. b DBG',
    legalDescription:
      'Fahrkosten Arbeitsweg: Tatsächliche Kosten bei öffentlichen Verkehrsmitteln',
    requiresReceipt: true,
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    priority: 10,
  },

  {
    id: 'ch-fahrkosten-privat',
    countryCode: 'CH',
    categoryCode: DCC.COMMUTE,
    transactionCategories: [TC.FUEL, TC.VEHICLE_BUSINESS],
    maxAmountPerYear: 3200, // Federal limit for commute deduction
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. b DBG',
    legalDescription:
      'Fahrkosten Privatfahrzeug: CHF 0,70/km, max. CHF 3\'200 Bundessteuer',
    requiresReceipt: false,
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    additionalRequirements: [
      'Öffentliche Verkehrsmittel nicht zumutbar',
      'Kilometernachweis',
    ],
    priority: 8,
  },

  // =========================================================================
  // BUSINESS TRAVEL (Geschäftsreisen)
  // =========================================================================
  {
    id: 'ch-geschaeftsreisen-km',
    countryCode: 'CH',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.TRAVEL_BUSINESS, TC.VEHICLE_BUSINESS],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Geschäftsreisen: CHF 0,70/km oder tatsächliche Kosten',
    requiresReceipt: false,
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Fahrtenbuch',
      'Geschäftlicher Anlass dokumentiert',
    ],
    priority: 15,
  },

  {
    id: 'ch-geschaeftsreisen-unterkunft',
    countryCode: 'CH',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.ACCOMMODATION],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Übernachtungskosten: Tatsächliche Kosten bei Geschäftsreisen',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 15,
  },

  {
    id: 'ch-verpflegung-auswärts',
    countryCode: 'CH',
    categoryCode: DCC.TRAVEL_EXPENSES,
    transactionCategories: [TC.MEALS_BUSINESS],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. d DBG',
    legalDescription:
      'Verpflegungsmehrkosten: Pauschale für auswärtige Verpflegung',
    requiresReceipt: false,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Auswärtige Tätigkeit nachgewiesen',
    ],
    priority: 12,
  },

  // =========================================================================
  // BUSINESS MEALS (Bewirtung)
  // =========================================================================
  {
    id: 'ch-bewirtungskosten',
    countryCode: 'CH',
    categoryCode: DCC.BUSINESS_MEALS,
    transactionCategories: [TC.MEALS_BUSINESS, TC.CLIENT_ENTERTAINMENT],
    percentageDeductible: 100,
    legalReference: 'Art. 27 Abs. 2 lit. a DBG',
    legalDescription:
      'Bewirtungskosten: Geschäftlich begründete Bewirtungen abzugsfähig',
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
  // PROFESSIONAL DEVELOPMENT (Weiterbildung)
  // =========================================================================
  {
    id: 'ch-weiterbildung-beruf',
    countryCode: 'CH',
    categoryCode: DCC.PROFESSIONAL_DEVELOPMENT,
    transactionCategories: [TC.TRAINING, TC.SUBSCRIPTIONS],
    maxAmountPerYear: 12800, // Federal limit for professional development
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. d DBG',
    legalDescription:
      'Weiterbildungskosten: Max. CHF 12\'800 für berufsorientierten Zweitausbildung',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Beruflicher Zusammenhang',
      'Teilnahmebestätigung',
    ],
    priority: 10,
  },

  // =========================================================================
  // PROFESSIONAL SERVICES
  // =========================================================================
  {
    id: 'ch-beratungskosten',
    countryCode: 'CH',
    categoryCode: DCC.PROFESSIONAL_SERVICES,
    transactionCategories: [TC.LEGAL_FEES, TC.ACCOUNTING_FEES, TC.CONSULTING],
    percentageDeductible: 100,
    legalReference: 'Art. 27 Abs. 1 DBG',
    legalDescription:
      'Beratungskosten: Steuer- und Rechtsberatung als Gewinnungskosten',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // COMMUNICATIONS
  // =========================================================================
  {
    id: 'ch-kommunikation',
    countryCode: 'CH',
    categoryCode: DCC.OFFICE_COSTS,
    transactionCategories: [TC.PHONE, TC.INTERNET],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Kommunikationskosten: Anteilige berufliche Nutzung abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    additionalRequirements: [
      'Nachweis der beruflichen Nutzung',
    ],
    priority: 5,
  },

  // =========================================================================
  // INSURANCE
  // =========================================================================
  {
    id: 'ch-berufshaftpflicht',
    countryCode: 'CH',
    categoryCode: DCC.INSURANCE,
    transactionCategories: [TC.LIABILITY_INSURANCE, TC.BUSINESS_INSURANCE],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Berufshaftpflicht: Prämien für Berufshaftpflichtversicherung abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // VEHICLE EXPENSES
  // =========================================================================
  {
    id: 'ch-fahrzeugkosten',
    countryCode: 'CH',
    categoryCode: DCC.VEHICLE_EXPENSES,
    transactionCategories: [TC.VEHICLE_BUSINESS, TC.FUEL, TC.PARKING],
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. a DBG',
    legalDescription:
      'Fahrzeugkosten: Anteilige Kosten für geschäftliche Nutzung',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: true,
    additionalRequirements: [
      'Fahrtenbuch erforderlich',
      'Privatanteil berechnen',
    ],
    priority: 15,
  },

  // =========================================================================
  // MARKETING & ADVERTISING
  // =========================================================================
  {
    id: 'ch-werbekosten',
    countryCode: 'CH',
    categoryCode: DCC.MARKETING_COSTS,
    transactionCategories: [TC.ADVERTISING, TC.MARKETING, TC.WEBSITE],
    percentageDeductible: 100,
    legalReference: 'Art. 27 Abs. 1 DBG',
    legalDescription:
      'Werbekosten: Geschäftsmäßig begründete Werbeausgaben abzugsfähig',
    requiresReceipt: true,
    requiresBusinessPurpose: true,
    requiresLogbook: false,
    priority: 10,
  },

  // =========================================================================
  // MEALS AT WORK (Verpflegung am Arbeitsort)
  // =========================================================================
  {
    id: 'ch-verpflegung-pauschal',
    countryCode: 'CH',
    categoryCode: DCC.OFFICE_COSTS,
    transactionCategories: [TC.MEALS_BUSINESS],
    maxAmountPerYear: 3200,
    percentageDeductible: 100,
    legalReference: 'Art. 26 Abs. 1 lit. d DBG',
    legalDescription:
      'Verpflegungsmehrkosten: Pauschale bei auswärtiger Tätigkeit',
    requiresReceipt: false,
    requiresBusinessPurpose: false,
    requiresLogbook: false,
    priority: 5,
  },
];

/**
 * Get all Swiss rules
 */
export function getSwitzerlandRules(): DeductionRule[] {
  return SWITZERLAND_RULES;
}

/**
 * Get Swiss rules by category
 */
export function getSwitzerlandRulesByCategory(categoryCode: string): DeductionRule[] {
  return SWITZERLAND_RULES.filter((rule) => rule.categoryCode === categoryCode);
}
