import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { GdprService } from './gdpr.service';
import { ConsentManagerService } from './services/consent-manager.service';
import { DataSubjectRequestService } from './services/data-subject-request.service';
import { DataRetentionService } from './services/data-retention.service';
import { DataPortabilityService } from './services/data-portability.service';
import { AnonymizationService } from './services/anonymization.service';
import { AuditTrailService } from './services/audit-trail.service';
import {
  RecordConsentDto,
  UpdateConsentDto,
  RevokeConsentDto,
  QueryConsentDto,
} from './dto/consent.dto';
import {
  CreateDataSubjectRequestDto,
  UpdateDataSubjectRequestDto,
  ExtendDataSubjectRequestDto,
  QueryDataSubjectRequestDto,
} from './dto/data-subject-request.dto';
import {
  DataExportRequestDto,
} from './dto/data-export.dto';
import {
  CreateRetentionPolicyDto,
  UpdateRetentionPolicyDto,
  QueryRetentionPolicyDto,
} from './dto/retention-policy.dto';
import { ConsentPurpose, DataCategory } from './types/gdpr.types';

/**
 * GDPR Controller
 * Comprehensive API endpoints for GDPR compliance
 */
@ApiTags('GDPR')
@Controller('gdpr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GdprController {
  constructor(
    private readonly gdprService: GdprService,
    private readonly consentManager: ConsentManagerService,
    private readonly dsrService: DataSubjectRequestService,
    private readonly retentionService: DataRetentionService,
    private readonly portabilityService: DataPortabilityService,
    private readonly anonymizationService: AnonymizationService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  // ============================================================================
  // CONSENT MANAGEMENT ENDPOINTS
  // ============================================================================

  @Post('consent')
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded successfully' })
  recordConsent(@Body() dto: RecordConsentDto, @Request() req) {
    return this.consentManager.recordConsent(dto);
  }

  @Get('consent/:userId')
  @ApiOperation({ summary: 'Get user consent records' })
  @ApiResponse({ status: 200, description: 'Consent records retrieved' })
  getUserConsents(
    @Param('userId') userId: string,
    @Query('purpose') purpose?: ConsentPurpose,
  ) {
    return this.consentManager.getUserConsents(userId, purpose);
  }

  @Put('consent/:userId/:purpose')
  @ApiOperation({ summary: 'Update consent' })
  @ApiResponse({ status: 200, description: 'Consent updated successfully' })
  updateConsent(
    @Param('userId') userId: string,
    @Param('purpose') purpose: ConsentPurpose,
    @Body() dto: UpdateConsentDto,
  ) {
    return this.consentManager.updateConsent(userId, purpose, dto);
  }

  @Delete('consent/:userId/:purpose')
  @ApiOperation({ summary: 'Revoke consent' })
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeConsent(
    @Param('userId') userId: string,
    @Param('purpose') purpose: ConsentPurpose,
    @Body() dto: RevokeConsentDto,
  ) {
    return this.consentManager.revokeConsent({
      userId,
      purpose,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });
  }

  @Get('consent/query')
  @ApiOperation({ summary: 'Query consent records' })
  @ApiResponse({ status: 200, description: 'Consent query results' })
  queryConsents(@Query() query: QueryConsentDto) {
    return this.consentManager.queryConsents(query);
  }

  @Get('consent/stats')
  @ApiOperation({ summary: 'Get consent statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getConsentStats(@Query('organisationId') organisationId?: string) {
    return this.consentManager.getConsentStats(organisationId);
  }

  // ============================================================================
  // DATA SUBJECT REQUEST ENDPOINTS
  // ============================================================================

  @Post('requests')
  @ApiOperation({ summary: 'Create a Data Subject Request' })
  @ApiResponse({ status: 201, description: 'DSR created successfully' })
  createDataSubjectRequest(@Body() dto: CreateDataSubjectRequestDto, @Request() req) {
    return this.dsrService.createRequest(dto);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get DSR by ID' })
  @ApiResponse({ status: 200, description: 'DSR retrieved' })
  getDataSubjectRequest(@Param('id') id: string) {
    return this.dsrService.getRequest(id);
  }

  @Get('requests/by-request-id/:requestId')
  @ApiOperation({ summary: 'Get DSR by request ID' })
  @ApiResponse({ status: 200, description: 'DSR retrieved' })
  getDataSubjectRequestByRequestId(@Param('requestId') requestId: string) {
    return this.dsrService.getRequestByRequestId(requestId);
  }

  @Put('requests/:id/status')
  @ApiOperation({ summary: 'Update DSR status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  updateDataSubjectRequestStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDataSubjectRequestDto,
    @Request() req,
  ) {
    return this.dsrService.updateRequestStatus(id, dto, req.user.id);
  }

  @Put('requests/:id/extend')
  @ApiOperation({ summary: 'Extend DSR deadline' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  extendDataSubjectRequestDeadline(
    @Param('id') id: string,
    @Body() dto: ExtendDataSubjectRequestDto,
    @Request() req,
  ) {
    return this.dsrService.extendDeadline(id, dto, req.user.id);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Query DSRs' })
  @ApiResponse({ status: 200, description: 'DSR query results' })
  queryDataSubjectRequests(@Query() query: QueryDataSubjectRequestDto) {
    return this.dsrService.queryRequests(query);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending DSRs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getPendingDataSubjectRequests(@Query('organisationId') organisationId?: string) {
    return this.dsrService.getPendingRequests(organisationId);
  }

  @Get('requests/overdue')
  @ApiOperation({ summary: 'Get overdue DSRs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getOverdueDataSubjectRequests(@Query('organisationId') organisationId?: string) {
    return this.dsrService.getOverdueRequests(organisationId);
  }

  @Get('requests/stats')
  @ApiOperation({ summary: 'Get DSR statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getDataSubjectRequestStats(@Query('organisationId') organisationId?: string) {
    return this.dsrService.getStatistics(organisationId);
  }

  @Post('requests/:requestId/process')
  @ApiOperation({ summary: 'Process a DSR end-to-end' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  processDataSubjectRequest(
    @Param('requestId') requestId: string,
    @Request() req,
  ) {
    return this.gdprService.processDataSubjectRequest(requestId, req.user.id);
  }

  // ============================================================================
  // DATA PORTABILITY ENDPOINTS
  // ============================================================================

  @Post('export')
  @ApiOperation({ summary: 'Export user data' })
  @ApiResponse({ status: 201, description: 'Data export created' })
  exportUserData(@Body() dto: DataExportRequestDto, @Request() req) {
    return this.portabilityService.exportUserData(dto, req.user.id);
  }

  @Get('export/:fileName')
  @ApiOperation({ summary: 'Download exported data file' })
  @ApiResponse({ status: 200, description: 'Export file content' })
  getExportFile(@Param('fileName') fileName: string) {
    return this.portabilityService.getExportFile(fileName);
  }

  // ============================================================================
  // RETENTION POLICY ENDPOINTS
  // ============================================================================

  @Post('retention-policies')
  @ApiOperation({ summary: 'Create retention policy' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  createRetentionPolicy(@Body() dto: CreateRetentionPolicyDto, @Request() req) {
    return this.retentionService.createPolicy(dto, req.user.id);
  }

  @Get('retention-policies/:id')
  @ApiOperation({ summary: 'Get retention policy by ID' })
  getRetentionPolicy(@Param('id') id: string) {
    return this.retentionService.getPolicy(id);
  }

  @Put('retention-policies/:id')
  @ApiOperation({ summary: 'Update retention policy' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  updateRetentionPolicy(
    @Param('id') id: string,
    @Body() dto: UpdateRetentionPolicyDto,
    @Request() req,
  ) {
    return this.retentionService.updatePolicy(id, dto, req.user.id);
  }

  @Delete('retention-policies/:id')
  @ApiOperation({ summary: 'Delete retention policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  deleteRetentionPolicy(@Param('id') id: string, @Request() req) {
    return this.retentionService.deletePolicy(id, req.user.id);
  }

  @Get('retention-policies')
  @ApiOperation({ summary: 'Query retention policies' })
  queryRetentionPolicies(@Query() query: QueryRetentionPolicyDto) {
    return this.retentionService.queryPolicies(query);
  }

  @Get('retention-policies/active')
  @ApiOperation({ summary: 'Get active retention policies' })
  getActiveRetentionPolicies(@Query('organisationId') organisationId?: string) {
    return this.retentionService.getActivePolicies(organisationId);
  }

  @Post('retention-policies/:dataCategory/apply')
  @ApiOperation({ summary: 'Apply retention policy' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  applyRetentionPolicy(
    @Param('dataCategory') dataCategory: DataCategory,
    @Query('organisationId') organisationId?: string,
    @Query('dryRun') dryRun = true,
  ) {
    return this.retentionService.applyRetentionPolicy(dataCategory, organisationId, dryRun);
  }

  @Get('retention-policies/compliance-status')
  @ApiOperation({ summary: 'Get retention compliance status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getRetentionComplianceStatus(@Query('organisationId') organisationId?: string) {
    return this.retentionService.getComplianceStatus(organisationId);
  }

  // ============================================================================
  // ANONYMIZATION ENDPOINTS
  // ============================================================================

  @Post('anonymize/:userId')
  @ApiOperation({ summary: 'Anonymize user data' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  anonymizeUser(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.anonymizationService.anonymizeUser(userId, req.user.id, reason);
  }

  @Post('anonymize/:userId/preview')
  @ApiOperation({ summary: 'Preview anonymization impact' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getAnonymizationPreview(@Param('userId') userId: string) {
    return this.anonymizationService.getAnonymizationPreview(userId);
  }

  @Get('anonymize/:userId/status')
  @ApiOperation({ summary: 'Check if user is anonymized' })
  checkAnonymizationStatus(@Param('userId') userId: string) {
    return this.anonymizationService.isUserAnonymized(userId);
  }

  @Delete('users/:userId/hard-delete')
  @ApiOperation({ summary: 'Hard delete user (DANGEROUS - permanent)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('OWNER') // Only owners can hard delete
  hardDeleteUser(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.anonymizationService.hardDeleteUser(userId, req.user.id, reason);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete own account' })
  @HttpCode(HttpStatus.ACCEPTED)
  deleteOwnAccount(
    @Query('type') deleteType: 'anonymize' | 'hard_delete' = 'anonymize',
    @Request() req,
  ) {
    return this.gdprService.handleAccountDeletion(
      req.user.id,
      req.user.id,
      deleteType,
    );
  }

  // ============================================================================
  // AUDIT LOG ENDPOINTS
  // ============================================================================

  @Get('audit-log')
  @ApiOperation({ summary: 'Search GDPR audit logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  searchAuditLogs(
    @Query('userId') userId?: string,
    @Query('organisationId') organisationId?: string,
    @Query('eventType') eventType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    return this.auditTrail.searchAuditLogs({
      userId,
      organisationId,
      eventType: eventType as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  @Get('audit-log/user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a user' })
  getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    return this.auditTrail.getUserAuditLogs(userId, limit, offset);
  }

  @Get('audit-log/stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getAuditLogStats(
    @Query('organisationId') organisationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditTrail.getEventTypeStats(
      organisationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post('audit-log/export')
  @ApiOperation({ summary: 'Export audit logs for compliance' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  exportAuditLogs(
    @Body('organisationId') organisationId: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('userId') userId?: string,
  ) {
    return this.auditTrail.exportAuditLogs({
      organisationId,
      userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  // ============================================================================
  // GENERAL GDPR ENDPOINTS
  // ============================================================================

  @Get('compliance-status')
  @ApiOperation({ summary: 'Get overall GDPR compliance status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getComplianceStatus(@Query('organisationId') organisationId?: string) {
    return this.gdprService.getComplianceStatus(organisationId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get GDPR dashboard data' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  getDashboard(@Query('organisationId') organisationId?: string) {
    return this.gdprService.getDashboardData(organisationId);
  }

  @Get('user-overview/:userId')
  @ApiOperation({ summary: "Get user's GDPR data overview" })
  getUserGdprOverview(@Param('userId') userId: string) {
    return this.gdprService.getUserGdprOverview(userId);
  }

  @Post('initialize/:organisationId')
  @ApiOperation({ summary: 'Initialize GDPR compliance for organisation' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  initializeCompliance(
    @Param('organisationId') organisationId: string,
    @Request() req,
  ) {
    return this.gdprService.initializeOrganisationCompliance(organisationId, req.user.id);
  }

  @Post('compliance-report')
  @ApiOperation({ summary: 'Generate GDPR compliance report' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OWNER')
  exportComplianceReport(
    @Body('organisationId') organisationId: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
  ) {
    return this.gdprService.exportComplianceReport(
      organisationId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
