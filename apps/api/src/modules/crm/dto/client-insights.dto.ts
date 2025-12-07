import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// ENUMS
// ============================================================================

export enum PaymentVelocityTrend {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DECLINING = 'DECLINING',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export enum ClientSegment {
  ENTERPRISE = 'ENTERPRISE', // Top 20% by revenue
  MID_MARKET = 'MID_MARKET', // Middle 30%
  SMB = 'SMB', // Bottom 50%
  NEW = 'NEW', // Less than 3 months
}

export enum ChurnRiskLevel {
  CRITICAL = 'CRITICAL', // 80-100%
  HIGH = 'HIGH', // 60-80%
  MEDIUM = 'MEDIUM', // 40-60%
  LOW = 'LOW', // 0-40%
}

export enum TimeRange {
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_YEAR = 'LAST_YEAR',
  ALL_TIME = 'ALL_TIME',
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class RevenueBreakdownDto {
  @ApiProperty({ example: 125000.50 })
  totalRevenue: number;

  @ApiProperty({ example: 8500.25 })
  thisMonthRevenue: number;

  @ApiProperty({ example: 7200.00 })
  lastMonthRevenue: number;

  @ApiProperty({ example: 18.06 })
  monthOverMonthGrowth: number; // percentage

  @ApiProperty({ example: 95000.00 })
  thisYearRevenue: number;

  @ApiProperty({ example: 30000.00 })
  lastYearRevenue: number;

  @ApiProperty({ example: 216.67 })
  yearOverYearGrowth: number; // percentage

  @ApiProperty({ example: 8333.33 })
  averageMonthlyRevenue: number;

  @ApiProperty({ example: 4.2 })
  revenueContributionPercentage: number; // % of org total revenue

  @ApiProperty({ example: [8500, 7200, 9100, 8700, 7800, 9300] })
  last6MonthsRevenue: number[];
}

export class PaymentAnalyticsDto {
  @ApiProperty({ example: 15000.50 })
  outstandingBalance: number;

  @ApiProperty({ example: 28.5 })
  averagePaymentDays: number;

  @ApiProperty({ example: 22.3 })
  averagePaymentDaysLast30Days: number;

  @ApiProperty({ example: 'IMPROVING' })
  @ApiProperty({ enum: PaymentVelocityTrend })
  paymentVelocityTrend: PaymentVelocityTrend;

  @ApiProperty({ example: 92 })
  paymentReliabilityScore: number; // 0-100

  @ApiProperty({ example: 95.5 })
  onTimePaymentRate: number; // percentage

  @ApiProperty({ example: 0.95 })
  invoicePaidRatio: number; // paid invoices / total invoices

  @ApiProperty({ example: 3 })
  overdueInvoicesCount: number;

  @ApiProperty({ example: 8500.00 })
  overdueAmount: number;

  @ApiProperty({ example: 15 })
  longestOverdueDays: number;

  @ApiProperty({ example: '2024-11-15T10:00:00Z' })
  lastPaymentDate: Date | null;

  @ApiProperty({ example: 18 })
  daysSinceLastPayment: number | null;
}

export class InvoiceAnalyticsDto {
  @ApiProperty({ example: 48 })
  totalInvoices: number;

  @ApiProperty({ example: 42 })
  paidInvoices: number;

  @ApiProperty({ example: 3 })
  pendingInvoices: number;

  @ApiProperty({ example: 3 })
  overdueInvoices: number;

  @ApiProperty({ example: 2600.42 })
  averageInvoiceAmount: number;

  @ApiProperty({ example: 4 })
  invoicesPerMonth: number;

  @ApiProperty({ example: '2024-11-20T10:00:00Z' })
  lastInvoiceDate: Date | null;

  @ApiProperty({ example: 13 })
  daysSinceLastInvoice: number | null;

  @ApiProperty({ example: [4, 3, 5, 4, 4, 3] })
  last6MonthsInvoiceCount: number[];
}

export class SeasonalPatternsDto {
  @ApiProperty({ example: true })
  hasSeasonalPattern: boolean;

