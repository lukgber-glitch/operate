import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChorusProInvoiceType,
  ChorusProDocumentFormat,
} from '../types/chorus-pro.types';

/**
 * Service Reference DTO
 */
export class ServiceReferenceDto {
  @ApiProperty({
    description: 'Service code (code service destinataire)',
    example: 'SERVICE001',
  })
  @IsString()
  @IsNotEmpty()
  serviceCode: string;

  @ApiPropertyOptional({
    description: 'Service name',
    example: 'Direction des Achats',
  })
  @IsString()
  @IsOptional()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Department code',
    example: 'DEPT001',
  })
  @IsString()
  @IsOptional()
  departmentCode?: string;

  @ApiPropertyOptional({
    description: 'Budget code',
    example: 'BUD2024001',
  })
  @IsString()
  @IsOptional()
  budgetCode?: string;
}

/**
 * Engagement DTO
 */
export class EngagementDto {
  @ApiProperty({
    description: 'Engagement number (numéro d\'engagement)',
    example: 'ENG2024001234',
  })
  @IsString()
  @IsNotEmpty()
  engagementNumber: string;

  @ApiPropertyOptional({
    description: 'Engagement date',
    example: '2024-01-15',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  engagementDate?: Date;

  @ApiPropertyOptional({
    description: 'Engagement amount in euros',
    example: 5000.00,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Budget line reference',
    example: 'LIGNE001',
  })
  @IsString()
  @IsOptional()
  budgetLine?: string;
}

/**
 * Submit Invoice to Chorus Pro DTO
 */
export class SubmitInvoiceDto {
  @ApiProperty({
    description: 'Invoice number',
    example: 'FAC2024-001',
  })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Invoice date',
    example: '2024-03-15',
  })
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @ApiProperty({
    description: 'Invoice type',
    enum: ChorusProInvoiceType,
    example: ChorusProInvoiceType.FACTURE,
  })
  @IsEnum(ChorusProInvoiceType)
  invoiceType: ChorusProInvoiceType;

  @ApiProperty({
    description: 'Supplier SIRET (14 digits)',
    example: '12345678901234',
  })
  @IsString()
  @Length(14, 14)
  supplierSiret: string;

  @ApiProperty({
    description: 'Supplier name',
    example: 'ACME Corporation',
  })
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @ApiProperty({
    description: 'Recipient SIRET (14 digits) - Public entity',
    example: '98765432109876',
  })
  @IsString()
  @Length(14, 14)
  recipientSiret: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'Ministère de l\'Économie',
  })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiPropertyOptional({
    description: 'Service reference within the public entity',
    type: ServiceReferenceDto,
  })
  @ValidateNested()
  @Type(() => ServiceReferenceDto)
  @IsOptional()
  serviceReference?: ServiceReferenceDto;

  @ApiPropertyOptional({
    description: 'Financial engagement reference',
    type: EngagementDto,
  })
  @ValidateNested()
  @Type(() => EngagementDto)
  @IsOptional()
  engagement?: EngagementDto;

  @ApiProperty({
    description: 'Amount excluding tax (montant HT) in euros',
    example: 1000.00,
  })
  @IsNumber()
  @Min(0)
  amountExcludingTax: number;

  @ApiProperty({
    description: 'VAT amount (montant TVA) in euros',
    example: 200.00,
  })
  @IsNumber()
  @Min(0)
  vatAmount: number;

  @ApiProperty({
    description: 'Amount including tax (montant TTC) in euros',
    example: 1200.00,
  })
  @IsNumber()
  @Min(0)
  amountIncludingTax: number;

  @ApiProperty({
    description: 'Document format',
    enum: ChorusProDocumentFormat,
    example: ChorusProDocumentFormat.FACTURX,
  })
  @IsEnum(ChorusProDocumentFormat)
  documentFormat: ChorusProDocumentFormat;

  @ApiPropertyOptional({
    description: 'Purchase order number (numéro de bon de commande)',
    example: 'BC2024-001',
  })
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Contract reference',
    example: 'CONT2024-001',
  })
  @IsString()
  @IsOptional()
  contractReference?: string;

  @ApiPropertyOptional({
    description: 'Customer reference',
    example: 'REF-CLIENT-001',
  })
  @IsString()
  @IsOptional()
  customerReference?: string;

  @ApiPropertyOptional({
    description: 'Comments',
    example: 'Invoice for services rendered in March 2024',
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Chorus Pro structure ID (if known)',
    example: 'STRUCT-12345',
  })
  @IsString()
  @IsOptional()
  structureId?: string;

  @ApiPropertyOptional({
    description: 'Routing mode',
    enum: ['AUTO', 'MANUAL'],
    example: 'AUTO',
  })
  @IsString()
  @IsOptional()
  routingMode?: 'AUTO' | 'MANUAL';
}
