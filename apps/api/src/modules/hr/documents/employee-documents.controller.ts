import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { EmployeeDocumentsService } from './employee-documents.service';
import { W4FormService } from './services/w4-form.service';
import { I9FormService } from './services/i9-form.service';
import {
  DocumentUploadDto,
  VerifyDocumentDto,
  RejectDocumentDto,
  DocumentQueryDto,
} from './dto/document-upload.dto';
import {
  CreateW4FormDto,
  UpdateW4FormDto,
  SignW4FormDto,
} from './dto/w4-form.dto';
import {
  CreateI9Section1Dto,
  CreateI9Section2Dto,
  CreateI9Section3Dto,
} from './dto/i9-form.dto';

/**
 * Employee Documents Controller
 * Handles all employee document operations including W-4 and I-9 forms
 */
@ApiTags('HR - Employee Documents')
@ApiBearerAuth()
@Controller('hr/employees/:employeeId/documents')
// @UseGuards(JwtAuthGuard, RolesGuard) // Uncomment when auth is set up
export class EmployeeDocumentsController {
  private readonly logger = new Logger(EmployeeDocumentsController.name);

  constructor(
    private documentsService: EmployeeDocumentsService,
    private w4FormService: W4FormService,
    private i9FormService: I9FormService,
  ) {}

  // ============================================================================
  // GENERAL DOCUMENT ENDPOINTS
  // ============================================================================

