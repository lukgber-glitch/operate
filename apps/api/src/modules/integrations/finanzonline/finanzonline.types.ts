/**
 * FinanzOnline SOAP Types
 * TypeScript type definitions for FinanzOnline Session-Webservice SOAP requests and responses
 * Based on BMF Session-Webservice specification
 */

import {
  FinanzOnlineEnvironment,
  FinanzOnlineAuthType,
  FinanzOnlineParticipantType,
} from './finanzonline.constants';

/**
 * SOAP Header Security Token
 */
export interface SoapSecurityToken {
  /** Username token */
  UsernameToken?: {
    Username: string;
    Password: string;
  };
  /** Binary security token (for certificates) */
  BinarySecurityToken?: {
    EncodingType: string;
    ValueType: string;
    _: string; // Base64 encoded certificate
  };
}

/**
 * SOAP Header
 */
export interface SoapHeader {
  /** Security element */
  Security?: SoapSecurityToken;
  /** Session ID */
  SessionId?: string;
}

/**
 * Login Request
 */
export interface LoginRequest {
  /** Participant ID (Teilnehmer-ID) */
  teilnehmerId: string;
  /** User ID (Benutzer-ID) */
  benId: string;
  /** PIN (only for USER_PIN auth type) */
  pin?: string;
  /** Authentication type */
  authType: FinanzOnlineAuthType;
  /** Herstellerid (manufacturer/software ID) */
  herstellerId?: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  /** Session ID */
  sessionId: string;
  /** Session token */
  sessionToken: string;
  /** Session creation timestamp */
  sessionCreated: Date;
  /** Session expiration timestamp */
  sessionExpires: Date;
  /** Participant information */
  participantInfo: ParticipantInfo;
}

/**
 * Logout Request
 */
export interface LogoutRequest {
  /** Session ID to terminate */
  sessionId: string;
}

/**
 * Logout Response
 */
export interface LogoutResponse {
  /** Logout success flag */
  success: boolean;
  /** Logout timestamp */
  timestamp: Date;
  /** Message */
  message?: string;
}

/**
 * Ping Request (session keep-alive)
 */
export interface PingRequest {
  /** Session ID to keep alive */
  sessionId: string;
}

/**
 * Ping Response
 */
export interface PingResponse {
  /** Ping success flag */
  success: boolean;
  /** Session still valid */
  sessionValid: boolean;
  /** Session expiration timestamp */
  sessionExpires?: Date;
  /** Server timestamp */
  timestamp: Date;
}

/**
 * Get Participant Info Request
 */
export interface GetParticipantInfoRequest {
  /** Participant ID */
  teilnehmerId: string;
  /** Session ID */
  sessionId?: string;
}

/**
 * Get Participant Info Response
 */
export interface GetParticipantInfoResponse {
  /** Participant information */
  participantInfo: ParticipantInfo;
}

/**
 * Participant Information
 */
export interface ParticipantInfo {
  /** Participant ID (Teilnehmer-ID) */
  teilnehmerId: string;
  /** Participant type */
  type: FinanzOnlineParticipantType;
  /** Company name (for legal entities) */
  companyName?: string;
  /** First name (for natural persons) */
  firstName?: string;
  /** Last name (for natural persons) */
  lastName?: string;
  /** Tax number (Steuernummer) */
  taxNumber?: string;
  /** VAT ID (UID-Nummer) */
  vatId?: string;
  /** Address */
  address?: Address;
  /** Contact information */
  contact?: ContactInfo;
  /** Tax office */
  taxOffice?: TaxOffice;
  /** Authorized users */
  authorizedUsers?: AuthorizedUser[];
  /** Account status */
  status: ParticipantStatus;
}

/**
 * Address
 */
export interface Address {
  /** Street */
  street?: string;
  /** House number */
  houseNumber?: string;
  /** Postal code */
  postalCode?: string;
  /** City */
  city?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
}

/**
 * Contact Information
 */
export interface ContactInfo {
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Fax number */
  fax?: string;
  /** Mobile number */
  mobile?: string;
}

/**
 * Tax Office
 */
export interface TaxOffice {
  /** Tax office number */
  number: string;
  /** Tax office name */
  name: string;
  /** Tax office address */
  address?: Address;
}

/**
 * Authorized User
 */
