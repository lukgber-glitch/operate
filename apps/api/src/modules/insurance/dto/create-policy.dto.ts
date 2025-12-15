import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
  IsEmail,
  IsInt,
} from 'class-validator';
import {
  InsuranceType,
  PolicyStatus,
  PaymentFrequency,
} from '@prisma/client';

export class CreatePolicyDto {
  @ApiProperty({
    description: 'Policy name',
    example: 'Professional Liability Insurance',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Type of insurance',
    enum: InsuranceType,
    example: InsuranceType.PROFESSIONAL_INDEMNITY,
  })
  @IsEnum(InsuranceType)
  type: InsuranceType;

  @ApiProperty({
    description: 'Insurance provider name',
    example: 'Allianz',
  })
  @IsString()
  @MaxLength(255)
  provider: string;

  @ApiPropertyOptional({
    description: 'Policy number',
    example: 'POL-2024-12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string;

  @ApiPropertyOptional({
    description: 'Policy description',
    example: 'Covers professional negligence and errors',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Coverage amount',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  coverageAmount?: number;

  @ApiPropertyOptional({
    description: 'Deductible amount',
    example: 5000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  deductible?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    description: 'Premium amount per payment period',
    example: 500,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  premiumAmount: number;

  @ApiProperty({
    description: 'Premium payment frequency',
    enum: PaymentFrequency,
    example: PaymentFrequency.MONTHLY,
  })
  @IsEnum(PaymentFrequency)
  premiumFrequency: PaymentFrequency;

  @ApiProperty({
    description: 'Policy start date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Policy end date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Renewal date (ISO 8601)',
    example: '2024-11-01',
  })
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional({
    description: 'Auto-renew policy',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({
    description: 'Policy status',
    enum: PolicyStatus,
    example: PolicyStatus.ACTIVE,
    default: PolicyStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Smith',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+49 30 12345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'john.smith@allianz.com',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Days before expiry to send reminder',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  reminderDays?: number;
}
