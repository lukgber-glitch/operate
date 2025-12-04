import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Matches,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ZatcaCertificateTypeDto {
  COMPLIANCE = 'COMPLIANCE',
  PRODUCTION = 'PRODUCTION',
}

export enum ZatcaInvoiceTypeDto {
  TAX_INVOICE = 'TAX_INVOICE',
  SIMPLIFIED_INVOICE = 'SIMPLIFIED_INVOICE',
}

export class CreateZatcaCertificateDto {
  @ApiProperty({
    description: 'User-friendly name for the certificate',
    example: 'Production CSID - Main Branch',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'ZATCA certificate for main branch e-invoicing',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Certificate type',
    enum: ZatcaCertificateTypeDto,
    example: ZatcaCertificateTypeDto.COMPLIANCE,
  })
  @IsEnum(ZatcaCertificateTypeDto)
  certificateType: ZatcaCertificateTypeDto;

  @ApiProperty({
    description: 'Invoice type this certificate will be used for',
    enum: ZatcaInvoiceTypeDto,
    example: ZatcaInvoiceTypeDto.TAX_INVOICE,
  })
  @IsEnum(ZatcaInvoiceTypeDto)
  invoiceType: ZatcaInvoiceTypeDto;

  @ApiProperty({
    description: 'Common Name (company name)',
    example: 'ABC Trading Company',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  commonName: string;

  @ApiProperty({
    description: 'Organization Name',
    example: 'ABC Trading Company LLC',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  organizationName: string;

  @ApiProperty({
    description: 'Tax Registration Number (TRN) - 15 digits',
    example: '300000000000003',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{15}$/, {
    message: 'Tax Registration Number must be exactly 15 digits',
  })
  organizationUnit: string;

  @ApiPropertyOptional({
    description: 'Solution/Software name',
    example: 'Operate ERP',
  })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  solutionName?: string;

  @ApiPropertyOptional({
    description: 'Registered business address',
    example: 'King Fahd Road, Riyadh, Saudi Arabia',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  registeredAddress?: string;

  @ApiPropertyOptional({
    description: 'Business category',
    example: 'Wholesale Trade',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessCategory?: string;

  @ApiPropertyOptional({
    description: 'One-Time Password from ZATCA portal (required for production)',
    example: '123456',
  })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiPropertyOptional({
    description: 'Environment (sandbox or production)',
    example: 'sandbox',
    default: 'sandbox',
  })
  @IsString()
  @IsOptional()
  environment?: 'sandbox' | 'production';

  @ApiPropertyOptional({
    description: 'Auto-activate certificate after CSID approval',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoActivate?: boolean;
}
