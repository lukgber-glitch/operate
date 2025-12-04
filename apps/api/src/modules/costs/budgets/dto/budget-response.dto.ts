import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetPeriod, CostCategory, AlertType } from '@prisma/client';

/**
 * Budget alert response DTO
 */
export class BudgetAlertDto {
  @ApiProperty({ description: 'Alert ID' })
  id: string;

  @ApiProperty({ description: 'Budget ID' })
  budgetId: string;

  @ApiProperty({ description: 'Alert type', enum: AlertType })
  type: AlertType;

  @ApiProperty({ description: 'Threshold that triggered the alert' })
  threshold: number;

  @ApiProperty({ description: 'Current spend when alert was created' })
  currentSpend: number;

  @ApiProperty({ description: 'Alert message' })
  message: string;

  @ApiProperty({ description: 'Whether alert has been acknowledged' })
  acknowledged: boolean;

  @ApiProperty({ description: 'Alert creation timestamp' })
  createdAt: Date;
}

/**
 * Budget response DTO
 */
export class BudgetResponseDto {
  @ApiProperty({ description: 'Budget ID' })
  id: string;

  @ApiProperty({ description: 'Organisation ID' })
  orgId: string;

  @ApiProperty({ description: 'Budget name' })
  name: string;

  @ApiPropertyOptional({
    description: 'Cost category (null for all categories)',
    enum: CostCategory,
  })
  category: CostCategory | null;

  @ApiProperty({ description: 'Budget limit amount' })
  limitAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Budget period', enum: BudgetPeriod })
  period: BudgetPeriod;

  @ApiProperty({ description: 'Warning threshold (0.0-1.0)' })
  warningThreshold: number;

  @ApiProperty({ description: 'Critical threshold (0.0-1.0)' })
  criticalThreshold: number;

  @ApiProperty({ description: 'Auto-pause enabled' })
  autoPause: boolean;

  @ApiProperty({ description: 'Whether budget is currently paused' })
  isPaused: boolean;

  @ApiProperty({ description: 'Current spend in this period' })
  currentSpend: number;

  @ApiProperty({ description: 'Usage percentage (0-100)' })
  usagePercentage: number;

  @ApiProperty({ description: 'Remaining budget' })
  remainingBudget: number;

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Budget status', enum: ['OK', 'WARNING', 'CRITICAL', 'EXCEEDED', 'PAUSED'] })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Recent alerts', type: [BudgetAlertDto] })
  alerts?: BudgetAlertDto[];
}
