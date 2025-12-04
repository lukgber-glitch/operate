import { registerAs } from '@nestjs/config';
import {
  KycLevel,
  KycWorkflowConfig,
  KycAutomationRule,
  KycDecisionType,
} from './types/kyc.types';

/**
 * KYC Module Configuration
 * Centralized configuration for KYC workflows and automation
 */

export default registerAs('kyc', () => ({
  /**
   * Workflow configurations by verification level
   */
  workflows: {
    [KycLevel.BASIC]: {
      level: KycLevel.BASIC,
      autoApproveThreshold: 20,
      expiryDays: 365,
      requiredChecks: ['government_id', 'selfie'],
    } as KycWorkflowConfig,

    [KycLevel.ENHANCED]: {
      level: KycLevel.ENHANCED,
      autoApproveThreshold: 15,
      requireManualReview: false, // Auto-approve if below threshold
      expiryDays: 365,
      requiredChecks: ['government_id', 'selfie', 'proof_of_address', 'database_check'],
    } as KycWorkflowConfig,

    [KycLevel.FULL]: {
      level: KycLevel.FULL,
      requireManualReview: true, // Always require manual review
      expiryDays: 365,
      requiredChecks: [
        'government_id',
        'selfie',
        'proof_of_address',
        'database_check',
        'sanctions_check',
        'pep_check',
      ],
    } as KycWorkflowConfig,
  },

  /**
   * Automation rules for decision-making
   * Rules are evaluated in order - first match wins
   */
  automationRules: [
    // Rule 1: Auto-approve very low risk
    {
      name: 'Auto-approve very low risk',
      condition: {
        riskScore: { max: 15 },
        allChecksPassed: true,
      },
      action: {
        decision: KycDecisionType.APPROVE,
      },
    },

    // Rule 2: Auto-approve low risk
    {
      name: 'Auto-approve low risk',
      condition: {
        riskScore: { min: 15, max: 25 },
        allChecksPassed: true,
      },
      action: {
        decision: KycDecisionType.APPROVE,
      },
    },

    // Rule 3: Manual review for medium risk
    {
      name: 'Escalate medium risk for review',
      condition: {
        riskScore: { min: 25, max: 50 },
      },
      action: {
        decision: KycDecisionType.ESCALATE,
        assignToReviewer: true,
      },
    },

    // Rule 4: Require additional info for high risk with some failures
    {
      name: 'Request additional information',
      condition: {
        riskScore: { min: 50, max: 65 },
        allChecksPassed: false,
      },
      action: {
        decision: KycDecisionType.REQUEST_INFO,
      },
    },

    // Rule 5: Escalate high risk
    {
      name: 'Escalate high risk',
      condition: {
        riskScore: { min: 65, max: 75 },
      },
      action: {
        decision: KycDecisionType.ESCALATE,
        assignToReviewer: true,
      },
    },

    // Rule 6: Auto-reject critical risk
    {
      name: 'Auto-reject critical risk',
      condition: {
        riskScore: { min: 75 },
      },
      action: {
        decision: KycDecisionType.REJECT,
      },
    },
  ] as KycAutomationRule[],

  /**
   * Risk scoring weights
   * Used to calculate overall risk score from individual checks
   */
  riskWeights: {
    government_id: 0.3, // 30% weight
    selfie: 0.2, // 20% weight
    proof_of_address: 0.15, // 15% weight
    database_check: 0.15, // 15% weight
    sanctions_check: 0.1, // 10% weight
    pep_check: 0.1, // 10% weight
  },

  /**
   * Re-verification settings
   */
  reVerification: {
    enabled: true,
    warningDays: 30, // Warn 30 days before expiry
    gracePeriodDays: 7, // Grace period after expiry
    autoTrigger: false, // Don't auto-start re-verification
  },

  /**
   * Notification settings
   */
  notifications: {
    onStart: true,
    onApprove: true,
    onReject: true,
    onExpiring: true,
    onExpired: true,
  },

  /**
   * Provider-specific settings
   */
  providers: {
    persona: {
      enabled: true,
      priority: 1, // Primary provider
      templateIds: {
        [KycLevel.BASIC]: process.env.PERSONA_TEMPLATE_BASIC || 'itmpl_basic',
        [KycLevel.ENHANCED]: process.env.PERSONA_TEMPLATE_ENHANCED || 'itmpl_enhanced',
        [KycLevel.FULL]: process.env.PERSONA_TEMPLATE_FULL || 'itmpl_full',
      },
    },
    internal: {
      enabled: false,
      priority: 2, // Fallback provider
    },
  },

  /**
   * Country-specific overrides
   * Override global settings for specific countries
   */
  countryOverrides: {
    // Germany - Higher risk threshold
    DE: {
      autoApproveThreshold: 15,
      requireManualReview: true,
    },
    // UK - Standard settings
    GB: {
      autoApproveThreshold: 20,
      requireManualReview: false,
    },
    // US - More strict
    US: {
      autoApproveThreshold: 10,
      requireManualReview: true,
      requiredChecks: ['government_id', 'selfie', 'proof_of_address', 'ssn_verification'],
    },
  },

  /**
   * Compliance settings
   */
  compliance: {
    auditRetentionYears: 7, // Keep audit trail for 7 years
    gdprCompliant: true,
    requireConsentForStorage: true,
    encryptSensitiveData: true,
  },

  /**
   * Performance settings
   */
  performance: {
    maxConcurrentVerifications: 100,
    syncBatchSize: 50,
    webhookRetryAttempts: 3,
    webhookRetryDelayMs: 1000,
  },
}));
