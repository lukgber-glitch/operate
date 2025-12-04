import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Logger,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GustoService } from './gusto.service';
import { GustoOAuthService } from './services/gusto-oauth.service';
import { GustoCompanyService } from './services/gusto-company.service';
import { GustoEmployeeService } from './services/gusto-employee.service';
import { GustoPayrollService } from './services/gusto-payroll.service';
import { GustoPayStubService } from './services/gusto-pay-stub.service';
import { GustoTaxService } from './services/gusto-tax.service';
import { GustoBenefitsService } from './services/gusto-benefits.service';
import { GustoEncryptionUtil } from './utils/gusto-encryption.util';
import {
  InitiateOAuthDto,
  OAuthCallbackDto,
  OAuthInitiateResponseDto,
  OAuthCallbackResponseDto,
  ProvisionCompanyDto,
  ProvisionCompanyResponseDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  SyncEmployeesDto,
  SyncEmployeesResponseDto,
  DisconnectDto,
  ConnectionStatusDto,
} from './dto';
import { GustoConnectionStatus } from './gusto.types';

/**
 * Gusto Integration Controller
 * Handles OAuth flow and main API endpoints
 */
@ApiTags('integrations/gusto')
@Controller('integrations/gusto')
@ApiBearerAuth()
export class GustoController {
  private readonly logger = new Logger(GustoController.name);

  constructor(
    private readonly gustoService: GustoService,
    private readonly oauthService: GustoOAuthService,
    private readonly companyService: GustoCompanyService,
    private readonly employeeService: GustoEmployeeService,
    private readonly payrollService: GustoPayrollService,
    private readonly payStubService: GustoPayStubService,
    private readonly taxService: GustoTaxService,
    private readonly benefitsService: GustoBenefitsService,
    private readonly encryption: GustoEncryptionUtil,
  ) {}

  // ==================== OAuth Endpoints ====================

