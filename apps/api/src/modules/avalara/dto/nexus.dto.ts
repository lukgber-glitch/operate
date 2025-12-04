import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsBoolean,
  Length,
  Min,
} from 'class-validator';
import { NexusStatus } from '@prisma/client';

/**
 * DTO for creating a new state nexus registration
 */
export class CreateNexusDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Two-letter state code',
    example: 'CA',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @Length(2, 2)
  state: string;

  @ApiPropertyOptional({
    description: 'Date when nexus becomes effective',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Type of nexus (physical, economic, marketplace, etc.)',
    example: 'economic',
  })
  @IsOptional()
  @IsString()
  nexusTypeId?: string;

  @ApiPropertyOptional({
    description: 'Whether company has local nexus in specific jurisdictions',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasLocalNexus?: boolean;

  @ApiPropertyOptional({
    description: 'State tax registration ID',
    example: 'ST-123456789',
  })
  @IsOptional()
  @IsString()
  taxRegistrationId?: string;

  @ApiPropertyOptional({
    description: 'Sales threshold for economic nexus (USD)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesThreshold?: number;

  @ApiPropertyOptional({
    description: 'Transaction count threshold for economic nexus',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transactionThreshold?: number;
}

/**
 * DTO for updating an existing nexus registration
 */
export class UpdateNexusDto {
  @ApiPropertyOptional({
    description: 'Date when nexus ends (for deactivation)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Nexus status',
    enum: NexusStatus,
    example: NexusStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(NexusStatus)
  status?: NexusStatus;

  @ApiPropertyOptional({
    description: 'Type of nexus',
    example: 'economic',
  })
  @IsOptional()
  @IsString()
  nexusTypeId?: string;

  @ApiPropertyOptional({
    description: 'Whether company has local nexus',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasLocalNexus?: boolean;

  @ApiPropertyOptional({
    description: 'State tax registration ID',
    example: 'ST-123456789',
  })
  @IsOptional()
  @IsString()
  taxRegistrationId?: string;

  @ApiPropertyOptional({
    description: 'Sales threshold for economic nexus (USD)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesThreshold?: number;

  @ApiPropertyOptional({
    description: 'Transaction count threshold for economic nexus',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transactionThreshold?: number;
}

/**
 * Response DTO for nexus configuration
 */
export class NexusResponseDto {
  @ApiProperty({
    description: 'Nexus ID',
    example: 'nexus_123',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123',
  })
  orgId: string;

  @ApiProperty({
    description: 'Two-letter state code',
    example: 'CA',
  })
  state: string;

  @ApiProperty({
    description: 'State name',
    example: 'California',
  })
  stateName: string;

  @ApiProperty({
    description: 'Effective date',
    example: '2024-01-01T00:00:00Z',
  })
  effectiveDate: Date;

  @ApiPropertyOptional({
    description: 'End date (if deactivated)',
    example: '2024-12-31T00:00:00Z',
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Nexus status',
    enum: NexusStatus,
    example: NexusStatus.ACTIVE,
  })
  status: NexusStatus;

  @ApiPropertyOptional({
    description: 'Type of nexus',
    example: 'economic',
  })
  nexusTypeId?: string;

  @ApiPropertyOptional({
    description: 'Whether company has local nexus',
    example: false,
  })
  hasLocalNexus?: boolean;

  @ApiPropertyOptional({
    description: 'State tax registration ID',
    example: 'ST-123456789',
  })
  taxRegistrationId?: string;

  @ApiPropertyOptional({
    description: 'Sales threshold for economic nexus (USD)',
    example: 100000,
  })
  salesThreshold?: number;

  @ApiPropertyOptional({
    description: 'Transaction count threshold for economic nexus',
    example: 200,
  })
  transactionThreshold?: number;

  @ApiProperty({
    description: 'Current year-to-date sales',
    example: 75000,
  })
  currentSales: number;

  @ApiProperty({
    description: 'Current year-to-date transaction count',
    example: 150,
  })
  currentTransactions: number;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T00:00:00Z',
  })
  updatedAt: Date;
}

/**
 * Response DTO for state threshold information
 */
export class StateThresholdDto {
  @ApiProperty({
    description: 'Two-letter state code',
    example: 'CA',
  })
  state: string;

  @ApiProperty({
    description: 'State name',
    example: 'California',
  })
  stateName: string;

  @ApiPropertyOptional({
    description: 'Sales threshold (USD)',
    example: 500000,
  })
  salesThreshold?: number;

  @ApiPropertyOptional({
    description: 'Transaction count threshold',
    example: 200,
  })
  transactionThreshold?: number;

  @ApiProperty({
    description: 'Threshold operator (OR or AND)',
    example: 'OR',
  })
  operator: 'OR' | 'AND';

  @ApiProperty({
    description: 'Effective date of the law',
    example: '2019-04-01',
  })
  effectiveDate: string;

  @ApiProperty({
    description: 'Whether state has sales tax holidays',
    example: false,
  })
  isTaxHoliday: boolean;

  @ApiProperty({
    description: 'Whether state uses origin-based tax sourcing',
    example: false,
  })
  isOriginBased: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Higher threshold than most states',
  })
  notes?: string;
}

/**
 * Response DTO for threshold alert
 */
export class NexusAlertDto {
  @ApiProperty({
    description: 'Nexus ID',
    example: 'nexus_123',
  })
  nexusId: string;

  @ApiProperty({
    description: 'Two-letter state code',
    example: 'CA',
  })
  state: string;

  @ApiProperty({
    description: 'State name',
    example: 'California',
  })
  stateName: string;

  @ApiProperty({
    description: 'Alert severity',
    enum: ['WARNING', 'CRITICAL'],
    example: 'WARNING',
  })
  severity: 'WARNING' | 'CRITICAL';

  @ApiProperty({
    description: 'Alert message',
    example: 'Approaching economic nexus threshold in California (80%)',
  })
  message: string;

  @ApiProperty({
    description: 'Current year-to-date sales',
    example: 400000,
  })
  currentSales: number;

  @ApiPropertyOptional({
    description: 'Sales threshold',
    example: 500000,
  })
  salesThreshold?: number;

  @ApiPropertyOptional({
    description: 'Percentage of sales threshold reached',
    example: 0.8,
  })
  salesPercent?: number;

  @ApiProperty({
    description: 'Current year-to-date transactions',
    example: 160,
  })
  currentTransactions: number;

  @ApiPropertyOptional({
    description: 'Transaction count threshold',
    example: 200,
  })
  transactionThreshold?: number;

  @ApiPropertyOptional({
    description: 'Percentage of transaction threshold reached',
    example: 0.8,
  })
  transactionsPercent?: number;

  @ApiProperty({
    description: 'Whether registration is recommended',
    example: true,
  })
  registrationRecommended: boolean;
}
