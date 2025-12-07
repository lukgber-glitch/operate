/**
 * EÜR Line Mapping
 * Maps TaxCategory enum to German EÜR (Einnahmen-Überschuss-Rechnung) form lines
 */

import { TaxCategory } from '../types/tax-categories.types';

/**
 * EÜR form line information
 */
export interface EurLineInfo {
  /** Line number on EÜR form (Anlage EÜR) */
  lineNumber: number;

  /** German description as appears on form */
  germanDescription: string;

  /** Deduction percentage (100 = fully deductible) */
  deductionPercentage: number;

  /** Requires special documentation? */
  requiresDocumentation: boolean;

  /** Special requirements or notes */
  notes?: string[];
}

/**
 * Complete mapping of TaxCategory to EÜR form lines
 */
export const EUR_LINE_MAPPING: Record<TaxCategory, EurLineInfo> = {
  // Expense Categories
  [TaxCategory.WAREN_MATERIAL]: {
    lineNumber: 12,
    germanDescription: 'Waren, Roh- und Hilfsstoffe (Eingangsfracht, Verpackung)',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: ['Rechnungen aufbewahren', 'Inventur bei größeren Beständen'],
  },

  [TaxCategory.FREMDLEISTUNGEN]: {
    lineNumber: 13,
    germanDescription: 'Bezogene Fremdleistungen',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: ['Verträge und Rechnungen aufbewahren', 'Scheinselbstständigkeit prüfen'],
  },

  [TaxCategory.PERSONAL]: {
    lineNumber: 14,
    germanDescription: 'Löhne und Gehälter',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Lohn- und Gehaltsabrechnungen',
      'Sozialversicherungsnachweise',
      'Betriebsprüfung relevant',
    ],
  },

  [TaxCategory.MIETE_PACHT]: {
    lineNumber: 18,
    germanDescription: 'Raumkosten (Miete, Pacht, Leasing für Räume)',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Mietvertrag aufbewahren',
      'Bei häuslichem Arbeitszimmer: besondere Regeln beachten',
      'Anteilige Miete bei Mischobjekten',
    ],
  },

  [TaxCategory.SONSTIGE_KOSTEN]: {
    lineNumber: 20,
    germanDescription: 'Sonstige unbeschränkt abziehbare Betriebsausgaben',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Sammelkategorie für nicht spezifizierte Ausgaben',
      'Belege aufbewahren',
      'Bei größeren Beträgen: Einzelaufstellung empfohlen',
    ],
  },

  [TaxCategory.ABSCHREIBUNGEN]: {
    lineNumber: 22,
    germanDescription: 'Absetzung für Abnutzung (AfA)',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Anlageverzeichnis führen',
      'Kaufverträge aufbewahren',
      'Nutzungsdauer nach AfA-Tabelle',
      'GWG-Regelung beachten (Geringwertige Wirtschaftsgüter)',
    ],
  },

  [TaxCategory.KFZKOSTEN]: {
    lineNumber: 24,
    germanDescription: 'Kfz-Kosten (ohne AfA)',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Fahrtenbuch oder 1%-Regelung',
      'Bei gemischter Nutzung: private Anteile abziehen',
      'Benzinbelege, Reparaturen, Versicherung, Steuer',
    ],
  },

  [TaxCategory.REISEKOSTEN]: {
    lineNumber: 25,
    germanDescription: 'Reisekosten (Fahrt-, Übernachtungs-, Reisenebenkosten)',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Reisekostenabrechnung erstellen',
      'Verpflegungspauschalen beachten',
      'Bei Auslandsreisen: länderspezifische Pauschalen',
      'Geschäftlicher Anlass dokumentieren',
    ],
  },

  [TaxCategory.BEWIRTUNG]: {
    lineNumber: 26,
    germanDescription: 'Bewirtungskosten',
    deductionPercentage: 70,
    requiresDocumentation: true,
    notes: [
      'Nur 70% abzugsfähig!',
      'Bewirtungsbeleg mit Angabe der Gäste erforderlich',
      'Geschäftlicher Anlass muss dokumentiert sein',
      'Getrennte Erfassung von Speisen/Getränken und Trinkgeldern',
    ],
  },

  [TaxCategory.TELEFON_INTERNET]: {
    lineNumber: 27,
    germanDescription: 'Telefon, Internet, Porto',
    deductionPercentage: 100,
    requiresDocumentation: false,
    notes: [
      'Bei Privatnutzung: Anteil abziehen (oft 50/50)',
      'Einzelverbindungsnachweis bei 100% Abzug empfohlen',
      'Pauschale Aufteilung möglich',
    ],
  },

  [TaxCategory.BUEROKOSTEN]: {
    lineNumber: 28,
    germanDescription: 'Bürobedarf, Fachliteratur, Fortbildung',
    deductionPercentage: 100,
    requiresDocumentation: false,
    notes: ['Belege aufbewahren', 'Bei Fortbildung: beruflicher Bezug nachweisen'],
  },

  [TaxCategory.VERSICHERUNGEN]: {
    lineNumber: 29,
    germanDescription: 'Versicherungen und Beiträge',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Nur betriebliche Versicherungen',
      'Private Versicherungen separat in Anlage Vorsorgeaufwand',
      'Versicherungsscheine aufbewahren',
    ],
  },

  [TaxCategory.WERBUNG]: {
    lineNumber: 30,
    germanDescription: 'Werbe- und Repräsentationskosten',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Geschenke: max. 35€ pro Person/Jahr',
      'Werbekosten voll abzugsfähig',
      'Geschäftsbeziehung dokumentieren',
    ],
  },

  [TaxCategory.RECHTSBERATUNG]: {
    lineNumber: 31,
    germanDescription: 'Rechts- und Steuerberatung, Buchführung',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: ['Verträge und Rechnungen aufbewahren', 'Nur betriebliche Beratung'],
  },

  [TaxCategory.ZINSEN]: {
    lineNumber: 32,
    germanDescription: 'Schuldzinsen und ähnliche Entgelte',
    deductionPercentage: 100,
    requiresDocumentation: true,
    notes: [
      'Nur Zinsen für betriebliche Kredite',
      'Tilgung ist nicht abzugsfähig',
      'Darlehensverträge aufbewahren',
    ],
  },

  // Income Categories
  [TaxCategory.EINNAHMEN_7]: {
    lineNumber: 11,
    germanDescription: 'Betriebseinnahmen (7% Umsatzsteuer)',
    deductionPercentage: 0,
    requiresDocumentation: true,
    notes: [
      'Ermäßigter Steuersatz: 7%',
      'z.B. Bücher, Zeitungen, bestimmte Lebensmittel',
      'Ausgangsrechnungen aufbewahren',
    ],
  },

  [TaxCategory.EINNAHMEN_19]: {
    lineNumber: 11,
    germanDescription: 'Betriebseinnahmen (19% Umsatzsteuer)',
    deductionPercentage: 0,
    requiresDocumentation: true,
    notes: ['Regelsteuersatz: 19%', 'Ausgangsrechnungen aufbewahren'],
  },

  [TaxCategory.EINNAHMEN_STEUERFREI]: {
    lineNumber: 11,
    germanDescription: 'Steuerfreie Betriebseinnahmen',
    deductionPercentage: 0,
    requiresDocumentation: true,
    notes: [
      'z.B. Ausfuhrlieferungen, innergemeinschaftliche Lieferungen',
      '§4 Nr. 8-28 UStG',
      'Umsatzsteuererklärung: gesonderte Zeile',
    ],
  },

  [TaxCategory.EINNAHMEN_KLEINUNTERNEHMER]: {
    lineNumber: 11,
    germanDescription: 'Betriebseinnahmen (Kleinunternehmer §19 UStG)',
    deductionPercentage: 0,
    requiresDocumentation: true,
    notes: [
      'Keine Umsatzsteuer',
      'Hinweis auf Rechnung: §19 UStG',
      'Vorjahresumsatz unter 22.000€',
    ],
  },

  // Special Categories
  [TaxCategory.PRIVATE_ENTNAHME]: {
    lineNumber: 0,
    germanDescription: 'Private Entnahme (nicht steuerrelevant für EÜR)',
    deductionPercentage: 0,
    requiresDocumentation: false,
    notes: [
      'Keine Betriebsausgabe',
      'Vermindert den Gewinn nicht',
      'In Eigenkapital-Konto buchen',
    ],
  },

  [TaxCategory.PRIVATE_EINLAGE]: {
    lineNumber: 0,
    germanDescription: 'Private Einlage (nicht steuerrelevant für EÜR)',
    deductionPercentage: 0,
    requiresDocumentation: false,
    notes: [
      'Keine Betriebseinnahme',
      'Erhöht den Gewinn nicht',
      'In Eigenkapital-Konto buchen',
    ],
  },

  [TaxCategory.KEINE_STEUERRELEVANZ]: {
    lineNumber: 0,
    germanDescription: 'Keine steuerliche Relevanz',
    deductionPercentage: 0,
    requiresDocumentation: false,
    notes: [
      'Nicht in EÜR aufnehmen',
      'z.B. Umbuchungen zwischen Konten',
      'Private Transaktionen',
    ],
  },
};

