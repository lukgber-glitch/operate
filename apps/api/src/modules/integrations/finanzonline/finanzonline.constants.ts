/**
 * FinanzOnline SOAP Client Constants
 * Based on BMF Session-Webservice specification
 * Documentation: https://www.bmf.gv.at/dam/jcr:95d0e370-4efb-4ac9-9132-165189ac30ba/BMF_Session_Webservice_Englisch.pdf
 */

/**
 * FinanzOnline environments
 */
export enum FinanzOnlineEnvironment {
  /** Production environment - FinanzOnline */
  PRODUCTION = 'production',
  /** Test environment - FonTest */
  TEST = 'test',
}

/**
 * FinanzOnline WSDL URLs
 */
export const FINANZONLINE_WSDL = {
  /** Production WSDL */
  PRODUCTION: 'https://finanzonline.bmf.gv.at/fonws/ws/sessionService.wsdl',
  /** Test environment WSDL */
  TEST: 'https://finanzonline-test.bmf.gv.at/fonws/ws/sessionService.wsdl',
} as const;

/**
 * FinanzOnline service endpoints
 */
export const FINANZONLINE_ENDPOINTS = {
  /** Production service endpoint */
  PRODUCTION: 'https://finanzonline.bmf.gv.at/fonws/ws/sessionService',
  /** Test environment endpoint */
  TEST: 'https://finanzonline-test.bmf.gv.at/fonws/ws/sessionService',
} as const;

/**
 * FinanzOnline SOAP namespaces
 */
export const FINANZONLINE_NAMESPACES = {
  /** Main service namespace */
  SERVICE: 'http://bmf.gv.at/service/sessionservice',
  /** Common types namespace */
  COMMON: 'http://bmf.gv.at/service/common',
  /** SOAP envelope namespace */
  SOAP_ENV: 'http://schemas.xmlsoap.org/soap/envelope/',
  /** SOAP encoding namespace */
  SOAP_ENC: 'http://schemas.xmlsoap.org/soap/encoding/',
  /** XSD namespace */
  XSD: 'http://www.w3.org/2001/XMLSchema',
  /** XSI namespace */
  XSI: 'http://www.w3.org/2001/XMLSchema-instance',
} as const;

/**
 * FinanzOnline session service operations
 */
export const FINANZONLINE_OPERATIONS = {
  /** Login operation */
  LOGIN: 'login',
  /** Logout operation */
  LOGOUT: 'logout',
  /** Ping operation (session keep-alive) */
  PING: 'ping',
  /** Get participant info */
  GET_PARTICIPANT_INFO: 'getParticipantInfo',
} as const;

/**
 * FinanzOnline authentication types
 */
export enum FinanzOnlineAuthType {
  /** User ID and PIN */
  USER_PIN = 'USER_PIN',
  /** Certificate-based authentication */
  CERTIFICATE = 'CERTIFICATE',
  /** ELGA card */
  ELGA = 'ELGA',
  /** Mobile signature */
  MOBILE_SIGNATURE = 'MOBILE_SIGNATURE',
}

/**
 * FinanzOnline participant types
 */
export enum FinanzOnlineParticipantType {
  /** Natural person */
  NATURAL_PERSON = 'NATURAL_PERSON',
  /** Legal entity */
  LEGAL_ENTITY = 'LEGAL_ENTITY',
  /** Tax advisor */
  TAX_ADVISOR = 'TAX_ADVISOR',
}

/**
 * FinanzOnline error codes
 */
export const FINANZONLINE_ERROR_CODES = {
  /** Invalid credentials */
  INVALID_CREDENTIALS: 'E001',
  /** Session expired */
  SESSION_EXPIRED: 'E002',
  /** Invalid participant ID */
  INVALID_PARTICIPANT_ID: 'E003',
  /** Service unavailable */
  SERVICE_UNAVAILABLE: 'E004',
  /** Invalid certificate */
  INVALID_CERTIFICATE: 'E005',
  /** Account locked */
  ACCOUNT_LOCKED: 'E006',
  /** Invalid session ID */
  INVALID_SESSION_ID: 'E007',
  /** Timeout */
  TIMEOUT: 'E008',
  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED: 'E009',
  /** Internal server error */
  INTERNAL_ERROR: 'E999',
} as const;

/**
 * FinanzOnline TLS configuration
 */
export const FINANZONLINE_TLS_CONFIG = {
  /** Minimum TLS version */
  MIN_VERSION: 'TLSv1.3',
  /** Maximum TLS version */
  MAX_VERSION: 'TLSv1.3',
  /** Cipher suites */
  CIPHERS: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256',
    'TLS_CHACHA20_POLY1305_SHA256',
  ].join(':'),
} as const;

/**
 * FinanzOnline request timeout (30 seconds)
 */
export const FINANZONLINE_REQUEST_TIMEOUT = 30000;

/**
 * FinanzOnline session timeout (2 hours)
 */
export const FINANZONLINE_SESSION_TIMEOUT = 2 * 60 * 60 * 1000;

/**
 * FinanzOnline max retry attempts
 */
export const FINANZONLINE_MAX_RETRIES = 3;

/**
 * FinanzOnline retry delay (milliseconds)
 */
export const FINANZONLINE_RETRY_DELAY = 1000;

/**
 * FinanzOnline log levels
 */
export enum FinanzOnlineLogLevel {
  /** Debug level */
  DEBUG = 'debug',
  /** Info level */
  INFO = 'info',
  /** Warning level */
  WARN = 'warn',
  /** Error level */
  ERROR = 'error',
}

/**
 * FinanzOnline cache keys
 */
export const FINANZONLINE_CACHE_KEYS = {
  /** Session key prefix */
  SESSION: 'fon:session:',
  /** Participant info key prefix */
  PARTICIPANT: 'fon:participant:',
  /** WSDL cache key prefix */
  WSDL: 'fon:wsdl:',
} as const;

/**
 * FinanzOnline cache TTL (seconds)
 */
export const FINANZONLINE_CACHE_TTL = {
  /** Session cache TTL (2 hours) */
  SESSION: 7200,
  /** Participant info cache TTL (24 hours) */
  PARTICIPANT: 86400,
  /** WSDL cache TTL (1 week) */
  WSDL: 604800,
} as const;
