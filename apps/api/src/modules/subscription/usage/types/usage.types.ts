/**
 * Usage-Based Billing Types
 * Defines types for metered billing and usage tracking
 */

import { UsageFeature } from '@prisma/client';

/**
 * Usage Feature Configuration
 */
export interface UsageFeatureConfig {
  feature: UsageFeature;
  displayName: string;
  description: string;
  unit: string; // 'scan', 'call', 'GB', 'classification', etc.
  defaultIncludedQuantity: number;
  defaultPricePerUnit: number; // In cents
  stripeMeteredPriceId?: string; // Stripe price ID for metered billing
}

/**
 * Usage Feature Configurations
 */
export const USAGE_FEATURE_CONFIGS: Record<UsageFeature, UsageFeatureConfig> = {
  [UsageFeature.OCR_SCAN]: {
    feature: UsageFeature.OCR_SCAN,
    displayName: 'OCR Scans',
    description: 'Receipt and invoice scanning with OCR',
    unit: 'scan',
    defaultIncludedQuantity: 50,
    defaultPricePerUnit: 5, // $0.05 per scan
  },
  [UsageFeature.API_CALL]: {
    feature: UsageFeature.API_CALL,
    displayName: 'API Calls',
    description: 'API requests to the platform',
    unit: 'call',
    defaultIncludedQuantity: 10000,
    defaultPricePerUnit: 0.1, // $0.001 per call
  },
  [UsageFeature.STORAGE_GB]: {
    feature: UsageFeature.STORAGE_GB,
    displayName: 'Storage',
    description: 'Document and file storage',
    unit: 'GB',
    defaultIncludedQuantity: 5,
    defaultPricePerUnit: 2, // $0.02 per GB
  },
  [UsageFeature.AI_CLASSIFICATION]: {
    feature: UsageFeature.AI_CLASSIFICATION,
    displayName: 'AI Classifications',
    description: 'AI-powered transaction categorization',
    unit: 'classification',
    defaultIncludedQuantity: 100,
    defaultPricePerUnit: 1, // $0.01 per classification
  },
  [UsageFeature.EMAIL_SENT]: {
    feature: UsageFeature.EMAIL_SENT,
    displayName: 'Emails',
    description: 'Transactional emails sent',
    unit: 'email',
    defaultIncludedQuantity: 1000,
    defaultPricePerUnit: 0.5, // $0.005 per email
  },
  [UsageFeature.BANK_SYNC]: {
    feature: UsageFeature.BANK_SYNC,
    displayName: 'Bank Syncs',
    description: 'Bank account synchronization',
    unit: 'sync',
    defaultIncludedQuantity: 30,
    defaultPricePerUnit: 3, // $0.03 per sync
  },
  [UsageFeature.SMS_SENT]: {
    feature: UsageFeature.SMS_SENT,
    displayName: 'SMS Messages',
    description: 'SMS notifications sent',
    unit: 'sms',
    defaultIncludedQuantity: 100,
    defaultPricePerUnit: 10, // $0.10 per SMS
  },
  [UsageFeature.EXPORT_PDF]: {
    feature: UsageFeature.EXPORT_PDF,
    displayName: 'PDF Exports',
    description: 'Document PDF exports',
    unit: 'export',
    defaultIncludedQuantity: 200,
    defaultPricePerUnit: 2, // $0.02 per export
  },
  [UsageFeature.WEBHOOK_CALL]: {
    feature: UsageFeature.WEBHOOK_CALL,
    displayName: 'Webhook Calls',
    description: 'Outbound webhook requests',
    unit: 'webhook',
    defaultIncludedQuantity: 5000,
    defaultPricePerUnit: 0.2, // $0.002 per webhook
  },
  [UsageFeature.CUSTOM_REPORT]: {
    feature: UsageFeature.CUSTOM_REPORT,
    displayName: 'Custom Reports',
    description: 'Custom report generation',
    unit: 'report',
    defaultIncludedQuantity: 50,
    defaultPricePerUnit: 5, // $0.05 per report
  },
  [UsageFeature.AI_MESSAGES]: {
    feature: UsageFeature.AI_MESSAGES,
    displayName: 'AI Chat Messages',
    description: 'AI-powered chat messages per month',
    unit: 'message',
    defaultIncludedQuantity: 50,
    defaultPricePerUnit: 2, // $0.02 per message
  },
  [UsageFeature.BANK_CONNECTIONS]: {
    feature: UsageFeature.BANK_CONNECTIONS,
    displayName: 'Bank Connections',
    description: 'Connected bank accounts (current count)',
    unit: 'connection',
    defaultIncludedQuantity: 1,
    defaultPricePerUnit: 0, // Not charged per-unit, tier-based
  },
  [UsageFeature.INVOICES]: {
    feature: UsageFeature.INVOICES,
    displayName: 'Invoices',
    description: 'Invoices created per month',
    unit: 'invoice',
    defaultIncludedQuantity: 5,
    defaultPricePerUnit: 10, // $0.10 per invoice over limit
  },
  [UsageFeature.EMAIL_SYNCS]: {
    feature: UsageFeature.EMAIL_SYNCS,
    displayName: 'Email Syncs',
    description: 'Email inbox synchronizations per month',
    unit: 'sync',
    defaultIncludedQuantity: 10,
    defaultPricePerUnit: 5, // $0.05 per sync
  },
  [UsageFeature.TAX_FILINGS]: {
    feature: UsageFeature.TAX_FILINGS,
    displayName: 'Tax Filings',
    description: 'Tax filings submitted per month',
    unit: 'filing',
    defaultIncludedQuantity: 1,
    defaultPricePerUnit: 50, // $0.50 per filing
  },
};

