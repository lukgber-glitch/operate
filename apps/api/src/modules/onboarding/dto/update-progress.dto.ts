import { IsOptional, IsObject, IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OnboardingStepStatus } from '@prisma/client';

/**
 * DTO for updating onboarding progress
 */
export class UpdateProgressDto {
  @ApiProperty({
    description: 'Current step number',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  currentStep?: number;

  @ApiProperty({
    description: 'Step status to update',
    enum: OnboardingStepStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(OnboardingStepStatus)
  status?: OnboardingStepStatus;

  @ApiProperty({
    description: 'Step data to update',
    example: { provider: 'GOCARDLESS' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Step name to update',
    example: 'banking',
    required: false,
  })
  @IsOptional()
  @IsString()
  step?: string;
}
