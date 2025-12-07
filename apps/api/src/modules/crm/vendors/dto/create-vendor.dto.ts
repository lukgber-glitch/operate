import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus, TaxIdType } from '@prisma/client';

/**
 * DTO for creating a new vendor
 */
export class CreateVendorDto {
  @ApiProperty({
    description: 'Vendor name',
    example: 'Office Supplies Inc.',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Display name (if different from legal name)',
    example: 'Office Supplies',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'billing@officesupplies.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone',
    example: '+49 30 12345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://www.officesupplies.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Suite 100',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Berlin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province/Region',
    example: 'Berlin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '10115',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country (ISO 3166-1 alpha-2)',
    example: 'DE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: 'DE123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string;

  @ApiPropertyOptional({
    enum: TaxIdType,
    description: 'Type of tax ID',
    default: 'OTHER',
  })
  @IsOptional()
  taxIdType?: TaxIdType;

  @ApiPropertyOptional({
    description: 'Payment terms in days',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional({
    description: 'Preferred payment method',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredPaymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Bank account holder name',
    example: 'Office Supplies Inc.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankAccountName?: string;

  @ApiPropertyOptional({
    description: 'Bank IBAN',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankIban?: string;

  @ApiPropertyOptional({
    description: 'Bank BIC/SWIFT code',
    example: 'COBADEFFXXX',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankBic?: string;

  @ApiPropertyOptional({
    description: 'Default category ID for auto-categorization',
  })
  @IsOptional()
  @IsString()
  defaultCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Default tax deductible flag for expenses',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  defaultTaxDeductible?: boolean;

  @ApiPropertyOptional({
    enum: VendorStatus,
    description: 'Vendor status',
    default: 'ACTIVE',
  })
  @IsOptional()
  status?: VendorStatus;

  @ApiPropertyOptional({
    description: 'Internal notes about the vendor',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
