import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Analysis status enum
 */
export enum AnalysisStatus {
  PENDING = 'PENDING',
  ANALYZING_BANK = 'ANALYZING_BANK',
  ANALYZING_EMAIL = 'ANALYZING_EMAIL',
  GENERATING_INSIGHTS = 'GENERATING_INSIGHTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Bank analysis result
 */
export class BankAnalysisResultDto {
  @ApiProperty({ description: 'Number of transactions processed' })
  transactionsProcessed: number;

  @ApiProperty({ description: 'Number of transactions categorized' })
  categorized: number;

  @ApiProperty({ description: 'Number of potential tax deductions found' })
  deductionsFound: number;

  @ApiProperty({ description: 'Recurring expenses identified' })
  recurringExpenses: Array<{
    description: string;
    amount: number;
    frequency: string;
  }>;

  @ApiProperty({ description: 'Top expense categories' })
  topCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

/**
 * Email analysis result
 */
export class EmailAnalysisResultDto {
  @ApiProperty({ description: 'Number of emails scanned' })
  emailsScanned: number;

  @ApiProperty({ description: 'Number of invoices found' })
  invoicesFound: number;

  @ApiProperty({ description: 'Number of invoices matched with transactions' })
  matched: number;

  @ApiProperty({ description: 'Draft invoices/expenses created' })
  draftsCreated: Array<{
    type: 'invoice' | 'expense';
    amount: number;
    description: string;
  }>;
}

/**
 * Insights result
 */
export class InsightsResultDto {
  @ApiProperty({ description: 'Monthly spending summary' })
  monthlySpending: {
    total: number;
    currency: string;
    period: string;
  };

  @ApiProperty({ description: 'Top expense categories' })
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Upcoming payment reminders' })
  upcomingPayments: Array<{
    description: string;
    amount: number;
    dueDate: string;
  }>;

  @ApiProperty({ description: 'Tax optimization suggestions' })
  taxSuggestions: string[];

  @ApiProperty({ description: 'Cost-saving recommendations' })
  costSavings: Array<{
    category: string;
    suggestion: string;
    potentialSavings: number;
  }>;
}

/**
 * Trigger analysis request DTO
 */
export class TriggerAnalysisDto {
  @ApiProperty({ description: 'User ID to trigger analysis for' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Force re-analysis even if already completed' })
  @IsOptional()
  force?: boolean;
}

/**
 * Analysis status response DTO
 */
export class AnalysisStatusDto {
  @ApiProperty({ description: 'Analysis ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Current status', enum: AnalysisStatus })
  status: AnalysisStatus;

  @ApiPropertyOptional({ description: 'Bank analysis result' })
  @IsOptional()
  @IsObject()
  bankAnalysis?: BankAnalysisResultDto;

  @ApiPropertyOptional({ description: 'Email analysis result' })
  @IsOptional()
  @IsObject()
  emailAnalysis?: EmailAnalysisResultDto;

  @ApiPropertyOptional({ description: 'Insights result' })
  @IsOptional()
  @IsObject()
  insights?: InsightsResultDto;

  @ApiPropertyOptional({ description: 'When analysis started' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'When analysis completed' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  @IsDateString()
  updatedAt: string;
}

/**
 * Analysis results response DTO
 */
export class AnalysisResultsDto {
  @ApiProperty({ description: 'Analysis ID' })
  id: string;

  @ApiProperty({ description: 'Bank analysis results' })
  bankAnalysis: BankAnalysisResultDto;

  @ApiProperty({ description: 'Email analysis results' })
  emailAnalysis: EmailAnalysisResultDto;

  @ApiProperty({ description: 'Generated insights' })
  insights: InsightsResultDto;

  @ApiProperty({ description: 'Completion timestamp' })
  completedAt: string;
}