/**
 * Current Usage Summary
 */
export interface CurrentUsageSummary {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  features: FeatureUsageSummary[];
  totalOverageAmount: number;
  currency: string;
}

/**
 * Feature Usage Summary
 */
export interface FeatureUsageSummary {
  feature: UsageFeature;
  displayName: string;
  unit: string;
  totalQuantity: number;
  includedQuantity: number;
  overageQuantity: number;
  pricePerUnit: number;
  overageAmount: number;
  percentUsed: number;
  currency: string;
}

/**
 * Usage Event Metadata
 */
export interface UsageEventMetadata {
  // For OCR_SCAN
  fileSize?: number;
  fileType?: string;
  documentType?: string;

  // For API_CALL
  endpoint?: string;
  method?: string;
  responseTime?: number;

  // For STORAGE_GB
  currentTotalSizeBytes?: number;

  // For AI_CLASSIFICATION
  confidenceScore?: number;
  category?: string;

  // For EMAIL_SENT
  recipientCount?: number;
  emailType?: string;

  // Generic
  [key: string]: any;
}

/**
 * Usage Estimate
 */
export interface UsageEstimate {
  organizationId: string;
  estimatedDate: Date;
  features: FeatureUsageEstimate[];
  estimatedTotalAmount: number;
  currency: string;
}

/**
 * Feature Usage Estimate
 */
export interface FeatureUsageEstimate {
  feature: UsageFeature;
  projectedQuantity: number;
  projectedOverage: number;
  estimatedAmount: number;
}

/**
 * Usage Quota Configuration
 */
export interface UsageQuotaConfig {
  organizationId: string;
  feature: UsageFeature;
  includedQuantity: number;
  pricePerUnit: number;
  currency: string;
  resetPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
}

/**
 * Usage Report Period
 */
export type UsagePeriod = 'current' | 'last_month' | 'last_quarter' | 'last_year' | 'custom';

/**
 * Usage History Entry
 */
export interface UsageHistoryEntry {
  periodStart: Date;
  periodEnd: Date;
  features: FeatureUsageSummary[];
  totalAmount: number;
  currency: string;
}
