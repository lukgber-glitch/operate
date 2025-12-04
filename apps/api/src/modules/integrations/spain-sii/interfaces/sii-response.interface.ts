import { SiiErrorCode } from '../constants/sii.constants';
import { SiiInvoiceId } from './sii-invoice.interface';

/**
 * SII Submission Status
 */
export enum SiiSubmissionStatus {
  ACCEPTED = 'ACCEPTED', // Aceptada
  ACCEPTED_WITH_ERRORS = 'ACCEPTED_WITH_ERRORS', // Aceptada con errores
  REJECTED = 'REJECTED', // Rechazada
  PENDING = 'PENDING', // Pendiente
  PROCESSING = 'PROCESSING', // En proceso
}

/**
 * Base SII Response
 */
export interface SiiBaseResponse {
  success: boolean;
  timestamp: Date;
  errorCode?: SiiErrorCode | string;
  errorMessage?: string;
}

/**
 * SII Invoice Submission Response
 */
export interface SiiInvoiceSubmissionResponse extends SiiBaseResponse {
  submissionId?: string;
  invoiceResults?: SiiInvoiceResult[];
  acceptedCount?: number;
  rejectedCount?: number;
  csvReference?: string; // CSV (Código Seguro de Verificación)
}

/**
 * Individual Invoice Result within Batch
 */
export interface SiiInvoiceResult {
  invoiceId: SiiInvoiceId;
  status: SiiSubmissionStatus;
  registrationState?: SiiRegistrationState;
  errorCode?: string;
  errorDescription?: string;
  warnings?: SiiWarning[];
}

/**
 * SII Registration State
 */
export enum SiiRegistrationState {
  CORRECTLY_REGISTERED = 'CORRECTLY_REGISTERED', // Correctamente registrada
  PREVIOUSLY_REGISTERED = 'PREVIOUSLY_REGISTERED', // Previamente registrada
  REGISTRATION_ACCEPTED_WITH_ERRORS = 'REGISTRATION_ACCEPTED_WITH_ERRORS', // Registro aceptado con errores
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED', // Registro rechazado
}

/**
 * SII Warning
 */
export interface SiiWarning {
  code: string;
  description: string;
  field?: string;
}

/**
 * SII Query Response
 */
export interface SiiQueryResponse extends SiiBaseResponse {
  invoices?: SiiQueryInvoice[];
  totalRecords?: number;
  hasMore?: boolean;
  nextPage?: string;
}

/**
 * SII Query Invoice Result
 */
export interface SiiQueryInvoice {
  invoiceId: SiiInvoiceId;
  registrationDate: Date;
  lastModifiedDate?: Date;
  state: SiiRegistrationState;
  csvReference?: string;
  invoiceData?: any; // Full invoice data if requested
}

/**
 * SII Status Check Response
 */
export interface SiiStatusResponse extends SiiBaseResponse {
  submissionId: string;
  status: SiiSubmissionStatus;
  submittedAt: Date;
  processedAt?: Date;
  csvReference?: string;
  invoiceResults?: SiiInvoiceResult[];
}

/**
 * SII SOAP Fault
 */
export interface SiiSoapFault {
  faultCode: string;
  faultString: string;
  detail?: {
    errorCode?: string;
    errorDescription?: string;
    technicalDetails?: string;
  };
}

/**
 * SII Validation Error
 */
export interface SiiValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

/**
 * SII Certificate Status
 */
export interface SiiCertificateStatus {
  valid: boolean;
  nif: string;
  holder: string;
  expiryDate: Date;
  issuer: string;
  serialNumber: string;
}

/**
 * Cached SII Submission
 */
export interface CachedSiiSubmission {
  submissionId: string;
  status: SiiSubmissionStatus;
  submittedAt: string;
  processedAt?: string;
  csvReference?: string;
  invoiceCount: number;
  acceptedCount: number;
  rejectedCount: number;
  expiresAt: string;
}
