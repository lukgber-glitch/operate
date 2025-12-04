/**
 * FinanzOnline Configuration Interface
 * Defines configuration for the Austrian FinanzOnline WebService
 */

/**
 * FinanzOnline environment types
 */
export enum FonEnvironment {
  /** Production environment */
  PRODUCTION = 'production',
  /** Test/Sandbox environment */
  SANDBOX = 'sandbox',
}

/**
 * FinanzOnline WebService endpoints
 */
export interface FonEndpoints {
  /** Base URL for the service */
  baseUrl: string;
  /** Authentication endpoint */
  authUrl: string;
  /** VAT return submission endpoint */
  vatReturnUrl: string;
  /** Income tax submission endpoint */
  incomeTaxUrl: string;
  /** Status query endpoint */
  statusUrl: string;
}

/**
 * FinanzOnline configuration
 */
export interface FonConfig {
  /** Environment (production or sandbox) */
  environment: FonEnvironment;
  /** WebService endpoints */
  endpoints: FonEndpoints;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Enable detailed logging */
  debug: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Session timeout in minutes */
  sessionTimeout: number;
}

/**
 * FinanzOnline session data
 */
export interface FonSession {
  /** Unique session identifier */
  sessionId: string;
  /** Authentication token */
  token: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Session expiration timestamp */
  expiresAt: Date;
  /** User's tax ID (Steuernummer) */
  taxId: string;
  /** Environment used */
  environment: FonEnvironment;
}

/**
 * Certificate information
 */
export interface FonCertificate {
  /** Certificate content (PEM or P12 format) */
  certificate: string;
  /** Certificate password (for P12) */
  password?: string;
  /** Certificate type */
  type: 'PEM' | 'P12';
  /** Certificate validity start date */
  validFrom?: Date;
  /** Certificate validity end date */
  validTo?: Date;
}

/**
 * Default endpoints for FinanzOnline
 */
export const FON_PRODUCTION_ENDPOINTS: FonEndpoints = {
  baseUrl: 'https://finanzonline.bmf.gv.at',
  authUrl: '/fon/ws/authenticate',
  vatReturnUrl: '/fon/ws/submitVAT',
  incomeTaxUrl: '/fon/ws/submitIncomeTax',
  statusUrl: '/fon/ws/queryStatus',
};

export const FON_SANDBOX_ENDPOINTS: FonEndpoints = {
  baseUrl: 'https://finanzonline-test.bmf.gv.at',
  authUrl: '/fon/ws/authenticate',
  vatReturnUrl: '/fon/ws/submitVAT',
  incomeTaxUrl: '/fon/ws/submitIncomeTax',
  statusUrl: '/fon/ws/queryStatus',
};
