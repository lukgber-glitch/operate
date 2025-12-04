import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { GoCardlessMandateScheme } from '../gocardless.types';

export class CreateMandateFlowDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'cus_123',
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Direct Debit scheme',
    enum: GoCardlessMandateScheme,
    example: GoCardlessMandateScheme.BACS,
  })
  @IsEnum(GoCardlessMandateScheme)
  scheme: GoCardlessMandateScheme;

  @ApiProperty({
    description: 'Success redirect URL',
    example: 'https://app.example.com/integrations/gocardless/success',
  })
  @IsUrl()
  successRedirectUrl: string;

  @ApiProperty({
    description: 'Mandate description',
    example: 'Monthly subscription payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
