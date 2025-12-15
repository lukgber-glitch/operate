/**
 * Subscription Types and Constants
 * Defines subscription tiers, features, and limits for the platform
 */

/**
 * Subscription Tier Enum
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

/**
 * Platform Features
 */
export enum PlatformFeature {
  // FREE features
  BASIC_INVOICING = 'basic_invoicing',
  BASIC_EXPENSE_TRACKING = 'basic_expense_tracking',
  AI_CHAT_ASSISTANT = 'ai_chat_assistant',
  SINGLE_BANK_CONNECTION = 'single_bank_connection',

  // STARTER features
  MULTI_BANK_CONNECTIONS = 'multi_bank_connections',
  EMAIL_INTEGRATION = 'email_integration',
  BASIC_REPORTS = 'basic_reports',
  DATEV_EXPORT = 'datev_export',
  RECEIPT_SCANNING = 'receipt_scanning',

  // PRO features
  UNLIMITED_AI_MESSAGES = 'unlimited_ai_messages',
  TAX_FILING = 'tax_filing',
  CASH_FLOW_FORECASTING = 'cash_flow_forecasting',
  ADVANCED_REPORTS = 'advanced_reports',
  DOCUMENT_OCR = 'document_ocr',
  TEAM_COLLABORATION = 'team_collaboration',

  // BUSINESS features
  UNLIMITED_BANK_CONNECTIONS = 'unlimited_bank_connections',
  UNLIMITED_TEAM_MEMBERS = 'unlimited_team_members',
  API_ACCESS = 'api_access',
  MULTI_CURRENCY = 'multi_currency',
  CUSTOM_INTEGRATIONS = 'custom_integrations',
  PRIORITY_SUPPORT = 'priority_support',
}

/**
 * Billing Interval
 */
export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

/**
 * Tier Configuration
 */
export interface TierConfig {
  name: SubscriptionTier;
  priceMonthly: number; // Monthly price in cents (EUR)
  priceAnnual: number; // Annual price in cents (EUR)
  aiMessages: number; // -1 = unlimited
  bankConnections: number; // -1 = unlimited
  invoices: number; // -1 = unlimited
  teamMembers: number; // -1 = unlimited
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
    priceMonthly: 0,
    priceAnnual: 0,
    aiMessages: 50,
    bankConnections: 1,
    invoices: 5,
    teamMembers: 1,
    features: [
      PlatformFeature.BASIC_INVOICING,
      PlatformFeature.BASIC_EXPENSE_TRACKING,
      PlatformFeature.AI_CHAT_ASSISTANT,
      PlatformFeature.SINGLE_BANK_CONNECTION,
    ],
    displayName: 'Free',
    description: 'Perfect for getting started with basic features',
  },
  [SubscriptionTier.STARTER]: {
    name: SubscriptionTier.STARTER,
    priceMonthly: 990, // €9.90/month
    priceAnnual: 9500, // €95.00/year
    aiMessages: 200,
    bankConnections: 3,
    invoices: -1, // unlimited
    teamMembers: 1,
    features: [
      // All FREE features
      PlatformFeature.BASIC_INVOICING,
      PlatformFeature.BASIC_EXPENSE_TRACKING,
      PlatformFeature.AI_CHAT_ASSISTANT,
      PlatformFeature.SINGLE_BANK_CONNECTION,
      // STARTER features
      PlatformFeature.MULTI_BANK_CONNECTIONS,
      PlatformFeature.EMAIL_INTEGRATION,
      PlatformFeature.BASIC_REPORTS,
      PlatformFeature.DATEV_EXPORT,
      PlatformFeature.RECEIPT_SCANNING,
    ],
    displayName: 'Starter',
    description: 'Essential features for small businesses',
  },
  [SubscriptionTier.PRO]: {
    name: SubscriptionTier.PRO,
    priceMonthly: 1990, // €19.90/month
    priceAnnual: 19000, // €190.00/year
    aiMessages: -1, // unlimited
    bankConnections: 10,
    invoices: -1, // unlimited
    teamMembers: 3,
    features: [
      // All FREE features
      PlatformFeature.BASIC_INVOICING,
      PlatformFeature.BASIC_EXPENSE_TRACKING,
      PlatformFeature.AI_CHAT_ASSISTANT,
      PlatformFeature.SINGLE_BANK_CONNECTION,
      // All STARTER features
      PlatformFeature.MULTI_BANK_CONNECTIONS,
      PlatformFeature.EMAIL_INTEGRATION,
      PlatformFeature.BASIC_REPORTS,
      PlatformFeature.DATEV_EXPORT,
      PlatformFeature.RECEIPT_SCANNING,
      // PRO features
      PlatformFeature.UNLIMITED_AI_MESSAGES,
      PlatformFeature.TAX_FILING,
      PlatformFeature.CASH_FLOW_FORECASTING,
      PlatformFeature.ADVANCED_REPORTS,
      PlatformFeature.DOCUMENT_OCR,
      PlatformFeature.TEAM_COLLABORATION,
    ],
    displayName: 'Pro',
    description: 'Advanced features for growing businesses',
  },
  [SubscriptionTier.BUSINESS]: {
    name: SubscriptionTier.BUSINESS,
    priceMonthly: 3990, // €39.90/month
    priceAnnual: 38000, // €380.00/year
    aiMessages: -1, // unlimited
    bankConnections: -1, // unlimited
    invoices: -1, // unlimited
    teamMembers: -1, // unlimited
    features: Object.values(PlatformFeature), // All features
    displayName: 'Business',
    description: 'Complete solution with unlimited access and priority support',
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
  aiMessagesUsed: number;
  bankConnectionsUsed: number;
  invoicesCreated: number;
  teamMembersActive: number;
  limits: {
    aiMessages: number; // -1 = unlimited
    bankConnections: number; // -1 = unlimited
    invoices: number; // -1 = unlimited
    teamMembers: number; // -1 = unlimited
  };
  percentUsed: {
    aiMessages: number; // 0-100, -1 for unlimited
    bankConnections: number; // 0-100, -1 for unlimited
    invoices: number; // 0-100, -1 for unlimited
    teamMembers: number; // 0-100, -1 for unlimited
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
