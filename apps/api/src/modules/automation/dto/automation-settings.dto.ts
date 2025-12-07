import { IsEnum, IsNumber, IsOptional, Min, Max, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AutomationMode } from '@prisma/client';

/**
 * Get Automation Settings Response DTO
 */
export class AutomationSettingsResponseDto {
  @ApiProperty({
    description: 'Settings ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Organisation ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  organisationId: string;

  @ApiProperty({
    description: 'Invoice creation automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
  })
  invoiceCreation: AutomationMode;

  @ApiProperty({
    description: 'Expense approval automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
  })
  expenseApproval: AutomationMode;

  @ApiProperty({
    description: 'Bank reconciliation automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
  })
  bankReconciliation: AutomationMode;

  @ApiProperty({
    description: 'Tax classification automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
  })
  taxClassification: AutomationMode;

  @ApiProperty({
    description: 'Payment reminders automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
  })
  paymentReminders: AutomationMode;

  @ApiProperty({
    description: 'Invoice confidence threshold (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  invoiceConfidenceThreshold: number;

  @ApiProperty({
    description: 'Expense confidence threshold (0-100)',
    example: 80,
    minimum: 0,
    maximum: 100,
  })
  expenseConfidenceThreshold: number;

  @ApiProperty({
    description: 'Tax confidence threshold (0-100)',
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  taxConfidenceThreshold: number;

  @ApiProperty({
    description: 'Maximum auto-approve amount (in cents, null = no limit)',
    example: 100000,
    nullable: true,
  })
  maxAutoApproveAmount: number | null;

  @ApiProperty({
    description: 'Created at',
    example: '2025-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2025-01-01T12:00:00Z',
  })
  updatedAt: Date;
}

/**
 * Update Automation Settings DTO
 */
export class UpdateAutomationSettingsDto {
  @ApiProperty({
    description: 'Invoice creation automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  invoiceCreation?: AutomationMode;

  @ApiProperty({
    description: 'Expense approval automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  expenseApproval?: AutomationMode;

  @ApiProperty({
    description: 'Bank reconciliation automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  bankReconciliation?: AutomationMode;

  @ApiProperty({
    description: 'Tax classification automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  taxClassification?: AutomationMode;

  @ApiProperty({
    description: 'Payment reminders automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  paymentReminders?: AutomationMode;

  @ApiProperty({
    description: 'Invoice confidence threshold (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  invoiceConfidenceThreshold?: number;

  @ApiProperty({
    description: 'Expense confidence threshold (0-100)',
    example: 80,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  expenseConfidenceThreshold?: number;

  @ApiProperty({
    description: 'Tax confidence threshold (0-100)',
    example: 90,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  taxConfidenceThreshold?: number;

  @ApiProperty({
    description: 'Maximum auto-approve amount (in cents, null = no limit)',
    example: 100000,
    nullable: true,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxAutoApproveAmount?: number | null;
}

/**
 * Feature Mode DTO - for getting/setting mode for specific feature
 */
export class FeatureModeDto {
  @ApiProperty({
    description: 'Automation mode for the feature',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
  })
  mode: AutomationMode;

  @ApiProperty({
    description: 'Confidence threshold for this feature (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  confidenceThreshold: number;
}

/**
 * Update Feature Mode DTO
 */
export class UpdateFeatureModeDto {
  @ApiProperty({
    description: 'Automation mode for the feature',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  mode?: AutomationMode;

  @ApiProperty({
    description: 'Confidence threshold for this feature (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  confidenceThreshold?: number;
}
