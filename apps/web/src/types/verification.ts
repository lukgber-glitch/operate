// KYC Verification Types

export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum VerificationLevel {
  BASIC = 'basic',
  ENHANCED = 'enhanced',
  FULL = 'full',
}

export enum DocumentType {
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
  PROOF_OF_ADDRESS = 'proof_of_address',
  BANK_STATEMENT = 'bank_statement',
  UTILITY_BILL = 'utility_bill',
  BUSINESS_REGISTRATION = 'business_registration',
  TAX_DOCUMENT = 'tax_document',
  SELFIE = 'selfie',
}

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl?: string;
  fileName?: string;
  uploadedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface VerificationRequirement {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
}

export interface VerificationHistoryEntry {
  id: string;
  timestamp: string;
  event: 'started' | 'document_uploaded' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired';
  description: string;
  metadata?: Record<string, any>;
}

export interface KycDecision {
  id: string;
  status: VerificationStatus;
  level: VerificationLevel;
  decidedAt: string;
  decidedBy?: string;
  reason?: string;
  notes?: string;
  expiresAt?: string;
}

export interface VerificationData {
  id: string;
  userId: string;
  orgId: string;
  status: VerificationStatus;
  level: VerificationLevel;
  currentStep: number;
  totalSteps: number;
  documents: VerificationDocument[];
  requirements: VerificationRequirement[];
  history: VerificationHistoryEntry[];
  decision?: KycDecision;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface VerificationStats {
  totalVerifications: number;
  pendingVerifications: number;
  verifiedUsers: number;
  rejectedVerifications: number;
  averageProcessingTime: number;
  expiringVerifications: number;
}

export interface DocumentUploadProgress {
  documentType: DocumentType;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}
