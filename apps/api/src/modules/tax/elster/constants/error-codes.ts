/**
 * ELSTER Error Code Mapping
 * Maps ELSTER/tigerVAT error codes to structured metadata
 */

import { ErrorCodeMetadata, ErrorCategory } from '../types/elster-response.types';

/**
 * Common ELSTER error codes and their metadata
 */
export const ERROR_CODE_MAP: Record<string, ErrorCodeMetadata> = {
  // Validation errors - Tax identification
  ELSTER_VAL_001: {
    field: 'taxNumber',
    fieldLabel: 'Steuernummer',
    message: 'Invalid tax number format',
    localizedMessage: 'Die Steuernummer hat ein ungültiges Format',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    helpUrl: 'https://www.elster.de/eportal/hilfe/steuernummer',
    suggestedFix: 'Check that the tax number follows the format XXX/XXX/XXXXX',
  },

  ELSTER_VAL_002: {
    field: 'vatId',
    fieldLabel: 'Umsatzsteuer-Identifikationsnummer',
    message: 'Invalid VAT ID format',
    localizedMessage: 'Die USt-IdNr. hat ein ungültiges Format',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    helpUrl: 'https://www.bzst.de/DE/Unternehmen/Umsatzsteuer-Identifikationsnummer/umsatzsteuer-identifikationsnummer_node.html',
    suggestedFix: 'VAT ID must start with "DE" followed by 9 digits',
  },

  ELSTER_VAL_003: {
    field: 'taxNumber',
    fieldLabel: 'Steuernummer',
    message: 'Tax number not found in ELSTER system',
    localizedMessage: 'Die Steuernummer ist nicht im ELSTER-System hinterlegt',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    helpUrl: 'https://www.elster.de/eportal/hilfe/steuernummer',
    suggestedFix: 'Verify the tax number with your tax office',
  },

  // Validation errors - Period
  ELSTER_VAL_010: {
    field: 'period',
    fieldLabel: 'Zeitraum',
    message: 'Invalid period specified',
    localizedMessage: 'Der angegebene Zeitraum ist ungültig',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    suggestedFix: 'Check that the year and month/quarter are correct',
  },

  ELSTER_VAL_011: {
    field: 'period',
    fieldLabel: 'Zeitraum',
    message: 'Period already submitted',
    localizedMessage: 'Für diesen Zeitraum wurde bereits eine Anmeldung übermittelt',
    category: ErrorCategory.BUSINESS,
    isRetryable: false,
    suggestedFix: 'You can only submit one return per period. Use correction mode for changes.',
  },

  ELSTER_VAL_012: {
    field: 'period',
    fieldLabel: 'Zeitraum',
    message: 'Period is in the future',
    localizedMessage: 'Der Zeitraum liegt in der Zukunft',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    suggestedFix: 'You cannot submit returns for future periods',
  },

  ELSTER_VAL_013: {
    field: 'period',
    fieldLabel: 'Zeitraum',
    message: 'Period too far in the past',
    localizedMessage: 'Der Zeitraum liegt zu weit in der Vergangenheit',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    suggestedFix: 'Contact your tax office for historical corrections',
  },

  // Validation errors - Amounts
  ELSTER_VAL_020: {
    field: 'domesticRevenue19',
    fieldLabel: 'Umsätze 19%',
    message: 'Invalid amount for domestic revenue (19%)',
    localizedMessage: 'Ungültiger Betrag für Umsätze zum Steuersatz von 19%',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    suggestedFix: 'Amount must be a positive number',
  },

  ELSTER_VAL_021: {
    field: 'inputTax',
    fieldLabel: 'Vorsteuer',
    message: 'Invalid input tax amount',
    localizedMessage: 'Ungültiger Betrag für Vorsteuer',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    suggestedFix: 'Input tax must be a positive number',
  },

  ELSTER_VAL_022: {
    field: 'amounts',
    fieldLabel: 'Beträge',
    message: 'Amounts do not add up correctly',
    localizedMessage: 'Die Beträge stimmen nicht überein',
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    suggestedFix: 'Check that all amounts are calculated correctly',
  },

  // Certificate errors
  ELSTER_CERT_001: {
    field: 'certificate',
    fieldLabel: 'Zertifikat',
    message: 'Certificate has expired',
    localizedMessage: 'Das Zertifikat ist abgelaufen',
    category: ErrorCategory.CERTIFICATE,
    isRetryable: false,
    helpUrl: 'https://www.elster.de/eportal/zertifikat',
    suggestedFix: 'Upload a new valid certificate',
  },

  ELSTER_CERT_002: {
    field: 'certificate',
    fieldLabel: 'Zertifikat',
    message: 'Certificate is invalid',
    localizedMessage: 'Das Zertifikat ist ungültig',
    category: ErrorCategory.CERTIFICATE,
    isRetryable: false,
    helpUrl: 'https://www.elster.de/eportal/zertifikat',
    suggestedFix: 'Verify the certificate is in the correct format',
  },

  ELSTER_CERT_003: {
    field: 'certificate',
    fieldLabel: 'Zertifikat',
    message: 'Certificate does not match tax number',
    localizedMessage: 'Das Zertifikat passt nicht zur Steuernummer',
    category: ErrorCategory.CERTIFICATE,
    isRetryable: false,
    suggestedFix: 'Ensure the certificate is registered for this tax number',
  },

  ELSTER_CERT_004: {
    field: 'certificate',
    fieldLabel: 'Zertifikat',
    message: 'Certificate not activated',
    localizedMessage: 'Das Zertifikat wurde noch nicht aktiviert',
    category: ErrorCategory.CERTIFICATE,
    isRetryable: false,
    helpUrl: 'https://www.elster.de/eportal/zertifikat-aktivierung',
    suggestedFix: 'Activate the certificate in the ELSTER portal',
  },

  // Authentication errors
  ELSTER_AUTH_001: {
    message: 'Authentication failed',
    localizedMessage: 'Authentifizierung fehlgeschlagen',
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: false,
    suggestedFix: 'Check certificate and credentials',
  },

  ELSTER_AUTH_002: {
    message: 'Unauthorized access',
    localizedMessage: 'Keine Berechtigung',
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: false,
    suggestedFix: 'You are not authorized to submit returns for this tax number',
  },

  // Technical errors
  ELSTER_TECH_001: {
    message: 'ELSTER system is currently unavailable',
    localizedMessage: 'Das ELSTER-System ist derzeit nicht verfügbar',
    category: ErrorCategory.TECHNICAL,
    isRetryable: true,
    suggestedFix: 'Try again later',
  },

  ELSTER_TECH_002: {
    message: 'Connection timeout',
    localizedMessage: 'Zeitüberschreitung bei der Verbindung',
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    suggestedFix: 'Check your internet connection and try again',
  },

  ELSTER_TECH_003: {
    message: 'Invalid request format',
    localizedMessage: 'Ungültiges Anforderungsformat',
    category: ErrorCategory.TECHNICAL,
    isRetryable: false,
    suggestedFix: 'This is likely a system error. Contact support.',
  },

  ELSTER_TECH_004: {
    message: 'ELSTER server error',
    localizedMessage: 'ELSTER-Serverfehler',
    category: ErrorCategory.TECHNICAL,
    isRetryable: true,
    suggestedFix: 'ELSTER is experiencing issues. Try again later.',
  },

  // Business logic errors
  ELSTER_BUS_001: {
    message: 'Organisation not registered for VAT',
    localizedMessage: 'Das Unternehmen ist nicht für Umsatzsteuer registriert',
    category: ErrorCategory.BUSINESS,
    isRetryable: false,
    suggestedFix: 'Register for VAT with your tax office first',
  },

  ELSTER_BUS_002: {
    message: 'Incorrect filing frequency',
    localizedMessage: 'Falsche Anmeldefrist',
    category: ErrorCategory.BUSINESS,
    isRetryable: false,
    suggestedFix: 'Check whether you should file monthly or quarterly',
  },

  ELSTER_BUS_003: {
    message: 'Submission deadline has passed',
    localizedMessage: 'Die Abgabefrist ist abgelaufen',
    category: ErrorCategory.BUSINESS,
    isRetryable: false,
    suggestedFix: 'Contact your tax office for late submissions',
  },

  // TigerVAT specific errors
  TIGER_API_001: {
    message: 'TigerVAT API key is invalid',
    localizedMessage: 'TigerVAT API-Schlüssel ist ungültig',
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: false,
    suggestedFix: 'Check your TigerVAT API configuration',
  },

  TIGER_API_002: {
    message: 'TigerVAT rate limit exceeded',
    localizedMessage: 'TigerVAT Ratenlimit überschritten',
    category: ErrorCategory.TECHNICAL,
    isRetryable: true,
    suggestedFix: 'Wait a few minutes before trying again',
  },

  TIGER_API_003: {
    message: 'TigerVAT service unavailable',
    localizedMessage: 'TigerVAT-Dienst nicht verfügbar',
    category: ErrorCategory.TECHNICAL,
    isRetryable: true,
    suggestedFix: 'TigerVAT is experiencing issues. Try again later.',
  },
};