  @Post('oauth/initiate')
  @ApiOperation({ summary: 'Initiate OAuth flow with Gusto' })
  @ApiResponse({ status: 200, type: OAuthInitiateResponseDto })
  async initiateOAuth(
    @Body() dto: InitiateOAuthDto,
    @Req() req: any,
  ): Promise<OAuthInitiateResponseDto> {
    const userId = req.user?.id || 'system';

    this.logger.log('Initiating Gusto OAuth flow', {
      organisationId: dto.organisationId,
      userId,
    });

    const { url, state } = this.oauthService.generateAuthorizationUrl(
      dto.organisationId,
      userId,
    );

    return {
      authorizationUrl: url,
      state,
    };
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'OAuth callback endpoint' })
  @ApiResponse({ status: 200, type: OAuthCallbackResponseDto })
  async oauthCallback(
    @Query() query: OAuthCallbackDto,
  ): Promise<OAuthCallbackResponseDto> {
    this.logger.log('Processing OAuth callback', { state: query.state });

    // Exchange code for token
    const { tokens, organisationId, userId } =
      await this.oauthService.exchangeCodeForToken(query.code, query.state);

    // Get company info
    const companies = await this.getCompaniesFromToken(tokens.accessToken);
    const companyUuid = companies[0]?.uuid;

    if (!companyUuid) {
      throw new BadRequestException('No company found for this account');
    }

    const company = await this.companyService.getCompany(
      tokens.accessToken,
      companyUuid,
    );

    // TODO: Store connection in database
    // await this.saveConnection({
    //   organisationId,
    //   userId,
    //   companyUuid,
    //   companyName: company.name,
    //   accessToken: this.encryption.encrypt(tokens.accessToken),
    //   refreshToken: this.encryption.encrypt(tokens.refreshToken),
    //   expiresAt: tokens.expiresAt,
    //   scope: tokens.scope,
    //   status: GustoConnectionStatus.ACTIVE,
    // });

    this.logger.log('OAuth connection established', {
      organisationId,
      companyUuid,
      companyName: company.name,
    });

    return {
      success: true,
      companyUuid,
      companyName: company.name,
      message: 'Connection established successfully',
    };
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect Gusto integration' })
  @ApiResponse({ status: 200 })
  async disconnect(@Body() dto: DisconnectDto): Promise<{ success: boolean }> {
    this.logger.log('Disconnecting Gusto integration', {
      companyUuid: dto.companyUuid,
    });

    // TODO: Update connection status in database
    // await this.updateConnectionStatus(dto.companyUuid, GustoConnectionStatus.REVOKED);

    return { success: true };
  }

  @Get('status/:companyUuid')
  @ApiOperation({ summary: 'Get connection status' })
  @ApiResponse({ status: 200, type: ConnectionStatusDto })
  async getStatus(
    @Param('companyUuid') companyUuid: string,
  ): Promise<ConnectionStatusDto> {
    // TODO: Fetch from database
    // const connection = await this.getConnection(companyUuid);

    // Mock response for now
    return {
      companyUuid,
      status: 'ACTIVE',
      connectedAt: new Date(),
      scopes: this.gustoService.getConfig().scopes,
    };
  }

  // ==================== Provisioning Endpoints ====================

  @Post('provision')
  @ApiOperation({ summary: 'Provision a new company in Gusto' })
  @ApiResponse({ status: 201, type: ProvisionCompanyResponseDto })
  async provisionCompany(
    @Body() dto: ProvisionCompanyDto,
  ): Promise<ProvisionCompanyResponseDto> {
    this.logger.log('Provisioning company in Gusto', {
      companyName: dto.company.name,
      userEmail: dto.user.email,
    });

    // Validate company data
    this.companyService.validateCompanyData(dto);

    // Provision in Gusto
    const { tokens, companyUuid } = await this.companyService.provisionCompany(dto);

    // TODO: Store connection in database

    return {
      companyUuid,
      accessToken: tokens.accessToken,
      status: GustoConnectionStatus.ACTIVE,
      expiresAt: tokens.expiresAt,
    };
  }

  // ==================== Company Endpoints ====================

  @Get('company/:companyUuid')
  @ApiOperation({ summary: 'Get company details' })
  @ApiResponse({ status: 200 })
  async getCompany(
    @Param('companyUuid') companyUuid: string,
    @Req() req: any,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.companyService.getCompany(accessToken, companyUuid);
  }

  @Get('company/:companyUuid/locations')
  @ApiOperation({ summary: 'Get company locations' })
  @ApiResponse({ status: 200 })
  async getLocations(
    @Param('companyUuid') companyUuid: string,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.companyService.getCompanyLocations(accessToken, companyUuid);
  }

  // ==================== Employee Endpoints ====================

  @Get('company/:companyUuid/employees')
  @ApiOperation({ summary: 'List employees' })
  @ApiResponse({ status: 200 })
  async listEmployees(
    @Param('companyUuid') companyUuid: string,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.employeeService.listEmployees(accessToken, companyUuid);
  }

  @Post('company/:companyUuid/employees')
  @ApiOperation({ summary: 'Create employee' })
  @ApiResponse({ status: 201 })
  async createEmployee(
    @Param('companyUuid') companyUuid: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);

    // Validate employee data
    const errors = this.employeeService.validateEmployeeData(dto);
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    return this.employeeService.createEmployee(accessToken, companyUuid, dto);
  }

  @Get('employee/:employeeUuid')
  @ApiOperation({ summary: 'Get employee details' })
  @ApiResponse({ status: 200 })
  async getEmployee(
    @Param('employeeUuid') employeeUuid: string,
  ) {
    // TODO: Get companyUuid from employee or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.employeeService.getEmployee(accessToken, employeeUuid);
  }

  @Post('company/:companyUuid/employees/sync')
  @ApiOperation({ summary: 'Sync employees from Gusto' })
  @ApiResponse({ status: 200, type: SyncEmployeesResponseDto })
  async syncEmployees(
    @Param('companyUuid') companyUuid: string,
    @Req() req: any,
  ): Promise<SyncEmployeesResponseDto> {
    const organisationId = req.user?.organisationId || 'system';
    const accessToken = await this.getAccessToken(companyUuid);

    return this.employeeService.syncEmployees(
      accessToken,
      companyUuid,
      organisationId,
    );
  }

  // ==================== Payroll Endpoints ====================

  @Get('company/:companyUuid/pay-periods')
  @ApiOperation({ summary: 'List pay periods' })
  @ApiResponse({ status: 200 })
  async listPayPeriods(
    @Param('companyUuid') companyUuid: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.listPayPeriods(accessToken, companyUuid, startDate, endDate);
  }

  @Get('company/:companyUuid/pay-periods/current')
  @ApiOperation({ summary: 'Get current pay period' })
  @ApiResponse({ status: 200 })
  async getCurrentPayPeriod(
    @Param('companyUuid') companyUuid: string,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.getCurrentPayPeriod(accessToken, companyUuid);
  }

  @Post('company/:companyUuid/payrolls')
  @ApiOperation({ summary: 'Create payroll' })
  @ApiResponse({ status: 201 })
  async createPayroll(
    @Param('companyUuid') companyUuid: string,
    @Body() dto: any, // Import CreatePayrollDto
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.createPayroll(accessToken, { ...dto, company_uuid: companyUuid });
  }

  @Get('company/:companyUuid/payrolls')
  @ApiOperation({ summary: 'List payrolls' })
  @ApiResponse({ status: 200 })
  async listPayrolls(
    @Param('companyUuid') companyUuid: string,
    @Query() query: any, // Import ListPayrollsQueryDto
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.listPayrolls(accessToken, companyUuid, query);
  }

  @Get('payroll/:payrollUuid')
  @ApiOperation({ summary: 'Get payroll details' })
  @ApiResponse({ status: 200 })
  async getPayroll(
    @Param('payrollUuid') payrollUuid: string,
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.getPayroll(accessToken, payrollUuid);
  }

  @Put('payroll/:payrollUuid')
  @ApiOperation({ summary: 'Update payroll' })
  @ApiResponse({ status: 200 })
  async updatePayroll(
    @Param('payrollUuid') payrollUuid: string,
    @Body() dto: any, // Import UpdatePayrollDto
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.updatePayroll(accessToken, payrollUuid, dto);
  }

  @Put('payroll/:payrollUuid/calculate')
  @ApiOperation({ summary: 'Calculate payroll' })
  @ApiResponse({ status: 200 })
  async calculatePayroll(
    @Param('payrollUuid') payrollUuid: string,
    @Body() dto: any, // Import CalculatePayrollDto
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.calculatePayroll(accessToken, payrollUuid, dto);
  }

  @Put('payroll/:payrollUuid/submit')
  @ApiOperation({ summary: 'Submit payroll for processing' })
  @ApiResponse({ status: 200 })
  async submitPayroll(
    @Param('payrollUuid') payrollUuid: string,
    @Body() dto: any, // Import SubmitPayrollDto
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.submitPayroll(accessToken, payrollUuid, dto);
  }

  @Delete('payroll/:payrollUuid')
  @ApiOperation({ summary: 'Cancel payroll' })
  @ApiResponse({ status: 200 })
  async cancelPayroll(
    @Param('payrollUuid') payrollUuid: string,
    @Body() dto: any, // Import CancelPayrollDto
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payrollService.cancelPayroll(accessToken, payrollUuid, dto);
  }

  // ==================== Pay Stub Endpoints ====================

  @Get('payroll/:payrollUuid/employee/:employeeUuid/pay-stub')
  @ApiOperation({ summary: 'Get pay stub' })
  @ApiResponse({ status: 200 })
  async getPayStub(
    @Param('payrollUuid') payrollUuid: string,
    @Param('employeeUuid') employeeUuid: string,
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payStubService.getPayStubDetails(accessToken, payrollUuid, employeeUuid);
  }

  @Get('employee/:employeeUuid/pay-stubs')
  @ApiOperation({ summary: 'List pay stubs for employee' })
  @ApiResponse({ status: 200 })
  async listPayStubs(
    @Param('employeeUuid') employeeUuid: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('year') year?: string,
  ) {
    // TODO: Get companyUuid from employee or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payStubService.listPayStubs(accessToken, employeeUuid, startDate, endDate, year);
  }

  @Get('payroll/:payrollUuid/employee/:employeeUuid/pay-stub/pdf')
  @ApiOperation({ summary: 'Generate pay stub PDF' })
  @ApiResponse({ status: 200 })
  async generatePayStubPDF(
    @Param('payrollUuid') payrollUuid: string,
    @Param('employeeUuid') employeeUuid: string,
  ) {
    // TODO: Get companyUuid from payroll or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.payStubService.generatePayStubPDF(accessToken, payrollUuid, employeeUuid);
  }

  // ==================== Tax Endpoints ====================

  @Get('employee/:employeeUuid/tax-withholding')
  @ApiOperation({ summary: 'Get employee tax withholding' })
  @ApiResponse({ status: 200 })
  async getTaxWithholding(
    @Param('employeeUuid') employeeUuid: string,
  ) {
    // TODO: Get companyUuid from employee or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.taxService.getEmployeeTaxWithholding(accessToken, employeeUuid);
  }

  @Get('employee/:employeeUuid/ytd-totals')
  @ApiOperation({ summary: 'Get year-to-date tax totals' })
  @ApiResponse({ status: 200 })
  async getYTDTotals(
    @Param('employeeUuid') employeeUuid: string,
    @Query('year') year?: number,
  ) {
    // TODO: Get companyUuid from employee or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.taxService.getYTDTaxTotals(accessToken, employeeUuid, year);
  }

  // ==================== Benefits Endpoints ====================

  @Get('company/:companyUuid/benefits')
  @ApiOperation({ summary: 'List company benefits' })
  @ApiResponse({ status: 200 })
  async listCompanyBenefits(
    @Param('companyUuid') companyUuid: string,
  ) {
    const accessToken = await this.getAccessToken(companyUuid);
    return this.benefitsService.listCompanyBenefits(accessToken, companyUuid);
  }

  @Get('employee/:employeeUuid/benefits')
  @ApiOperation({ summary: 'List employee benefits' })
  @ApiResponse({ status: 200 })
  async listEmployeeBenefits(
    @Param('employeeUuid') employeeUuid: string,
  ) {
    // TODO: Get companyUuid from employee or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.benefitsService.listEmployeeBenefits(accessToken, employeeUuid);
  }

  @Get('employee/:employeeUuid/benefits/summary')
  @ApiOperation({ summary: 'Get employee benefits summary' })
  @ApiResponse({ status: 200 })
  async getEmployeeBenefitsSummary(
    @Param('employeeUuid') employeeUuid: string,
  ) {
    // TODO: Get companyUuid from employee or connection
    const companyUuid = 'comp_xxx'; // Placeholder
    const accessToken = await this.getAccessToken(companyUuid);
    return this.benefitsService.getEmployeeBenefitsSummary(accessToken, employeeUuid);
  }

  // ==================== Helper Methods ====================

  /**
   * Get access token for a company
   * TODO: Implement database lookup and token refresh
   */
  private async getAccessToken(companyUuid: string): Promise<string> {
    // TODO: Fetch from database
    // const connection = await this.getConnection(companyUuid);
    // const accessToken = this.encryption.decrypt(connection.accessToken);

    // // Check if expired and refresh if needed
    // if (this.oauthService.isTokenExpired(connection.expiresAt)) {
    //   const refreshToken = this.encryption.decrypt(connection.refreshToken);
    //   const newTokens = await this.oauthService.refreshAccessToken(refreshToken);
    //
    //   // Update in database
    //   await this.updateTokens(companyUuid, newTokens);
    //
    //   return newTokens.accessToken;
    // }

    // return accessToken;

    throw new BadRequestException('Token management not yet implemented');
  }

  /**
   * Get companies from access token
   * Helper to discover which companies a token has access to
   */
  private async getCompaniesFromToken(accessToken: string): Promise<any[]> {
    // TODO: Implement company discovery
    // For now, return empty array
    return [];
  }
}
