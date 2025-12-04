import { IsString, IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceTypeDto {
  TAX_INVOICE = 'TAX_INVOICE',
  SIMPLIFIED_INVOICE = 'SIMPLIFIED_INVOICE',
}

export class SignInvoiceDto {
  @ApiProperty({
    description: 'Internal invoice ID',
    example: 'INV-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'INV-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Invoice type',
    enum: InvoiceTypeDto,
  })
  @IsEnum(InvoiceTypeDto)
  invoiceType: InvoiceTypeDto;

  @ApiProperty({
    description: 'Invoice data to be signed (base64 encoded XML or JSON)',
    example: 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4...',
  })
  @IsString()
  @IsNotEmpty()
  invoiceData: string;

  @ApiPropertyOptional({
    description: 'Pre-computed invoice hash (SHA-256)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsOptional()
  invoiceHash?: string;

  @ApiPropertyOptional({
    description: 'Submit to ZATCA after signing',
    default: false,
  })
  @IsOptional()
  submitToZatca?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
