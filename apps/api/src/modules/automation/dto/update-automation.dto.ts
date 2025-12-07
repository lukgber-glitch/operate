import { IsEnum, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Automation modes
 */
export enum AutomationMode {
  FULL_AUTO = 'FULL_AUTO',
  SEMI_AUTO = 'SEMI_AUTO',
  MANUAL = 'MANUAL',
}

/**
 * Update Automation Settings DTO
 */
export class UpdateAutomationDto {
  @ApiProperty({
    description: 'Automation mode',
    enum: AutomationMode,
    example: 'SEMI_AUTO',
    required: false,
  })
  @IsOptional()
  mode?: AutomationMode;

  @ApiProperty({
    description: 'Minimum confidence threshold for auto-approval (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  confidenceThreshold?: number;

  @ApiProperty({
    description: 'Maximum amount threshold for auto-approval (in cents)',
    example: 50000,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amountThreshold?: number;

  @ApiProperty({
    description: 'Enable or disable automation for this feature',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
