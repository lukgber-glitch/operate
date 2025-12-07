import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ExcelTemplate {
  FINANCIAL_STATEMENT = 'financial_statement',
  MULTI_SHEET_WORKBOOK = 'multi_sheet_workbook',
  TAX_REPORT = 'tax_report',
  PAYROLL_REPORT = 'payroll_report',
  INVOICE_REGISTER = 'invoice_register',
  EXPENSE_TRACKER = 'expense_tracker',
  CASH_FLOW = 'cash_flow',
  CUSTOM = 'custom',
}

export class ExcelStyleOptionsDto {
  @ApiPropertyOptional({ description: 'Header background color (hex)' })
  @IsOptional()
  @IsString()
  headerBackgroundColor?: string;

  @ApiPropertyOptional({ description: 'Header font color (hex)' })
  @IsOptional()
  @IsString()
  headerFontColor?: string;

  @ApiPropertyOptional({ description: 'Alternating row colors' })
  @IsOptional()
  @IsBoolean()
  alternatingRows?: boolean;

  @ApiPropertyOptional({ description: 'Freeze header row' })
  @IsOptional()
  @IsBoolean()
  freezeHeader?: boolean;

  @ApiPropertyOptional({ description: 'Auto-fit columns' })
  @IsOptional()
  @IsBoolean()
  autoFitColumns?: boolean;

  @ApiPropertyOptional({ description: 'Show gridlines' })
  @IsOptional()
  @IsBoolean()
  showGridlines?: boolean;

  @ApiPropertyOptional({ description: 'Enable filters' })
  @IsOptional()
  @IsBoolean()
  enableFilters?: boolean;
}

export class ExcelConditionalFormattingDto {
  @ApiProperty({ description: 'Column to apply formatting to' })
  @IsString()
  column: string;

  @ApiProperty({
    description: 'Rule type',
    enum: ['dataBar', 'colorScale', 'iconSet', 'cellIs'],
  })
  @IsString()
  ruleType: string;

  @ApiPropertyOptional({ description: 'Rule configuration', type: 'object' })
  @IsOptional()
  @IsObject()
  config?: any;
}

export class ExcelDataValidationDto {
  @ApiProperty({ description: 'Column to apply validation to' })
  @IsString()
  column: string;

  @ApiProperty({
    description: 'Validation type',
    enum: ['list', 'whole', 'decimal', 'date', 'time', 'textLength', 'custom'],
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Validation values or formula' })
  @IsOptional()
  values?: any;

  @ApiPropertyOptional({ description: 'Error message' })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class ExcelFormulaDto {
  @ApiProperty({ description: 'Cell reference (e.g., "A1")' })
  @IsString()
  cell: string;

  @ApiProperty({ description: 'Formula (without = sign)' })
  @IsString()
  formula: string;
}

export class ExcelChartConfigDto {
  @ApiProperty({ description: 'Chart type', enum: ['line', 'bar', 'pie', 'scatter', 'area'] })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Chart title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Data range' })
  @IsOptional()
  @IsString()
  dataRange?: string;

  @ApiPropertyOptional({ description: 'Position (top-left cell)' })
  @IsOptional()
  @IsString()
  position?: string;
}

export class ExportExcelDto {
  @ApiProperty({
    description: 'Report data to export',
    type: 'object',
  })
  @IsObject()
  reportData: any;

  @ApiProperty({
    description: 'Excel template to use',
    enum: ExcelTemplate,
  })
  template: ExcelTemplate;

  @ApiPropertyOptional({
    description: 'Workbook name',
  })
  @IsOptional()
  @IsString()
  workbookName?: string;

  @ApiPropertyOptional({
    description: 'Include summary sheet',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSummarySheet?: boolean;

  @ApiPropertyOptional({
    description: 'Include pivot tables',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includePivotTables?: boolean;

  @ApiPropertyOptional({
    description: 'Include charts',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({
    description: 'Chart configurations',
    type: [ExcelChartConfigDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelChartConfigDto)
  chartConfigs?: ExcelChartConfigDto[];

  @ApiPropertyOptional({
    description: 'Style options',
    type: ExcelStyleOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExcelStyleOptionsDto)
  styleOptions?: ExcelStyleOptionsDto;

  @ApiPropertyOptional({
    description: 'Enable formulas',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableFormulas?: boolean;

  @ApiPropertyOptional({
    description: 'Custom formulas to add',
    type: [ExcelFormulaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelFormulaDto)
  formulas?: ExcelFormulaDto[];

  @ApiPropertyOptional({
    description: 'Conditional formatting rules',
    type: [ExcelConditionalFormattingDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelConditionalFormattingDto)
  conditionalFormatting?: ExcelConditionalFormattingDto[];

  @ApiPropertyOptional({
    description: 'Data validation rules',
    type: [ExcelDataValidationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelDataValidationDto)
  dataValidation?: ExcelDataValidationDto[];

  @ApiPropertyOptional({
    description: 'Protect sheets with password',
  })
  @IsOptional()
  @IsString()
  sheetPassword?: string;

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
    description: 'Currency code (EUR, USD, etc.)',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

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
