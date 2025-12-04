/**
 * KYC Verification Types
 * Unified types for KYC verification system
 */

export enum KycStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum KycLevel {
  BASIC = 'basic',         // Basic ID verification
  ENHANCED = 'enhanced',   // Enhanced due diligence
  FULL = 'full',          // Full KYC with all checks
}

export enum KycProvider {
  PERSONA = 'persona',
  INTERNAL = 'internal',
}

export enum KycRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum KycDecisionType {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_INFO = 'request_info',
  ESCALATE = 'escalate',
}

export enum KycDecisionSource {
  AUTOMATED = 'automated',
  MANUAL = 'manual',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum RequirementType {
  GOVERNMENT_ID = 'government_id',
  PROOF_OF_ADDRESS = 'proof_of_address',
  SELFIE = 'selfie',
  BUSINESS_REGISTRATION = 'business_registration',
  BANK_STATEMENT = 'bank_statement',
  TAX_DOCUMENT = 'tax_document',
}

export interface KycVerificationData {
  id: string;
  userId: string;
  organisationId: string;
  status: KycStatus;
  level: KycLevel;
  provider: KycProvider;
  providerRefId?: string;
  riskScore?: number;
  riskLevel?: KycRiskLevel;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  decisionReason?: string;
  expiresAt?: Date;
  documents?: DocumentInfo[];
  checks?: CheckResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentInfo {
  type: RequirementType;
  fileName: string;
  uploadedAt: Date;
  verified: boolean;
  provider?: string;
  providerDocId?: string;
}

export interface CheckResult {
  checkType: string;
  status: 'passed' | 'failed' | 'pending' | 'manual_review';
  completedAt?: Date;
  details?: Record<string, any>;
}

export interface KycDecisionData {
  id: string;
  verificationId: string;
  decision: KycDecisionType;
  reason?: string;
  decidedBy: string;
  decisionType: KycDecisionSource;
  previousStatus: KycStatus;
  newStatus: KycStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface KycRequirementData {
  id: string;
  countryCode: string;
  customerType: CustomerType;
  requirementType: RequirementType;
  isRequired: boolean;
  description?: string;
  acceptedDocs: string[];
}

export interface KycStatistics {
  total: number;
  byStatus: Record<KycStatus, number>;
  byRiskLevel: Record<KycRiskLevel, number>;
  byProvider: Record<KycProvider, number>;
  averageProcessingTime: number; // in hours
  pendingReview: number;
  expiringIn30Days: number;
}

export interface KycWorkflowConfig {
  level: KycLevel;
  autoApproveThreshold?: number; // risk score threshold for auto-approval
  requireManualReview?: boolean;
  expiryDays: number;
  requiredChecks: string[];
}

export interface KycAutomationRule {
  name: string;
  condition: {
    riskScore?: { min?: number; max?: number };
    provider?: KycProvider;
    checksRequired?: string[];
    allChecksPassed?: boolean;
  };
  action: {
    decision: KycDecisionType;
    assignToReviewer?: boolean;
  };
}
