import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TaxReportService } from './tax-report.service';
import {
  GenerateTaxSummaryDto,
  GenerateVatReportDto,
  GenerateIncomeTaxReportDto,
  TaxExportDto,
  TaxSummaryResponse,
  VatReportResponse,
  IncomeTaxReportResponse,
  DeductionsAnalysisResponse,
  TaxExportResponse,
  TaxReportCountry,
  TaxExportFormat,
} from './dto/tax-report.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tax Reports')
@ApiBearerAuth()
@Controller('reports/tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxReportController {
  private readonly logger = new Logger(TaxReportController.name);

  constructor(private readonly taxReportService: TaxReportService) {}

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate comprehensive tax summary',
    description:
      'Generates a comprehensive tax summary report including income tax, VAT, trade tax, quarterly estimates, and upcoming deadlines for a given tax year.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax summary generated successfully',
    type: TaxSummaryResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid parameters',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  @ApiQuery({
    name: 'country',
    required: false,
    enum: TaxReportCountry,
    description: 'Tax jurisdiction (defaults to DE)',
  })
  @ApiQuery({
    name: 'includeDeductions',
    required: false,
    type: Boolean,
    description: 'Include detailed deductions breakdown',
  })
  @ApiQuery({
    name: 'includeVat',
    required: false,
    type: Boolean,
    description: 'Include VAT report',
  })
  @ApiQuery({
    name: 'includeAuditTrail',
    required: false,
    type: Boolean,
    description: 'Include audit trail',
  })
  async getTaxSummary(
    @Query('organizationId') organizationId: string,
    @Query('taxYear', ParseIntPipe) taxYear: number,
    @Query('country') country?: TaxReportCountry,
    @Query('includeDeductions') includeDeductions?: boolean,
    @Query('includeVat') includeVat?: boolean,
    @Query('includeAuditTrail') includeAuditTrail?: boolean,
  ): Promise<TaxSummaryResponse> {
    this.logger.log(`GET /reports/tax/summary - org: ${organizationId}, year: ${taxYear}`);

    const dto: GenerateTaxSummaryDto = {
      organizationId,
      taxYear,
      country,
      includeDeductions: includeDeductions !== undefined ? includeDeductions : true,
      includeVat: includeVat !== undefined ? includeVat : true,
      includeAuditTrail: includeAuditTrail !== undefined ? includeAuditTrail : false,
    };

    return this.taxReportService.generateTaxSummary(dto);
  }

  @Get('vat')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate VAT report',
    description:
      'Generates a detailed VAT (Umsatzsteuer) report for a specified period, including output tax, input tax, net position, and intra-EU transactions.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'VAT report generated successfully',
    type: VatReportResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Period start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Period end date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'country', required: true, enum: TaxReportCountry })
  @ApiQuery({
    name: 'includeIntraEu',
    required: false,
    type: Boolean,
    description: 'Include intra-EU transactions',
  })
  async getVatReport(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('country') country: TaxReportCountry,
    @Query('includeIntraEu') includeIntraEu?: boolean,
  ): Promise<VatReportResponse> {
    this.logger.log(
      `GET /reports/tax/vat - org: ${organizationId}, period: ${startDate} to ${endDate}`,
    );

    const dto: GenerateVatReportDto = {
      organizationId,
      startDate,
      endDate,
      country,
      includeIntraEu: includeIntraEu !== undefined ? includeIntraEu : true,
    };

    return this.taxReportService.generateVatReport(dto);
  }

  @Get('income')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Generate income tax report',
    description:
      'Generates an income tax (Einkommensteuer) report including gross revenue, deductions, taxable income, tax liability, and quarterly estimates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Income tax report generated successfully',
    type: IncomeTaxReportResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  @ApiQuery({ name: 'country', required: true, enum: TaxReportCountry })
  @ApiQuery({
    name: 'includeQuarterlyEstimates',
    required: false,
    type: Boolean,
    description: 'Include quarterly tax payment estimates',
  })
  async getIncomeTaxReport(
    @Query('organizationId') organizationId: string,
    @Query('taxYear', ParseIntPipe) taxYear: number,
    @Query('country') country: TaxReportCountry,
    @Query('includeQuarterlyEstimates') includeQuarterlyEstimates?: boolean,
  ): Promise<IncomeTaxReportResponse> {
    this.logger.log(`GET /reports/tax/income - org: ${organizationId}, year: ${taxYear}`);

    const dto: GenerateIncomeTaxReportDto = {
      organizationId,
      taxYear,
      country,
      includeQuarterlyEstimates:
        includeQuarterlyEstimates !== undefined ? includeQuarterlyEstimates : true,
    };

    return this.taxReportService.generateIncomeTaxReport(dto);
  }

  @Get('deductions')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Analyze tax deductions',
    description:
      'Analyzes all deductible expenses, categorizes them, and identifies potential additional deductions using AI-powered classification.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deductions analysis completed successfully',
    type: DeductionsAnalysisResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  async analyzeDeductions(
    @Query('organizationId') organizationId: string,
    @Query('taxYear', ParseIntPipe) taxYear: number,
  ): Promise<DeductionsAnalysisResponse> {
    this.logger.log(`GET /reports/tax/deductions - org: ${organizationId}, year: ${taxYear}`);

    return this.taxReportService.analyzeDeductions(organizationId, taxYear);
  }

  @Get('export/elster')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Export tax data in ELSTER format (Germany)',
    description:
      'Generates an ELSTER-compatible XML export for electronic submission to German tax authorities (Finanzamt).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ELSTER export generated successfully',
    type: TaxExportResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  @ApiQuery({
    name: 'taxOfficeNumber',
    required: false,
    type: String,
    description: 'German tax office number (Finanzamtnummer)',
  })
  @ApiQuery({
    name: 'taxIdentifier',
    required: false,
    type: String,
    description: 'Tax identification number (Steuernummer)',
  })
  async exportElster(
    @Query('organizationId') organizationId: string,
    @Query('taxYear', ParseIntPipe) taxYear: number,
    @Query('taxOfficeNumber') taxOfficeNumber?: string,
    @Query('taxIdentifier') taxIdentifier?: string,
  ): Promise<TaxExportResponse> {
    this.logger.log(`GET /reports/tax/export/elster - org: ${organizationId}, year: ${taxYear}`);

    const dto: TaxExportDto = {
      organizationId,
      taxYear,
      format: TaxExportFormat.ELSTER_XML,
      taxOfficeNumber,
      taxIdentifier,
    };

    return this.taxReportService.generateElsterExport(dto);
  }

  @Get('export/finanzonline')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Export tax data in FinanzOnline format (Austria)',
    description:
      'Generates a FinanzOnline-compatible XML export for electronic submission to Austrian tax authorities (Finanzamt).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'FinanzOnline export generated successfully',
    type: TaxExportResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  @ApiQuery({
    name: 'taxIdentifier',
    required: false,
    type: String,
    description: 'Austrian tax identification number',
  })
  async exportFinanzOnline(
    @Query('organizationId') organizationId: string,
    @Query('taxYear', ParseIntPipe) taxYear: number,
    @Query('taxIdentifier') taxIdentifier?: string,
  ): Promise<TaxExportResponse> {
    this.logger.log(
      `GET /reports/tax/export/finanzonline - org: ${organizationId}, year: ${taxYear}`,
    );

    const dto: TaxExportDto = {
      organizationId,
      taxYear,
      format: TaxExportFormat.FINANZONLINE_XML,
      taxIdentifier,
    };

    return this.taxReportService.generateFinanzOnlineExport(dto);
  }

  @Get('deadlines')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Get tax filing deadlines',
    description:
      'Retrieves upcoming tax filing and payment deadlines for income tax, VAT, and trade tax based on country and tax year.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deadlines retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          taxType: { type: 'string', enum: ['INCOME', 'VAT', 'TRADE', 'OTHER'] },
          isOverdue: { type: 'boolean' },
          daysUntilDue: { type: 'number' },
        },
      },
    },
  })
  @ApiQuery({ name: 'country', required: true, enum: TaxReportCountry })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  async getTaxDeadlines(
    @Query('country') country: TaxReportCountry,
    @Query('taxYear', ParseIntPipe) taxYear: number,
  ) {
    this.logger.log(`GET /reports/tax/deadlines - country: ${country}, year: ${taxYear}`);

    return this.taxReportService.trackDeadlines(country, taxYear);
  }

  @Get('quarterly-estimates')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get quarterly tax payment estimates',
    description:
      'Calculates quarterly estimated tax payments based on annual tax liability projection.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quarterly estimates calculated successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          quarter: { type: 'number' },
          dueDate: { type: 'string', format: 'date-time' },
          estimatedPayment: { type: 'number' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE'] },
        },
      },
    },
  })
  @ApiQuery({ name: 'annualTaxLiability', required: true, type: Number })
  @ApiQuery({ name: 'taxYear', required: true, type: Number })
  async getQuarterlyEstimates(
    @Query('annualTaxLiability', ParseIntPipe) annualTaxLiability: number,
    @Query('taxYear', ParseIntPipe) taxYear: number,
  ) {
    this.logger.log(
      `GET /reports/tax/quarterly-estimates - liability: ${annualTaxLiability}, year: ${taxYear}`,
    );

    return this.taxReportService.generateQuarterlyEstimates(annualTaxLiability, taxYear);
  }

  @Get('effective-rate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Calculate effective tax rate',
    description: 'Calculates the effective tax rate as a percentage of gross income.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Effective tax rate calculated successfully',
    schema: {
      type: 'object',
      properties: {
        effectiveTaxRate: { type: 'number', description: 'Effective tax rate percentage' },
        taxPaid: { type: 'number' },
        grossIncome: { type: 'number' },
      },
    },
  })
  @ApiQuery({ name: 'taxPaid', required: true, type: Number })
  @ApiQuery({ name: 'grossIncome', required: true, type: Number })
  async calculateEffectiveTaxRate(
    @Query('taxPaid', ParseIntPipe) taxPaid: number,
    @Query('grossIncome', ParseIntPipe) grossIncome: number,
  ) {
    this.logger.log(
      `GET /reports/tax/effective-rate - taxPaid: ${taxPaid}, grossIncome: ${grossIncome}`,
    );

    const effectiveTaxRate = this.taxReportService.calculateEffectiveTaxRate(
      taxPaid,
      grossIncome,
    );

    return {
      effectiveTaxRate,
      taxPaid,
      grossIncome,
    };
  }
}