/**
 * Default error metadata for unknown codes
 */
export const DEFAULT_ERROR_METADATA: ErrorCodeMetadata = {
  message: 'Unknown error occurred',
  localizedMessage: 'Ein unbekannter Fehler ist aufgetreten',
  category: ErrorCategory.TECHNICAL,
  isRetryable: true,
  suggestedFix: 'Try again or contact support',
};

/**
 * Field label translations (German)
 */
export const FIELD_LABELS: Record<string, string> = {
  taxNumber: 'Steuernummer',
  vatId: 'Umsatzsteuer-Identifikationsnummer',
  period: 'Zeitraum',
  year: 'Jahr',
  month: 'Monat',
  quarter: 'Quartal',
  domesticRevenue19: 'Umsätze zum Steuersatz von 19%',
  domesticRevenue7: 'Umsätze zum Steuersatz von 7%',
  taxFreeRevenue: 'Steuerfreie Umsätze',
  euDeliveries: 'Innergemeinschaftliche Lieferungen',
  euAcquisitions19: 'Innergemeinschaftliche Erwerbe (19%)',
  euAcquisitions7: 'Innergemeinschaftliche Erwerbe (7%)',
  reverseChargeRevenue: 'Umsätze nach §13b UStG',
  inputTax: 'Abziehbare Vorsteuer',
  importVat: 'Einfuhrumsatzsteuer',
  euAcquisitionsInputTax: 'Vorsteuer aus innergemeinschaftlichen Erwerben',
  certificate: 'Zertifikat',
  amounts: 'Beträge',
};

/**
 * Status code mapping
 */
export const STATUS_MESSAGES: Record<string, { message: string; isRetryable: boolean; isFinal: boolean }> = {
  SUCCESS: {
    message: 'Successfully submitted to ELSTER',
    isRetryable: false,
    isFinal: true,
  },
  PENDING: {
    message: 'Submission is being processed',
    isRetryable: false,
    isFinal: false,
  },
  ACCEPTED: {
    message: 'Submission accepted by ELSTER',
    isRetryable: false,
    isFinal: true,
  },
  REJECTED: {
    message: 'Submission rejected by ELSTER',
    isRetryable: false,
    isFinal: true,
  },
  VALIDATION_ERROR: {
    message: 'Data validation failed',
    isRetryable: false,
    isFinal: true,
  },
  CERTIFICATE_ERROR: {
    message: 'Certificate error',
    isRetryable: false,
    isFinal: true,
  },
  TECHNICAL_ERROR: {
    message: 'Technical error occurred',
    isRetryable: true,
    isFinal: false,
  },
  TIMEOUT: {
    message: 'Request timed out',
    isRetryable: true,
    isFinal: false,
  },
  UNKNOWN: {
    message: 'Unknown status',
    isRetryable: true,
    isFinal: false,
  },
};
