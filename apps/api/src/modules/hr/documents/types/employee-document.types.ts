/**
 * Employee Document Types
 * Type definitions for US employment compliance documents
 */

export enum EmployeeDocumentType {
  W4_FORM = 'W4_FORM',
  I9_FORM = 'I9_FORM',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  SOCIAL_SECURITY_CARD = 'SOCIAL_SECURITY_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  WORK_PERMIT = 'WORK_PERMIT',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum I9DocumentListType {
  LIST_A = 'LIST_A', // Identity and Employment Authorization
  LIST_B = 'LIST_B', // Identity only
  LIST_C = 'LIST_C', // Employment Authorization only
}

export enum FilingStatus {
  SINGLE = 'SINGLE',
  MARRIED_FILING_JOINTLY = 'MARRIED_FILING_JOINTLY',
  MARRIED_FILING_SEPARATELY = 'MARRIED_FILING_SEPARATELY',
  HEAD_OF_HOUSEHOLD = 'HEAD_OF_HOUSEHOLD',
}

export enum EVerifyStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  AUTHORIZED = 'AUTHORIZED',
  TENTATIVE_NON_CONFIRMATION = 'TENTATIVE_NON_CONFIRMATION',
  FINAL_NON_CONFIRMATION = 'FINAL_NON_CONFIRMATION',
}

/**
 * I-9 Document Lists
 * Per USCIS requirements
 */
export const I9_LIST_A_DOCUMENTS = [
  'US_PASSPORT',
  'US_PASSPORT_CARD',
  'PERMANENT_RESIDENT_CARD',
  'FOREIGN_PASSPORT_WITH_I551_STAMP',
  'FOREIGN_PASSPORT_WITH_I94',
  'EMPLOYMENT_AUTHORIZATION_DOCUMENT',
] as const;

export const I9_LIST_B_DOCUMENTS = [
  'DRIVERS_LICENSE',
  'STATE_ID_CARD',
  'SCHOOL_ID_WITH_PHOTO',
  'VOTER_REGISTRATION_CARD',
  'US_MILITARY_CARD',
  'US_COAST_GUARD_CARD',
  'NATIVE_AMERICAN_TRIBAL_DOCUMENT',
] as const;

export const I9_LIST_C_DOCUMENTS = [
  'SOCIAL_SECURITY_CARD',
  'BIRTH_CERTIFICATE',
  'NATIVE_AMERICAN_TRIBAL_DOCUMENT',
  'EMPLOYMENT_AUTHORIZATION_DOCUMENT',
] as const;

/**
 * Document retention periods (in years)
 */
export const DOCUMENT_RETENTION_PERIODS = {
  W4_FORM: 4, // IRS requirement: 4 years
  I9_FORM: 3, // USCIS requirement: 3 years after termination or 1 year after hire date, whichever is later
  GENERAL_DOCUMENT: 7, // General employment document retention
} as const;

/**
 * File upload constraints
 */
export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'],
} as const;

/**
 * W-4 Tax withholding brackets (2024)
 * These are simplified - in production, use IRS Publication 15-T
 */
export const W4_TAX_BRACKETS_2024 = {
  SINGLE: [
    { min: 0, max: 11000, rate: 0.1 },
    { min: 11001, max: 44725, rate: 0.12 },
    { min: 44726, max: 95375, rate: 0.22 },
    { min: 95376, max: 182100, rate: 0.24 },
    { min: 182101, max: 231250, rate: 0.32 },
    { min: 231251, max: 578125, rate: 0.35 },
    { min: 578126, max: Infinity, rate: 0.37 },
  ],
  MARRIED_FILING_JOINTLY: [
    { min: 0, max: 22000, rate: 0.1 },
    { min: 22001, max: 89050, rate: 0.12 },
    { min: 89051, max: 190750, rate: 0.22 },
    { min: 190751, max: 364200, rate: 0.24 },
    { min: 364201, max: 462500, rate: 0.32 },
    { min: 462501, max: 693750, rate: 0.35 },
    { min: 693751, max: Infinity, rate: 0.37 },
  ],
  MARRIED_FILING_SEPARATELY: [
    { min: 0, max: 11000, rate: 0.1 },
    { min: 11001, max: 44525, rate: 0.12 },
    { min: 44526, max: 95375, rate: 0.22 },
    { min: 95376, max: 182100, rate: 0.24 },
    { min: 182101, max: 231250, rate: 0.32 },
    { min: 231251, max: 346875, rate: 0.35 },
    { min: 346876, max: Infinity, rate: 0.37 },
  ],
  HEAD_OF_HOUSEHOLD: [
    { min: 0, max: 15700, rate: 0.1 },
    { min: 15701, max: 59850, rate: 0.12 },
    { min: 59851, max: 95350, rate: 0.22 },
    { min: 95351, max: 182100, rate: 0.24 },
    { min: 182101, max: 231250, rate: 0.32 },
    { min: 231251, max: 578100, rate: 0.35 },
    { min: 578101, max: Infinity, rate: 0.37 },
  ],
} as const;

/**
 * W-4 Dependent amounts (2024)
 */
export const W4_DEPENDENT_AMOUNTS = {
  CHILD_UNDER_17: 2000,
  OTHER_DEPENDENT: 500,
} as const;

/**
 * Standard deductions (2024)
 */
export const W4_STANDARD_DEDUCTIONS = {
  SINGLE: 13850,
  MARRIED_FILING_JOINTLY: 27700,
  MARRIED_FILING_SEPARATELY: 13850,
  HEAD_OF_HOUSEHOLD: 20800,
} as const;

/**
 * Document access permissions
 */
export interface DocumentAccessControl {
  canView: boolean;
  canUpload: boolean;
  canVerify: boolean;
  canDelete: boolean;
  requiresMfa?: boolean;
}

/**
 * Document audit entry
 */
export interface DocumentAuditEntry {
  action: 'VIEW' | 'UPLOAD' | 'VERIFY' | 'REJECT' | 'DELETE' | 'DOWNLOAD';
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}
