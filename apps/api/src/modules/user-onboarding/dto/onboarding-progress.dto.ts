import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsOptional, IsDate } from 'class-validator';

/**
 * User Onboarding Progress Response DTO
 */
export class OnboardingProgressDto {
  @ApiProperty({ description: 'Progress record ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Current step ID', example: 'profile' })
  @IsString()
  currentStep!: string;

  @ApiProperty({
    description: 'Array of completed step IDs',
    type: [String],
    example: ['welcome', 'profile'],
  })
  @IsArray()
  @IsString({ each: true })
  completedSteps!: string[];

  @ApiProperty({
    description: 'Array of skipped step IDs',
    type: [String],
    example: ['team'],
  })
  @IsArray()
  @IsString({ each: true })
  skippedSteps!: string[];

  @ApiProperty({
    description: 'Step-specific data storage',
    required: false,
    example: {
      profile: { firstName: 'John', lastName: 'Doe' },
      company: { name: 'Acme Corp' },
    },
  })
  @IsOptional()
  @IsObject()
  stepData?: Record<string, any>;

  @ApiProperty({ description: 'Onboarding started timestamp' })
  @IsDate()
  startedAt!: Date;

  @ApiProperty({
    description: 'Onboarding completed timestamp',
    required: false,
  })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @ApiProperty({ description: 'Last activity timestamp' })
  @IsDate()
  lastActivityAt!: Date;

  @ApiProperty({ description: 'Record created timestamp' })
  @IsDate()
  createdAt!: Date;

  @ApiProperty({ description: 'Record updated timestamp' })
  @IsDate()
  updatedAt!: Date;

  @ApiProperty({ description: 'Whether onboarding is complete' })
  isComplete!: boolean;

  @ApiProperty({
    description: 'Completion percentage (0-100)',
    example: 75,
  })
  completionPercentage!: number;

  @ApiProperty({
    description: 'Total estimated time in minutes',
    example: 20,
  })
  totalEstimatedTime!: number;
}