  @Post('upload')
  @ApiOperation({ summary: 'Upload employee document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('employeeId') employeeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: DocumentUploadDto,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const userId = req.user?.id || 'system';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.documentsService.uploadDocument(
      file,
      employeeId,
      orgId,
      userId,
      dto,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List employee documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async listDocuments(
    @Param('employeeId') employeeId: string,
    @Query() query: DocumentQueryDto,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    return this.documentsService.listEmployeeDocuments(employeeId, orgId, query);
  }

  @Get(':documentId')
  @ApiOperation({ summary: 'Get document details' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  async getDocument(
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const userId = req.user?.id || 'system';
    return this.documentsService.getDocument(documentId, orgId, userId);
  }

  @Get(':documentId/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  async downloadDocument(
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const userId = req.user?.id || 'system';

    const { buffer, fileName, mimeType } =
      await this.documentsService.downloadDocument(documentId, orgId, userId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Put(':documentId/verify')
  @ApiOperation({ summary: 'Verify document' })
  @ApiResponse({ status: 200, description: 'Document verified successfully' })
  async verifyDocument(
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const userId = req.user?.id || 'system';
    return this.documentsService.verifyDocument(documentId, orgId, userId, dto);
  }

  @Put(':documentId/reject')
  @ApiOperation({ summary: 'Reject document' })
  @ApiResponse({ status: 200, description: 'Document rejected successfully' })
  async rejectDocument(
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
    @Body() dto: RejectDocumentDto,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const userId = req.user?.id || 'system';
    return this.documentsService.rejectDocument(documentId, orgId, userId, dto);
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  async deleteDocument(
    @Param('employeeId') employeeId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const userId = req.user?.id || 'system';
    await this.documentsService.deleteDocument(documentId, orgId, userId);
  }

  // ============================================================================
  // W-4 FORM ENDPOINTS
  // ============================================================================

  @Post('w4')
  @ApiOperation({ summary: 'Create W-4 form' })
  @ApiResponse({ status: 201, description: 'W-4 form created successfully' })
  async createW4Form(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateW4FormDto,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    return this.w4FormService.create(employeeId, orgId, dto);
  }

  @Get('w4')
  @ApiOperation({ summary: 'Get all W-4 forms for employee' })
  @ApiResponse({ status: 200, description: 'W-4 forms retrieved successfully' })
  async getW4Forms(@Param('employeeId') employeeId: string) {
    return this.w4FormService.findAllForEmployee(employeeId);
  }

  @Get('w4/active')
  @ApiOperation({ summary: 'Get active W-4 form for employee' })
  @ApiResponse({ status: 200, description: 'Active W-4 form retrieved successfully' })
  async getActiveW4Form(
    @Param('employeeId') employeeId: string,
    @Query('taxYear') taxYear?: number,
  ) {
    return this.w4FormService.getActiveForEmployee(employeeId, taxYear);
  }

  @Get('w4/:w4FormId')
  @ApiOperation({ summary: 'Get W-4 form by ID' })
  @ApiResponse({ status: 200, description: 'W-4 form retrieved successfully' })
  async getW4Form(@Param('w4FormId') w4FormId: string) {
    return this.w4FormService.findById(w4FormId);
  }

  @Put('w4/:w4FormId')
  @ApiOperation({ summary: 'Update W-4 form (before signing)' })
  @ApiResponse({ status: 200, description: 'W-4 form updated successfully' })
  async updateW4Form(
    @Param('w4FormId') w4FormId: string,
    @Body() dto: UpdateW4FormDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.w4FormService.update(w4FormId, userId, dto);
  }

  @Post('w4/:w4FormId/sign')
  @ApiOperation({ summary: 'Sign W-4 form (makes it active)' })
  @ApiResponse({ status: 200, description: 'W-4 form signed successfully' })
  async signW4Form(
    @Param('w4FormId') w4FormId: string,
    @Body() dto: SignW4FormDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.w4FormService.sign(w4FormId, userId, dto);
  }

  @Delete('w4/:w4FormId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete W-4 form' })
  @ApiResponse({ status: 204, description: 'W-4 form deleted successfully' })
  async deleteW4Form(@Param('w4FormId') w4FormId: string) {
    await this.w4FormService.softDelete(w4FormId);
  }

  // ============================================================================
  // I-9 FORM ENDPOINTS
  // ============================================================================

  @Post('i9/section1')
  @ApiOperation({ summary: 'Complete I-9 Section 1 (Employee section)' })
  @ApiResponse({ status: 201, description: 'I-9 Section 1 completed successfully' })
  async createI9Section1(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateI9Section1Dto,
    @Req() req: any,
  ) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    return this.i9FormService.createSection1(employeeId, orgId, dto);
  }

  @Post('i9/:i9FormId/section2')
  @ApiOperation({ summary: 'Complete I-9 Section 2 (Employer verification)' })
  @ApiResponse({ status: 200, description: 'I-9 Section 2 completed successfully' })
  async completeI9Section2(
    @Param('i9FormId') i9FormId: string,
    @Body() dto: CreateI9Section2Dto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.i9FormService.completeSection2(i9FormId, userId, dto);
  }

  @Post('i9/:i9FormId/section3')
  @ApiOperation({ summary: 'Complete I-9 Section 3 (Reverification)' })
  @ApiResponse({ status: 200, description: 'I-9 Section 3 completed successfully' })
  async completeI9Section3(
    @Param('i9FormId') i9FormId: string,
    @Body() dto: CreateI9Section3Dto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.i9FormService.completeSection3(i9FormId, userId, dto);
  }

  @Get('i9')
  @ApiOperation({ summary: 'Get all I-9 forms for employee' })
  @ApiResponse({ status: 200, description: 'I-9 forms retrieved successfully' })
  async getI9Forms(@Param('employeeId') employeeId: string) {
    return this.i9FormService.findAllForEmployee(employeeId);
  }

  @Get('i9/active')
  @ApiOperation({ summary: 'Get active I-9 form for employee' })
  @ApiResponse({ status: 200, description: 'Active I-9 form retrieved successfully' })
  async getActiveI9Form(@Param('employeeId') employeeId: string) {
    return this.i9FormService.getActiveForEmployee(employeeId);
  }

  @Get('i9/:i9FormId')
  @ApiOperation({ summary: 'Get I-9 form by ID' })
  @ApiResponse({ status: 200, description: 'I-9 form retrieved successfully' })
  async getI9Form(@Param('i9FormId') i9FormId: string) {
    return this.i9FormService.findById(i9FormId);
  }

  @Post('i9/:i9FormId/everify')
  @ApiOperation({ summary: 'Submit I-9 form to E-Verify' })
  @ApiResponse({ status: 200, description: 'I-9 form submitted to E-Verify' })
  async submitToEVerify(@Param('i9FormId') i9FormId: string) {
    await this.i9FormService.submitToEVerify(i9FormId);
    return { message: 'Submitted to E-Verify successfully' };
  }

  @Delete('i9/:i9FormId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete I-9 form' })
  @ApiResponse({ status: 204, description: 'I-9 form deleted successfully' })
  async deleteI9Form(@Param('i9FormId') i9FormId: string) {
    await this.i9FormService.softDelete(i9FormId);
  }
}

/**
 * Organization-level Document Management Controller
 */
@ApiTags('HR - Organization Documents')
@ApiBearerAuth()
@Controller('hr/documents')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationDocumentsController {
  private readonly logger = new Logger(OrganizationDocumentsController.name);

  constructor(
    private documentsService: EmployeeDocumentsService,
    private i9FormService: I9FormService,
  ) {}

  @Get('attention-required')
  @ApiOperation({ summary: 'Get documents requiring attention' })
  @ApiResponse({ status: 200, description: 'Documents requiring attention retrieved' })
  async getDocumentsRequiringAttention(@Req() req: any) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    return this.documentsService.getDocumentsRequiringAttention(orgId);
  }

  @Get('retention-compliance')
  @ApiOperation({ summary: 'Check document retention compliance' })
  @ApiResponse({ status: 200, description: 'Retention compliance check completed' })
  async checkRetentionCompliance(@Req() req: any) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    return this.documentsService.checkRetentionCompliance(orgId);
  }

  @Get('i9/reverification-required')
  @ApiOperation({ summary: 'Get I-9 forms requiring reverification' })
  @ApiResponse({ status: 200, description: 'I-9 forms requiring reverification retrieved' })
  async getI9RequiringReverification(@Req() req: any) {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    return this.i9FormService.findRequiringReverification(orgId);
  }
}