  @ApiProperty({ example: ['Q4', 'Q1'] })
  peakPeriods: string[];

  @ApiProperty({ example: ['Q3'] })
  lowPeriods: string[];

  @ApiProperty({ example: { Q1: 28000, Q2: 24000, Q3: 18000, Q4: 32000 } })
  quarterlyRevenue: Record<string, number>;

  @ApiProperty({
    example: {
      Jan: 9000, Feb: 8500, Mar: 10500, Apr: 8200, May: 7800, Jun: 8000,
      Jul: 6000, Aug: 6200, Sep: 5800, Oct: 10500, Nov: 11000, Dec: 10500
    }
  })
  monthlyRevenue: Record<string, number>;
}

export class RiskAssessmentDto {
  @ApiProperty({ example: 'LOW' })
  @ApiProperty({ enum: ChurnRiskLevel })
  churnRisk: ChurnRiskLevel;

  @ApiProperty({ example: 28.5 })
  churnRiskScore: number; // 0-100

  @ApiProperty({ example: ['Declining payment speed', 'Reduced invoice volume'] })
  riskFactors: string[];

  @ApiProperty({ example: ['Strong payment history', 'Growing revenue'] })
  positiveIndicators: string[];

  @ApiProperty({ example: 85 })
  engagementScore: number; // 0-100

  @ApiProperty({ example: 35 })
  daysSinceLastActivity: number;

  @ApiProperty({ example: false })
  isAtRisk: boolean;

  @ApiProperty({ example: 'Schedule quarterly review meeting' })
  recommendedAction: string | null;
}

export class ClientLifetimeValueDto {
  @ApiProperty({ example: 125000.50 })
  currentLifetimeValue: number;

  @ApiProperty({ example: 248500.00 })
  projectedLifetimeValue: number;

  @ApiProperty({ example: 8333.33 })
  averageMonthlyValue: number;

  @ApiProperty({ example: 15 })
  customerAgeMonths: number;

  @ApiProperty({ example: 36 })
  projectedLifetimeMonths: number;

  @ApiProperty({ example: 'High' })
  valueSegment: string;

  @ApiProperty({ example: 4.8 })
  revenueGrowthRate: number; // monthly percentage
}

export class ClientInsightsDto {
  @ApiProperty({ example: 'client-uuid-123' })
  clientId: string;

  @ApiProperty({ example: 'CLT-001' })
  clientNumber: string;

  @ApiProperty({ example: 'Acme Corporation' })
  clientName: string;

  @ApiProperty({ enum: ClientSegment })
  segment: ClientSegment;

  @ApiProperty({ type: RevenueBreakdownDto })
  revenue: RevenueBreakdownDto;

  @ApiProperty({ type: PaymentAnalyticsDto })
  payments: PaymentAnalyticsDto;

  @ApiProperty({ type: InvoiceAnalyticsDto })
  invoices: InvoiceAnalyticsDto;

  @ApiProperty({ type: ClientLifetimeValueDto })
  lifetimeValue: ClientLifetimeValueDto;

  @ApiProperty({ type: RiskAssessmentDto })
  risk: RiskAssessmentDto;

  @ApiProperty({ type: SeasonalPatternsDto })
  seasonalPatterns: SeasonalPatternsDto;

  @ApiProperty({ example: ['upsell_opportunity', 'payment_terms_negotiation'] })
  opportunities: string[];

  @ApiProperty({ example: '2024-12-03T10:00:00Z' })
  calculatedAt: Date;
}

// ============================================================================
// TOP PERFORMERS DTOs
// ============================================================================

export class TopPerformerDto {
  @ApiProperty({ example: 'client-uuid-123' })
  clientId: string;

  @ApiProperty({ example: 'CLT-001' })
  clientNumber: string;

  @ApiProperty({ example: 'Acme Corporation' })
  clientName: string;

  @ApiProperty({ example: 125000.50 })
  totalRevenue: number;

  @ApiProperty({ example: 8.5 })
  revenueContributionPercentage: number;

  @ApiProperty({ example: 15 })
  customerAgeMonths: number;

