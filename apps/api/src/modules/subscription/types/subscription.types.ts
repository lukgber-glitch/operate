/**
 * Subscription Types and Constants
 * Defines subscription tiers, features, and limits for the platform
 */

/**
 * Subscription Tier Enum
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * Platform Features
 */
export enum PlatformFeature {
  // Core features
  INVOICES = 'invoices',
  EXPENSES = 'expenses',
  BASIC_REPORTS = 'basic_reports',

  // Pro features
  OCR = 'ocr',
  BANK_SYNC = 'bank_sync',
  RECURRING_INVOICES = 'recurring',
  ADVANCED_REPORTS = 'reports',
  API_ACCESS = 'api_access',
  MULTI_CURRENCY = 'multi_currency',

  // Enterprise features
  CUSTOM_INTEGRATIONS = 'custom_integrations',
  DEDICATED_SUPPORT = 'dedicated_support',
  SSO = 'sso',
  AUDIT_LOGS = 'audit_logs',
  CUSTOM_ROLES = 'custom_roles',
  WHITE_LABEL = 'white_label',
}

/**
 * Tier Configuration
 */
export interface TierConfig {
  name: SubscriptionTier;
  price: number; // Monthly price in cents (e.g., 2900 = $29.00)
  invoicesPerMonth: number; // -1 = unlimited
  maxUsers: number; // -1 = unlimited
  features: PlatformFeature[];
  displayName: string;
  description: string;
}

/**
 * Subscription Tier Definitions
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.FREE]: {
    name: SubscriptionTier.FREE,
    price: 0,
    invoicesPerMonth: 5,
    maxUsers: 1,
    features: [
      PlatformFeature.INVOICES,
      PlatformFeature.EXPENSES,
      PlatformFeature.BASIC_REPORTS,
    ],
    displayName: 'Free',
    description: 'Perfect for getting started with basic invoicing',
  },
  [SubscriptionTier.PRO]: {
    name: SubscriptionTier.PRO,
    price: 2900, // $29.00/month
    invoicesPerMonth: 100,
    maxUsers: 5,
    features: [
      PlatformFeature.INVOICES,
      PlatformFeature.EXPENSES,
      PlatformFeature.BASIC_REPORTS,
      PlatformFeature.OCR,
      PlatformFeature.BANK_SYNC,
      PlatformFeature.RECURRING_INVOICES,
      PlatformFeature.ADVANCED_REPORTS,
      PlatformFeature.API_ACCESS,
      PlatformFeature.MULTI_CURRENCY,
    ],
    displayName: 'Pro',
    description: 'Advanced features for growing businesses',
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: SubscriptionTier.ENTERPRISE,
    price: 9900, // $99.00/month
    invoicesPerMonth: -1, // unlimited
    maxUsers: -1, // unlimited
    features: Object.values(PlatformFeature), // All features
    displayName: 'Enterprise',
    description: 'Unlimited access with premium support',
  },
};

/**
 * Usage Tracking Metrics
 */
export interface UsageMetrics {
  orgId: string;
  tier: SubscriptionTier;
  period: {
    start: Date;
    end: Date;
  };
  invoicesCreated: number;
  activeUsers: number;
  limits: {
    invoicesPerMonth: number;
    maxUsers: number;
  };
  percentUsed: {
    invoices: number; // 0-100, -1 for unlimited
    users: number; // 0-100, -1 for unlimited
  };
}

/**
 * Feature Check Result
 */
export interface FeatureCheckResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  INCOMPLETE = 'INCOMPLETE',
  PAUSED = 'PAUSED',
}

/**
 * Subscription Change Type
 */
export enum SubscriptionChangeType {
  TRIAL_START = 'TRIAL_START',
  TRIAL_CONVERT = 'TRIAL_CONVERT',
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE',
  CANCEL = 'CANCEL',
  REACTIVATE = 'REACTIVATE',
  SEAT_ADD = 'SEAT_ADD',
  SEAT_REMOVE = 'SEAT_REMOVE',
}

/**
 * Organization Subscription Info
 */
export interface OrganizationSubscription {
  orgId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  seats: number;
  usage: UsageMetrics;
}
