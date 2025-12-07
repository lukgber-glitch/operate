import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OnboardingStepStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export class UpdateOnboardingStepDto {
  @ApiProperty({
    description: 'Step name to update',
    example: 'banking',
    enum: [
      'companyInfo',
      'banking',
      'email',
      'tax',
      'accounting',
      'preferences',
    ],
  })
  @IsString()
  step:
    | 'companyInfo'
    | 'banking'
    | 'email'
    | 'tax'
    | 'accounting'
    | 'preferences';

  @ApiProperty({
    enum: OnboardingStepStatus,
    description: 'New status for the step',
    example: 'COMPLETED',
  })
  status: OnboardingStepStatus;

  @ApiPropertyOptional({
    description: 'Provider used for this step (if applicable)',
    example: 'GOCARDLESS',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: 'Step-specific data',
    example: { accountsConnected: 2 },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class SkipOnboardingStepDto {
  @ApiProperty({
    description: 'Step name to skip',
    example: 'accounting',
    enum: [
      'companyInfo',
      'banking',
      'email',
      'tax',
      'accounting',
      'preferences',
    ],
  })
  @IsString()
  step:
    | 'companyInfo'
    | 'banking'
    | 'email'
    | 'tax'
    | 'accounting'
    | 'preferences';

  @ApiPropertyOptional({
    description: 'Reason for skipping',
    example: 'Will set up later',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SetCurrentStepDto {
  @ApiProperty({
    description: 'Current step number (1-6)',
    example: 2,
    minimum: 1,
    maximum: 6,
  })
  @IsNumber()
  @Min(1)
  @Max(6)
  currentStep: number;
}

export class OnboardingProgressResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: OnboardingStepStatus })
  companyInfoStatus: OnboardingStepStatus;

  @ApiPropertyOptional()
  companyInfoData?: Record<string, any>;

  @ApiProperty({ enum: OnboardingStepStatus })
  bankingStatus: OnboardingStepStatus;

  @ApiPropertyOptional()
  bankingProvider?: string;

  @ApiPropertyOptional()
  bankingData?: Record<string, any>;

  @ApiProperty({ enum: OnboardingStepStatus })
  emailStatus: OnboardingStepStatus;

  @ApiPropertyOptional()
  emailProvider?: string;

  @ApiPropertyOptional()
  emailData?: Record<string, any>;

  @ApiProperty({ enum: OnboardingStepStatus })
  taxStatus: OnboardingStepStatus;

  @ApiPropertyOptional()
  taxData?: Record<string, any>;

  @ApiProperty({ enum: OnboardingStepStatus })
  accountingStatus: OnboardingStepStatus;

  @ApiPropertyOptional()
  accountingProvider?: string;

  @ApiPropertyOptional()
  accountingData?: Record<string, any>;

  @ApiProperty({ enum: OnboardingStepStatus })
  preferencesStatus: OnboardingStepStatus;

  @ApiPropertyOptional()
  preferencesData?: Record<string, any>;

  @ApiProperty()
  currentStep: number;

  @ApiProperty()
  totalSteps: number;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty({ type: [String] })
  skippedSteps: string[];

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
