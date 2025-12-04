import {
  IsString,
  IsEnum,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WiseCurrency, WiseRecipientType } from '../wise.types';

/**
 * Recipient Details DTO (varies by country/type)
 */
export class RecipientDetailsDto {
  @ApiProperty({
    description: 'Account holder name',
    example: 'John Doe',
  })
  @IsString()
  accountHolderName: string;

  @ApiProperty({
    description: 'Legal type',
    enum: ['PRIVATE', 'BUSINESS'],
    example: 'BUSINESS',
  })
  @IsString()
  legalType: 'PRIVATE' | 'BUSINESS';

  // IBAN (SEPA - EU)
  @ApiPropertyOptional({
    description: 'IBAN (for SEPA transfers)',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  iban?: string;

  // UK
  @ApiPropertyOptional({
    description: 'UK Sort Code',
    example: '231470',
  })
  @IsOptional()
  @IsString()
  sortCode?: string;

  @ApiPropertyOptional({
    description: 'UK Account Number',
    example: '28821822',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  // US (ACH/Wire)
  @ApiPropertyOptional({
    description: 'US ABA Routing Number',
    example: '111000025',
  })
  @IsOptional()
  @IsString()
  abartn?: string;

  @ApiPropertyOptional({
    description: 'US Account Type',
    enum: ['CHECKING', 'SAVINGS'],
  })
  @IsOptional()
  @IsString()
  accountType?: 'CHECKING' | 'SAVINGS';

  // Australia
  @ApiPropertyOptional({
    description: 'Australian BSB Code',
    example: '032000',
  })
  @IsOptional()
  @IsString()
  bsbCode?: string;

  // Canada
  @ApiPropertyOptional({
    description: 'Canadian Institution Number',
    example: '001',
  })
  @IsOptional()
  @IsString()
  institutionNumber?: string;

  @ApiPropertyOptional({
    description: 'Canadian Transit Number',
    example: '00001',
  })
  @IsOptional()
  @IsString()
  transitNumber?: string;

  // India
  @ApiPropertyOptional({
    description: 'Indian IFSC Code',
    example: 'HDFC0000001',
  })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  // Mexico
  @ApiPropertyOptional({
    description: 'Mexican CLABE',
    example: '012180001234567897',
  })
  @IsOptional()
  @IsString()
  clabe?: string;

  // SWIFT (International)
  @ApiPropertyOptional({
    description: 'SWIFT/BIC Code',
    example: 'DEUTDEFF',
  })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  // Email (Wise-to-Wise)
  @ApiPropertyOptional({
    description: 'Email (for Wise-to-Wise transfers)',
    example: 'recipient@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  // Address
  @ApiPropertyOptional({
    description: 'Recipient address',
  })
  @IsOptional()
  @IsObject()
  address?: {
    country: string;
    city: string;
    postCode: string;
    firstLine: string;
    state?: string;
  };
}

/**
 * Create Recipient DTO
 */
export class CreateRecipientDto {
  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  @IsString()
  currency: WiseCurrency;

  @ApiProperty({
    description: 'Recipient type',
    enum: WiseRecipientType,
    example: WiseRecipientType.IBAN,
  })
  @IsEnum(WiseRecipientType)
  type: WiseRecipientType;

  @ApiProperty({
    description: 'Recipient account details',
    type: RecipientDetailsDto,
  })
  @ValidateNested()
  @Type(() => RecipientDetailsDto)
  details: RecipientDetailsDto;
}