  @ApiProperty({ example: 92 })
  paymentReliabilityScore: number;

  @ApiProperty({ enum: ClientSegment })
  segment: ClientSegment;
}

export class TopPerformersDto {
  @ApiProperty({ type: [TopPerformerDto] })
  topByRevenue: TopPerformerDto[];

  @ApiProperty({ type: [TopPerformerDto] })
  topByGrowth: TopPerformerDto[];

  @ApiProperty({ type: [TopPerformerDto] })
  topByReliability: TopPerformerDto[];

  @ApiProperty({ type: [TopPerformerDto] })
  topByLifetimeValue: TopPerformerDto[];
}

// ============================================================================
// AT-RISK CLIENTS DTOs
// ============================================================================

export class AtRiskClientDto {
  @ApiProperty({ example: 'client-uuid-123' })
  clientId: string;

  @ApiProperty({ example: 'CLT-001' })
  clientNumber: string;

  @ApiProperty({ example: 'Acme Corporation' })
  clientName: string;

  @ApiProperty({ example: 65.5 })
  churnRiskScore: number;

  @ApiProperty({ enum: ChurnRiskLevel })
  churnRisk: ChurnRiskLevel;

  @ApiProperty({ example: ['No payment in 60 days', 'Invoice volume declined 40%'] })
  riskFactors: string[];

  @ApiProperty({ example: 'Contact immediately' })
  recommendedAction: string;

  @ApiProperty({ example: 65000.00 })
  totalRevenue: number;

  @ApiProperty({ example: 15000.00 })
  outstandingBalance: number;

  @ApiProperty({ example: 62 })
  daysSinceLastActivity: number;
}

export class AtRiskClientsDto {
  @ApiProperty({ type: [AtRiskClientDto] })
  criticalRisk: AtRiskClientDto[];

  @ApiProperty({ type: [AtRiskClientDto] })
  highRisk: AtRiskClientDto[];

  @ApiProperty({ type: [AtRiskClientDto] })
  mediumRisk: AtRiskClientDto[];

  @ApiProperty({ example: 15 })
  totalAtRisk: number;

  @ApiProperty({ example: 385000.00 })
  totalRevenueAtRisk: number;
}

// ============================================================================
// TRENDS DTOs
// ============================================================================

export class ClientTrendsDto {
  @ApiProperty({ example: 12.5 })
  averageRevenueGrowth: number; // percentage

  @ApiProperty({ example: 28.3 })
  averagePaymentDays: number;

  @ApiProperty({ example: 88.5 })
  averagePaymentReliability: number;

  @ApiProperty({ example: 18 })
  clientsAtRiskCount: number;

  @ApiProperty({ example: 8.5 })
  churnRate: number; // percentage

  @ApiProperty({ example: 15 })
  newClientsLast30Days: number;

  @ApiProperty({ example: 2 })
  churnedClientsLast30Days: number;

  @ApiProperty({ example: [850000, 920000, 1050000, 980000, 1120000, 1200000] })
  last6MonthsTotalRevenue: number[];

  @ApiProperty({ example: [28, 29, 27, 26, 25, 24] })
  last6MonthsAveragePaymentDays: number[];

  @ApiProperty({
    example: {
      ENTERPRISE: 15,
      MID_MARKET: 42,
      SMB: 85,
      NEW: 12
    }
  })
  clientsBySegment: Record<ClientSegment, number>;

  @ApiProperty({ example: '2024-12-03T10:00:00Z' })
  calculatedAt: Date;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

export class InsightsQueryDto {
  @ApiPropertyOptional({ enum: TimeRange, default: TimeRange.ALL_TIME })
  @IsOptional()
  timeRange?: TimeRange = 'ALL_TIME' as TimeRange;
}

export class TopPerformersQueryDto {
  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: TimeRange, default: TimeRange.ALL_TIME })
  @IsOptional()
  timeRange?: TimeRange = 'ALL_TIME' as TimeRange;
}

export class AtRiskQueryDto {
  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ChurnRiskLevel })
  @IsOptional()
  minRiskLevel?: ChurnRiskLevel;
}
