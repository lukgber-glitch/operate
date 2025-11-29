import { IsNotEmpty, IsString, IsArray, IsOptional, IsBoolean, IsDate, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, ExportFormat } from '../interfaces/gobd-config.interface';

/**
 * Date range DTO
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date (inclusive)',
    example: '2024-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({
    description: 'End date (inclusive)',
    example: '2024-12-31',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

/**
 * Export metadata DTO
 */
export class ExportMetadataDto {
  @ApiPropertyOptional({
    description: 'Auditor name',
    example: 'Finanzamt München',
  })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiPropertyOptional({
    description: 'Audit reference number',
    example: 'FA-2024-12345',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Custom notes',
    example: 'Betriebsprüfung 2024',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Create GoBD Export DTO
 * Request body for creating a new GoBD export
 */
export class CreateGobdExportDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  orgId!: string;

  @ApiProperty({
    description: 'Date range for the export',
    type: DateRangeDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange!: DateRangeDto;

  @ApiProperty({
    description: 'Document types to include in the export',
    enum: DocumentType,
    isArray: true,
    example: [DocumentType.INVOICES, DocumentType.RECEIPTS],
  })
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  documentTypes!: DocumentType[];

  @ApiPropertyOptional({
    description: 'Export format (default: CSV with semicolon)',
    enum: ExportFormat,
    example: ExportFormat.CSV_SEMICOLON,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @ApiPropertyOptional({
    description: 'Include source documents (PDFs, etc.)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeDocuments?: boolean;

  @ApiPropertyOptional({
    description: 'Include digital signature',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSignature?: boolean;

  @ApiPropertyOptional({
    description: 'Incremental export (only changes since last export)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  incremental?: boolean;

  @ApiPropertyOptional({
    description: 'Last export date (for incremental exports)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastExportDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata for the export',
    type: ExportMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportMetadataDto)
  metadata?: ExportMetadataDto;
}
