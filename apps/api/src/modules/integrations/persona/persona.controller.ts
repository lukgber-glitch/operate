import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PersonaInquiryService } from './services/persona-inquiry.service';
import { PersonaVerificationService } from './services/persona-verification.service';
import {
  CreateInquiryDto,
  InquiryResponseDto,
  VerificationResultDto,
} from './dto';

/**
 * Persona Controller
 * REST endpoints for Persona KYC operations
 *
 * Features:
 * - Create and manage verification inquiries
 * - Retrieve inquiry status
 * - List user inquiries
 * - Get verification results
 * - List available templates
 */
@ApiTags('persona')
@Controller('integrations/persona')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PersonaController {
  private readonly logger = new Logger(PersonaController.name);

  constructor(
    private readonly inquiryService: PersonaInquiryService,
    private readonly verificationService: PersonaVerificationService,
  ) {}

  // Inquiry Endpoints

  @Post('inquiries')
  @ApiOperation({ summary: 'Create a new KYC inquiry' })
  @ApiResponse({
    status: 201,
    description: 'Inquiry created successfully',
    type: InquiryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createInquiry(
    @Request() req,
    @Body() createInquiryDto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    this.logger.log(`Creating inquiry for user ${req.user.id}`);

    return this.inquiryService.createInquiry(req.user.id, createInquiryDto);
  }

  @Get('inquiries/:id')
  @ApiOperation({ summary: 'Get inquiry details' })
  @ApiResponse({ status: 200, description: 'Inquiry details retrieved' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  async getInquiry(@Param('id') id: string) {
    this.logger.log(`Retrieving inquiry ${id}`);

    return this.inquiryService.getInquiry(id);
  }

  @Get('inquiries/user/:userId')
  @ApiOperation({ summary: 'Get all inquiries for a user' })
  @ApiResponse({ status: 200, description: 'User inquiries retrieved' })
  async getUserInquiries(@Param('userId') userId: string) {
    this.logger.log(`Retrieving inquiries for user ${userId}`);

    return this.inquiryService.getInquiriesByUser(userId);
  }

  @Get('inquiries/organization/:organizationId')
  @ApiOperation({ summary: 'Get all inquiries for an organization' })
  @ApiResponse({ status: 200, description: 'Organization inquiries retrieved' })
  async getOrganizationInquiries(
    @Param('organizationId') organizationId: string,
  ) {
    this.logger.log(`Retrieving inquiries for organization ${organizationId}`);

    return this.inquiryService.getInquiriesByOrganization(organizationId);
  }

  @Post('inquiries/:id/resume')
  @ApiOperation({
    summary: 'Resume an existing inquiry (get new session token)',
  })
  @ApiResponse({ status: 200, description: 'New session token generated' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  async resumeInquiry(@Param('id') id: string) {
    this.logger.log(`Resuming inquiry ${id}`);

    const sessionToken = await this.inquiryService.resumeInquiry(id);
    return { sessionToken };
  }

  @Post('inquiries/:id/expire')
  @ApiOperation({ summary: 'Manually expire an inquiry' })
  @ApiResponse({ status: 200, description: 'Inquiry expired successfully' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  async expireInquiry(@Param('id') id: string) {
    this.logger.log(`Expiring inquiry ${id}`);

    await this.inquiryService.expireInquiry(id);
    return { success: true };
  }

  // Verification Endpoints

  @Get('verifications/:inquiryId')
  @ApiOperation({ summary: 'Get verification results for an inquiry' })
  @ApiResponse({
    status: 200,
    description: 'Verification results retrieved',
    type: VerificationResultDto,
  })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  async getVerificationResults(
    @Param('inquiryId') inquiryId: string,
  ): Promise<VerificationResultDto> {
    this.logger.log(`Retrieving verification results for ${inquiryId}`);

    return this.verificationService.processVerificationResults(inquiryId);
  }

  @Get('verifications/:inquiryId/history')
  @ApiOperation({ summary: 'Get verification history for an inquiry' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved' })
  async getVerificationHistory(@Param('inquiryId') inquiryId: string) {
    this.logger.log(`Retrieving verification history for ${inquiryId}`);

    return this.verificationService.getVerificationHistory(inquiryId);
  }

  @Get('users/:userId/stats')
  @ApiOperation({ summary: 'Get verification statistics for a user' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  async getUserStats(@Param('userId') userId: string) {
    this.logger.log(`Retrieving verification stats for user ${userId}`);

    return this.verificationService.getUserVerificationStats(userId);
  }

  @Get('organizations/:organizationId/failure-analysis')
  @ApiOperation({ summary: 'Analyze common verification failure reasons' })
  @ApiResponse({ status: 200, description: 'Failure analysis retrieved' })
  async getFailureAnalysis(@Param('organizationId') organizationId: string) {
    this.logger.log(`Analyzing failures for organization ${organizationId}`);

    return this.verificationService.analyzeFailureReasons(organizationId);
  }

  // Template Endpoints

  @Get('templates')
  @ApiOperation({ summary: 'List available inquiry templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved' })
  async listTemplates() {
    this.logger.log('Retrieving inquiry templates');

    return this.inquiryService.listTemplates();
  }
}
