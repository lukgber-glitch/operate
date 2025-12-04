import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

/**
 * Complete Step Request DTO
 */
export class CompleteStepDto {
  @ApiProperty({
    description: 'Step ID to complete',
    example: 'profile',
  })
  @IsString()
  stepId: string;

  @ApiProperty({
    description: 'Optional step-specific data to store',
    required: false,
    example: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
    },
  })
  @IsOptional()
  @IsObject()
  stepData?: Record<string, any>;
}

/**
 * Skip Step Request DTO
 */
export class SkipStepDto {
  @ApiProperty({
    description: 'Step ID to skip',
    example: 'team',
  })
  @IsString()
  stepId: string;
}

/**
 * Go To Step Request DTO
 */
export class GoToStepDto {
  @ApiProperty({
    description: 'Step ID to navigate to',
    example: 'preferences',
  })
  @IsString()
  stepId: string;
}