/**
 * Get EÜR line info for a tax category
 */
export function getEurLineInfo(category: TaxCategory): EurLineInfo {
  return EUR_LINE_MAPPING[category];
}

/**
 * Get all expense categories (exclude income and special)
 */
export function getExpenseCategories(): TaxCategory[] {
  return [
    TaxCategory.WAREN_MATERIAL,
    TaxCategory.FREMDLEISTUNGEN,
    TaxCategory.PERSONAL,
    TaxCategory.MIETE_PACHT,
    TaxCategory.SONSTIGE_KOSTEN,
    TaxCategory.ABSCHREIBUNGEN,
    TaxCategory.KFZKOSTEN,
    TaxCategory.REISEKOSTEN,
    TaxCategory.BEWIRTUNG,
    TaxCategory.TELEFON_INTERNET,
    TaxCategory.BUEROKOSTEN,
    TaxCategory.VERSICHERUNGEN,
    TaxCategory.WERBUNG,
    TaxCategory.RECHTSBERATUNG,
    TaxCategory.ZINSEN,
  ];
}

/**
 * Get all income categories
 */
export function getIncomeCategories(): TaxCategory[] {
  return [
    TaxCategory.EINNAHMEN_7,
    TaxCategory.EINNAHMEN_19,
    TaxCategory.EINNAHMEN_STEUERFREI,
    TaxCategory.EINNAHMEN_KLEINUNTERNEHMER,
  ];
}

/**
 * Check if category is an expense
 */
export function isExpenseCategory(category: TaxCategory): boolean {
  return getExpenseCategories().includes(category);
}

/**
 * Check if category is income
 */
export function isIncomeCategory(category: TaxCategory): boolean {
  return getIncomeCategories().includes(category);
}

/**
 * Get deduction percentage for a category
 */
export function getDeductionPercentage(category: TaxCategory): number {
  return EUR_LINE_MAPPING[category].deductionPercentage;
}

/**
 * Calculate deductible amount
 */
export function calculateDeductibleAmount(
  amount: number,
  category: TaxCategory,
): number {
  const percentage = getDeductionPercentage(category);
  return Math.round((amount * percentage) / 100);
}
