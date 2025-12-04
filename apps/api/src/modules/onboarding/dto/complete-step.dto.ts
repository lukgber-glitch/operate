import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for completing an onboarding step
 */
export class CompleteStepDto {
  @ApiProperty({
    description: 'Step name to complete',
    enum: [
      'company_info',
      'banking',
      'email',
      'tax',
      'accounting',
      'preferences',
    ],
    example: 'company_info',
  })
  @IsString()
  @IsNotEmpty()
  step: string;

  @ApiProperty({
    description: 'Data payload for the step',
    example: {
      name: 'ACME Corp',
      taxId: 'DE123456789',
      address: { street: 'Main St 1', city: 'Berlin', postalCode: '10115' },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
