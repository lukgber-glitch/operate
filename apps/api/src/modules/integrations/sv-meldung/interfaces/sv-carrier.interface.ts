/**
 * Social Security Carrier Interfaces
 * Information about German social security carriers (Sozialversicherungsträger)
 */

/**
 * Carrier type enumeration
 */
export enum CarrierType {
  /** Gesetzliche Krankenversicherung (Statutory health insurance) */
  GKV = 'GKV',

  /** Rentenversicherung (Pension insurance) */
  RV = 'RV',

  /** Bundesagentur für Arbeit (Federal employment agency) */
  BA = 'BA',

  /** Unfallversicherung (Accident insurance) */
  UV = 'UV',

  /** Pflegekasse (Nursing care insurance) */
  PV = 'PV',
}

/**
 * Health insurance carrier information
 */
export interface HealthCarrier {
  /** Carrier type */
  type: CarrierType.GKV;

  /** Institutionskennzeichen (IK) - 9 digits */
  ik: string;

  /** Carrier name */
  name: string;

  /** Short name/abbreviation */
  shortName: string;

  /** VKNR (Verband-Krankenkassen-Nummer) - 4 digits */
  vknr?: string;

  /** Carrier address */
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };

  /** Contact information */
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  /** Regional coverage (state codes) */
  regionalCoverage?: string[];

  /** Whether carrier accepts electronic submissions */
  electronicSubmission: boolean;

  /** Carrier-specific DEÜV requirements */
  deuevRequirements?: Record<string, any>;
}

/**
 * Pension insurance carrier information
 */
export interface PensionCarrier {
  /** Carrier type */
  type: CarrierType.RV;

  /** Carrier code */
  code: string;

  /** Carrier name */
  name: string;

  /** Regional responsibility */
  region: string;

  /** Whether carrier accepts electronic submissions */
  electronicSubmission: boolean;
}

/**
 * German health insurance carriers (major ones)
 */
export const GERMAN_HEALTH_CARRIERS: Record<string, HealthCarrier> = {
  AOK: {
    type: CarrierType.GKV,
    ik: '108018347',
    name: 'AOK - Die Gesundheitskasse',
    shortName: 'AOK',
    vknr: '0100',
    electronicSubmission: true,
    regionalCoverage: ['DE'],
  },
  TK: {
    type: CarrierType.GKV,
    ik: '108310400',
    name: 'Techniker Krankenkasse',
    shortName: 'TK',
    vknr: '8301',
    electronicSubmission: true,
    regionalCoverage: ['DE'],
  },
  BARMER: {
    type: CarrierType.GKV,
    ik: '108416214',
    name: 'BARMER',
    shortName: 'BARMER',
    vknr: '8416',
    electronicSubmission: true,
    regionalCoverage: ['DE'],
  },
  DAK: {
    type: CarrierType.GKV,
    ik: '108312448',
    name: 'DAK-Gesundheit',
    shortName: 'DAK',
    vknr: '8312',
    electronicSubmission: true,
    regionalCoverage: ['DE'],
  },
  KKH: {
    type: CarrierType.GKV,
    ik: '108590422',
    name: 'KKH Kaufmännische Krankenkasse',
    shortName: 'KKH',
    vknr: '8590',
    electronicSubmission: true,
    regionalCoverage: ['DE'],
  },
};

/**
 * German pension insurance carriers
 */
export const GERMAN_PENSION_CARRIERS: Record<string, PensionCarrier> = {
  DRV_BUND: {
    type: CarrierType.RV,
    code: '01',
    name: 'Deutsche Rentenversicherung Bund',
    region: 'Bundesweit',
    electronicSubmission: true,
  },
  DRV_BAYERN_SUED: {
    type: CarrierType.RV,
    code: '02',
    name: 'Deutsche Rentenversicherung Bayern Süd',
    region: 'Bayern Süd',
    electronicSubmission: true,
  },
  DRV_BERLIN_BRANDENBURG: {
    type: CarrierType.RV,
    code: '03',
    name: 'Deutsche Rentenversicherung Berlin-Brandenburg',
    region: 'Berlin-Brandenburg',
    electronicSubmission: true,
  },
  DRV_BRAUNSCHWEIG_HANNOVER: {
    type: CarrierType.RV,
    code: '04',
    name: 'Deutsche Rentenversicherung Braunschweig-Hannover',
    region: 'Niedersachsen-Bremen',
    electronicSubmission: true,
  },
  DRV_HESSEN: {
    type: CarrierType.RV,
    code: '05',
    name: 'Deutsche Rentenversicherung Hessen',
    region: 'Hessen',
    electronicSubmission: true,
  },
  DRV_NORD: {
    type: CarrierType.RV,
    code: '06',
    name: 'Deutsche Rentenversicherung Nord',
    region: 'Nord',
    electronicSubmission: true,
  },
  DRV_OLDENBURG_BREMEN: {
    type: CarrierType.RV,
    code: '07',
    name: 'Deutsche Rentenversicherung Oldenburg-Bremen',
    region: 'Oldenburg-Bremen',
    electronicSubmission: true,
  },
  DRV_RHEINLAND: {
    type: CarrierType.RV,
    code: '08',
    name: 'Deutsche Rentenversicherung Rheinland',
    region: 'Rheinland',
    electronicSubmission: true,
  },
  DRV_RHEINLAND_PFALZ: {
    type: CarrierType.RV,
    code: '09',
    name: 'Deutsche Rentenversicherung Rheinland-Pfalz',
    region: 'Rheinland-Pfalz',
    electronicSubmission: true,
  },
  DRV_SCHWABEN: {
    type: CarrierType.RV,
    code: '10',
    name: 'Deutsche Rentenversicherung Schwaben',
    region: 'Schwaben',
    electronicSubmission: true,
  },
};

/**
 * Carrier lookup result
 */
export interface CarrierLookupResult {
  /** Whether carrier was found */
  found: boolean;

  /** Carrier information */
  carrier?: HealthCarrier | PensionCarrier;

  /** Carrier type */
  carrierType?: CarrierType;

  /** Lookup method used */
  lookupMethod: 'IK' | 'VKNR' | 'CODE' | 'NAME';
}
