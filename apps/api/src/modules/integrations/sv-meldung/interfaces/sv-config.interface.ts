/**
 * SV-Meldung Configuration Interface
 * Configuration for German social security reporting integration
 */

/**
 * SV carrier configuration
 */
export interface SvCarrierConfig {
  /** Carrier identifier (e.g., AOK, Barmer, TK) */
  carrierId: string;

  /** Carrier name */
  carrierName: string;

  /** Betriebsnummer (employer ID at this carrier) */
  betriebsnummer: string;

  /** API endpoint for submissions (if available) */
  apiEndpoint?: string;

  /** Whether carrier supports electronic submission */
  electronicSubmission: boolean;

  /** Carrier-specific settings */
  settings?: Record<string, any>;
}

/**
 * DEÜV transmission configuration
 */
export interface DeuevConfig {
  /** Absender (sender) identifier */
  absender: string;

  /** Company Betriebsnummer */
  betriebsnummer: string;

  /** Company name */
  companyName: string;

  /** Company address */
  companyAddress: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
  };

  /** Contact person */
  contactPerson?: {
    name: string;
    phone?: string;
    email?: string;
  };

  /** DEÜV version (e.g., "8.1") */
  version: string;

  /** Test mode flag */
  testMode: boolean;
}

/**
 * Overall SV-Meldung module configuration
 */
export interface SvMeldungConfig {
  /** DEÜV configuration */
  deuev: DeuevConfig;

  /** Configured carriers */
  carriers: SvCarrierConfig[];

  /** Default carrier for health insurance */
  defaultHealthCarrier?: string;

  /** Enable automatic submission */
  autoSubmit: boolean;

  /** Archive submitted messages */
  archiveMessages: boolean;

  /** Archive retention period in days */
  archiveRetentionDays: number;
}
