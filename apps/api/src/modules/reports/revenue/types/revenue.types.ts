/**
 * Revenue Recognition Types
 * Type definitions for revenue recognition and SaaS metrics
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * MRR (Monthly Recurring Revenue) Breakdown
 */
export interface MrrBreakdown {
  month: Date;
  currency: string;

  // MRR Components
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnMrr: number;
  reactivationMrr: number;

  // Totals
  netNewMrr: number;
  totalMrr: number;

  // Customer metrics
  customerCount: number;
  newCustomers: number;
  churnedCustomers: number;

  // Growth metrics
  mrrGrowthRate: number; // Percentage
  customerGrowthRate: number; // Percentage
}

/**
 * ARR (Annual Recurring Revenue) Metrics
 */
export interface ArrMetrics {
  arr: number; // MRR * 12
  currency: string;
  asOfDate: Date;
  calculatedFrom: 'mrr' | 'subscriptions';
}

/**
 * Churn Metrics
 */
export interface ChurnMetrics {
  period: Date;
  currency: string;

  // Revenue churn
  grossRevenueChurnRate: number; // Lost MRR / Starting MRR
  netRevenueRetentionRate: number; // (Starting MRR + Expansion - Contraction - Churn) / Starting MRR

  // Customer churn
  customerChurnRate: number; // Churned customers / Starting customers
  customerRetentionRate: number; // Retained customers / Starting customers

  // Expansion metrics
  expansionRate: number; // Expansion MRR / Starting MRR
  contractionRate: number; // Contraction MRR / Starting MRR
}

/**
 * Revenue by Tier
 */
export interface RevenueTier {
  tierName: string;
  tierPrice: number;
  customerCount: number;
  mrr: number;
  arr: number;
  percentOfTotal: number;
}

export interface RevenueTierReport {
  month: Date;
  currency: string;
  tiers: RevenueTier[];
  totalMrr: number;
  totalArr: number;
}

/**
 * Cohort Analysis
 */
export interface CohortMetrics {
  cohortMonth: Date;
  initialCustomers: number;
  currentCustomers: number;
  retentionRate: number;

  // Revenue metrics
  initialMrr: number;
  currentMrr: number;
  lifetimeValue: number;

  // Monthly breakdown
  monthlyRevenue: {
    month: Date;
    revenue: number;
    mrr: number;
    activeCustomers: number;
    churnedCustomers: number;
  }[];
}

export interface CohortReport {
  currency: string;
  cohorts: CohortMetrics[];
  averageLifetimeValue: number;
  averageRetentionRate: number;
}

/**
 * Deferred Revenue Schedule
 */
export interface DeferredRevenueItem {
  invoiceId: string;
  invoiceNumber: string;
  organisationId: string;
  organisationName?: string;

  billingDate: Date;
  recognitionStart: Date;
  recognitionEnd: Date;

  totalAmount: number;
  recognizedToDate: number;
  remainingDeferred: number;

  currency: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface DeferredRevenueSchedule {
  asOfDate: Date;
  currency: string;
  items: DeferredRevenueItem[];

  // Summary totals
  totalDeferred: number;
  totalRecognized: number;
  totalRemaining: number;

  // By time period
  deferredBy30Days: number;
  deferredBy60Days: number;
  deferredBy90Days: number;
  deferredBeyond90Days: number;
}

/**
 * Revenue Forecast
 */
export interface ForecastDataPoint {
  month: Date;
  forecastedMrr: number;
  forecastedArr: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  forecastMethod: 'LINEAR' | 'MOVING_AVERAGE' | 'EXPONENTIAL';
}

export interface RevenueForecastReport {
  currency: string;
  generatedAt: Date;
  historicalMonths: number;
  averageGrowthRate: number;

  // Historical data (last 12 months)
  historical: {
    month: Date;
    actualMrr: number;
    actualArr: number;
  }[];

  // Forecast (next 12 months)
  forecast: ForecastDataPoint[];
}

/**
 * Revenue Recognition Entry
 */
export interface RevenueRecognitionEntry {
  id: string;
  organisationId: string;
  subscriptionId?: string;

  periodStart: Date;
  periodEnd: Date;
  recognitionMonth: Date;

  totalAmount: number;
  recognizedAmount: number;
  deferredAmount: number;

  currency: string;
  description?: string;
  invoiceId?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * MRR Movement Summary
 */
export interface MrrMovementSummary {
  dateRange: {
    start: Date;
    end: Date;
  };
  currency: string;

  startingMrr: number;
  endingMrr: number;
  mrrChange: number;
  mrrChangePercent: number;

  totalNewMrr: number;
  totalExpansionMrr: number;
  totalContractionMrr: number;
  totalChurnMrr: number;
  totalReactivationMrr: number;

  movements: MrrBreakdown[];
}

/**
 * Query Options
 */
export interface RevenueQueryOptions {
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  organisationId?: string;
}

export interface CohortQueryOptions {
  startCohort?: Date;
  endCohort?: Date;
  currency?: string;
  minCustomers?: number; // Filter out small cohorts
}

export interface ForecastOptions {
  months?: number; // Number of months to forecast (default 12)
  method?: 'LINEAR' | 'MOVING_AVERAGE' | 'EXPONENTIAL';
  historicalPeriod?: number; // Months of historical data to use (default 12)
  currency?: string;
}