export interface AuthorizedUser {
  /** User ID */
  userId: string;
  /** User name */
  userName: string;
  /** User email */
  email?: string;
  /** Authorization level */
  authorizationLevel: AuthorizationLevel;
  /** Valid from date */
  validFrom?: Date;
  /** Valid until date */
  validUntil?: Date;
}

/**
 * Authorization Level
 */
export enum AuthorizationLevel {
  /** Full access */
  FULL = 'FULL',
  /** Read-only access */
  READ_ONLY = 'READ_ONLY',
  /** Submit only */
  SUBMIT_ONLY = 'SUBMIT_ONLY',
  /** View and submit */
  VIEW_SUBMIT = 'VIEW_SUBMIT',
}

/**
 * Participant Status
 */
export enum ParticipantStatus {
  /** Active */
  ACTIVE = 'ACTIVE',
  /** Inactive */
  INACTIVE = 'INACTIVE',
  /** Suspended */
  SUSPENDED = 'SUSPENDED',
  /** Locked */
  LOCKED = 'LOCKED',
}

/**
 * SOAP Fault
 */
export interface SoapFault {
  /** Fault code */
  faultcode: string;
  /** Fault string */
  faultstring: string;
  /** Fault actor */
  faultactor?: string;
  /** Fault detail */
  detail?: {
    /** Error code */
    errorCode?: string;
    /** Error message */
    errorMessage?: string;
    /** Additional error details */
    errorDetails?: any;
  };
}

/**
 * SOAP Envelope (generic wrapper)
 */
export interface SoapEnvelope<T = any> {
  /** SOAP Header */
  'soap:Header'?: SoapHeader;
  /** SOAP Body */
  'soap:Body': {
    [key: string]: T;
  } | {
    'soap:Fault': SoapFault;
  };
}

/**
 * FinanzOnline SOAP Client Configuration
 */
export interface FinanzOnlineClientConfig {
  /** Environment (production or test) */
  environment: FinanzOnlineEnvironment;
  /** WSDL URL (optional, will use default for environment) */
  wsdlUrl?: string;
  /** Service endpoint URL (optional, will use default for environment) */
  endpoint?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** TLS options */
  tls?: {
    /** Minimum TLS version */
    minVersion?: string;
    /** Maximum TLS version */
    maxVersion?: string;
    /** Cipher suites */
    ciphers?: string;
    /** Reject unauthorized certificates */
    rejectUnauthorized?: boolean;
  };
  /** SOAP options */
  soap?: {
    /** Force SOAP 1.1 */
    forceSoap11?: boolean;
    /** WSDL options */
    wsdl_options?: any;
    /** WSDL headers */
    wsdl_headers?: any;
  };
}

/**
 * FinanzOnline Session
 */
export interface FinanzOnlineSession {
  /** Session ID */
  sessionId: string;
  /** Session token */
  token: string;
  /** Participant ID */
  teilnehmerId: string;
  /** User ID */
  benId: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Session expiration timestamp */
  expiresAt: Date;
  /** Environment */
  environment: FinanzOnlineEnvironment;
  /** Participant information */
  participantInfo?: ParticipantInfo;
}

/**
 * FinanzOnline Error
 */
export interface FinanzOnlineError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error details */
  details?: any;
  /** Original SOAP fault (if applicable) */
  soapFault?: SoapFault;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * FinanzOnline SOAP Client
 */
export interface IFinanzOnlineClient {
  /**
   * Login to FinanzOnline
   */
  login(request: LoginRequest): Promise<LoginResponse>;

  /**
   * Logout from FinanzOnline
   */
  logout(request: LogoutRequest): Promise<LogoutResponse>;

  /**
   * Ping session (keep-alive)
   */
  ping(request: PingRequest): Promise<PingResponse>;

  /**
   * Get participant information
   */
  getParticipantInfo(request: GetParticipantInfoRequest): Promise<GetParticipantInfoResponse>;

  /**
   * Get current session
   */
  getSession(): FinanzOnlineSession | null;

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean;

  /**
   * Destroy the client
   */
  destroy(): void;
}

/**
 * FinanzOnline SOAP Operation Result
 */
export interface SoapOperationResult<T = any> {
  /** Success flag */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information */
  error?: FinanzOnlineError;
  /** Response metadata */
  metadata?: {
    /** Operation name */
    operation: string;
    /** Request timestamp */
    requestTime: Date;
    /** Response timestamp */
    responseTime: Date;
    /** Duration in milliseconds */
    duration: number;
  };
}
