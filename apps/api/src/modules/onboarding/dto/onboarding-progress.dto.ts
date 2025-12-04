import { ApiProperty } from '@nestjs/swagger';
import { OnboardingStepStatus } from '@prisma/client';

/**
 * Step progress details
 */
export class StepProgressDto {
  @ApiProperty({ description: 'Step name' })
  name: string;

  @ApiProperty({ enum: OnboardingStepStatus, description: 'Step status' })
  status: OnboardingStepStatus;

  @ApiProperty({ description: 'Step data', required: false })
  data?: Record<string, any>;
}

/**
 * Response DTO for onboarding progress
 */
export class OnboardingProgressDto {
  @ApiProperty({ description: 'Onboarding progress ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  orgId: string;

  @ApiProperty({ description: 'User ID who started onboarding' })
  userId: string;

  @ApiProperty({ description: 'Current step number' })
  currentStep: number;

  @ApiProperty({ description: 'Total number of steps' })
  totalSteps: number;

  @ApiProperty({ description: 'Overall completion percentage' })
  completionPercentage: number;

  @ApiProperty({ description: 'Whether onboarding is completed' })
  isCompleted: boolean;

  @ApiProperty({ description: 'Completed steps count' })
  completedStepsCount: number;

  @ApiProperty({ description: 'Skipped steps' })
  skippedSteps: string[];

  @ApiProperty({ type: [StepProgressDto], description: 'Individual step progress' })
  steps: StepProgressDto[];

  @ApiProperty({ description: 'When onboarding started' })
  startedAt: Date;

  @ApiProperty({ description: 'Last update time' })
  updatedAt: Date;

  @ApiProperty({ description: 'When onboarding was completed', required: false })
  completedAt?: Date;
}
