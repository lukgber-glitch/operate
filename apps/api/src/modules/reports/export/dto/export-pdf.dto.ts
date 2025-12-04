import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PdfPageSize {
  A4 = 'A4',
  LETTER = 'LETTER',
  LEGAL = 'LEGAL',
  A3 = 'A3',
}

export enum PdfOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export enum PdfTemplate {
  PL_STATEMENT = 'pl_statement',
  CASH_FLOW = 'cash_flow',
  TAX_SUMMARY = 'tax_summary',
  BALANCE_SHEET = 'balance_sheet',
  INVOICE_REPORT = 'invoice_report',
  EXPENSE_REPORT = 'expense_report',
  EXECUTIVE_DASHBOARD = 'executive_dashboard',
  PAYROLL_SUMMARY = 'payroll_summary',
  CUSTOM = 'custom',
}

export class PdfStyleOptionsDto {
  @ApiPropertyOptional({ description: 'Primary brand color (hex)' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color (hex)' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Header background color (hex)' })
  @IsOptional()
  @IsString()
  headerBackgroundColor?: string;

  @ApiPropertyOptional({ description: 'Font family' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ description: 'Base font size' })
  @IsOptional()
  @IsNumber()
  baseFontSize?: number;

  @ApiPropertyOptional({ description: 'Show page numbers' })
  @IsOptional()
  @IsBoolean()
  showPageNumbers?: boolean;

  @ApiPropertyOptional({ description: 'Show header on every page' })
  @IsOptional()
  @IsBoolean()
  showHeaderOnEveryPage?: boolean;

  @ApiPropertyOptional({ description: 'Show footer on every page' })
  @IsOptional()
  @IsBoolean()
  showFooterOnEveryPage?: boolean;
}

export class PdfWatermarkDto {
  @ApiProperty({ description: 'Watermark text' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Watermark opacity (0-1)', default: 0.1 })
  @IsOptional()
  @IsNumber()
  opacity?: number;

  @ApiPropertyOptional({ description: 'Watermark angle in degrees', default: 45 })
  @IsOptional()
  @IsNumber()
  angle?: number;

  @ApiPropertyOptional({ description: 'Watermark font size', default: 60 })
  @IsOptional()
  @IsNumber()
  fontSize?: number;
}

export class PdfDigitalSignatureDto {
  @ApiProperty({ description: 'Certificate path or content' })
  @IsString()
  certificate: string;

  @ApiPropertyOptional({ description: 'Certificate password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Signer name' })
  @IsString()
  signerName: string;

  @ApiPropertyOptional({ description: 'Signing reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Signing location' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class ExportPdfDto {
  @ApiProperty({
    description: 'Report data to export',
    type: 'object',
  })
  @IsObject()
  reportData: any;

  @ApiProperty({
    description: 'PDF template to use',
    enum: PdfTemplate,
  })
  @IsEnum(PdfTemplate)
  template: PdfTemplate;

  @ApiPropertyOptional({
    description: 'Report title override',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Page size',
    enum: PdfPageSize,
    default: PdfPageSize.A4,
  })
  @IsOptional()
  @IsEnum(PdfPageSize)
  pageSize?: PdfPageSize;

  @ApiPropertyOptional({
    description: 'Page orientation',
    enum: PdfOrientation,
    default: PdfOrientation.PORTRAIT,
  })
  @IsOptional()
  @IsEnum(PdfOrientation)
  orientation?: PdfOrientation;

  @ApiPropertyOptional({
    description: 'Style options',
    type: PdfStyleOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PdfStyleOptionsDto)
  styleOptions?: PdfStyleOptionsDto;

  @ApiPropertyOptional({
    description: 'Include table of contents',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeToc?: boolean;

  @ApiPropertyOptional({
    description: 'Include executive summary',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeExecutiveSummary?: boolean;

  @ApiPropertyOptional({
    description: 'Include charts',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({
    description: 'Watermark configuration',
    type: PdfWatermarkDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PdfWatermarkDto)
  watermark?: PdfWatermarkDto;

  @ApiPropertyOptional({
    description: 'Digital signature configuration',
    type: PdfDigitalSignatureDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PdfDigitalSignatureDto)
  digitalSignature?: PdfDigitalSignatureDto;

  @ApiPropertyOptional({
    description: 'Language for report (de, en)',
    default: 'de',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Timezone for dates',
    default: 'Europe/Berlin',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'PDF/A compliance',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  pdfACompliance?: boolean;

  @ApiPropertyOptional({
    description: 'Company logo URL or path',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Send report via email after generation',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Email addresses to send to (if sendEmail is true)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailRecipients?: string[];
}
