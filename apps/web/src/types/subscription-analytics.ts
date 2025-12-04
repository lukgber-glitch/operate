/**
 * Subscription Analytics Types
 * Types for subscription metrics, MRR/ARR tracking, and churn analytics
 */

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'paused';

export type SubscriptionTier =
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom';

export interface SubscriptionStats {
  totalMRR: number;
  totalARR: number;
  activeSubscriptions: number;
  trialConversions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

export interface MRRDataPoint {
  date: string;
  mrr: number;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
}

export interface RevenueByTier {
  tier: SubscriptionTier;
  revenue: number;
  subscriptionCount: number;
  percentage: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  mrr: number;
  billingInterval: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDetail extends Subscription {
  usage: {
    users: number;
    userLimit: number;
    storage: number;
    storageLimit: number;
    apiCalls: number;
    apiCallLimit: number;
  };
  paymentHistory: PaymentRecord[];
  dunningStatus?: DunningStatus;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  date: string;
  invoiceUrl?: string;
}

export interface DunningStatus {
  isPastDue: boolean;
  daysPastDue: number;
  retryCount: number;
  nextRetryDate?: string;
  lastFailureReason?: string;
}

export interface SubscriptionChange {
  id: string;
  subscriptionId: string;
  customerName: string;
  type: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'reactivated';
  fromTier?: SubscriptionTier;
  toTier?: SubscriptionTier;
  mrrChange: number;
  date: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus[];
  tier?: SubscriptionTier[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChurnMetrics {
  churnRate: number;
  customerChurnRate: number;
  revenueChurnRate: number;
  churnedMRR: number;
  churnedCustomers: number;
  trend: 'up' | 'down' | 'stable';
}
