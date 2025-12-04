import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../../auth/rbac/permissions';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import {
  UploadReceiptDto,
  ReceiptScanResult,
  ScanStatus,
  ConfirmScanDto,
  ScanHistoryFiltersDto,
  PaginatedResult,
  ReceiptScan,
} from './dto/receipts.dto';

/**
 * Receipts Controller
 * Handles receipt upload, OCR scanning, and expense creation from receipts
 */
@ApiTags('Finance - Receipts')
@Controller('organisations/:orgId/receipts')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ReceiptsController {
  /**
   * Upload and scan a receipt
   * Uploads receipt file, performs OCR, and returns extracted data
   */
  @Post('upload')
  @RequirePermissions(Permission.EXPENSES_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload and scan receipt',
    description:
      'Upload a receipt image or PDF, perform OCR extraction, and return structured data',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiBody({
    description: 'Receipt file and metadata',
    type: UploadReceiptDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Receipt uploaded and scan initiated',
    type: ReceiptScanResult,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async uploadReceipt(
    @Param('orgId') orgId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024, // 10MB
            message: 'File size must not exceed 10MB',
          }),
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png|image\/webp|application\/pdf)/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDto: UploadReceiptDto,
    @CurrentUser('id') userId: string,
  ): Promise<ReceiptScanResult> {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // TODO: Implement receipt upload and scan
    // This will integrate with:
    // - BRIDGE's Mindee integration for OCR
    // - ORACLE's receipt scanner service for classification
    // - File storage service for receipt URL
    throw new Error('Not implemented - to be integrated with BRIDGE and ORACLE');
  }

  /**
   * Get scan status
   * Check the status of an ongoing scan
   */
  @Get(':scanId/status')
  @RequirePermissions(Permission.EXPENSES_READ)
  @ApiOperation({
    summary: 'Get scan status',
    description: 'Check the processing status of a receipt scan',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'scanId',
    description: 'Scan ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan status retrieved',
    schema: {
      type: 'object',
      properties: {
        scanId: { type: 'string' },
        status: { enum: Object.values(ScanStatus) },
        progress: { type: 'number', example: 75 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Scan not found',
  })
  async getScanStatus(
    @Param('scanId') scanId: string,
  ): Promise<{ scanId: string; status: ScanStatus; progress?: number }> {
    // TODO: Implement scan status check
    throw new Error('Not implemented');
  }

  /**
   * Get scan result
   * Retrieve the complete scan result with extracted data
   */
  @Get(':scanId')
  @RequirePermissions(Permission.EXPENSES_READ)
  @ApiOperation({
    summary: 'Get scan result',
    description: 'Retrieve complete scan result with all extracted fields',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'scanId',
    description: 'Scan ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan result retrieved',
    type: ReceiptScanResult,
  })
  @ApiResponse({
    status: 404,
    description: 'Scan not found',
  })
  async getScanResult(
    @Param('scanId') scanId: string,
  ): Promise<ReceiptScanResult> {
    // TODO: Implement scan result retrieval
    throw new Error('Not implemented');
  }

  /**
   * Confirm scan and create expense
   * User confirms/corrects the scan result and creates an expense
   */
  @Post(':scanId/confirm')
  @RequirePermissions(Permission.EXPENSES_CREATE)
  @ApiOperation({
    summary: 'Confirm scan and create expense',
    description:
      'Confirm the scan result (with optional corrections) and create an expense',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'scanId',
    description: 'Scan ID',
    type: 'string',
  })
  @ApiBody({
    description: 'Corrections and additional data',
    type: ConfirmScanDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Expense created from scan',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        description: { type: 'string' },
        amount: { type: 'number' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Scan not completed or already confirmed',
  })
  @ApiResponse({
    status: 404,
    description: 'Scan not found',
  })
  async confirmScan(
    @Param('orgId') orgId: string,
    @Param('scanId') scanId: string,
    @Body() corrections: ConfirmScanDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    // TODO: Implement scan confirmation and expense creation
    // This will:
    // 1. Merge scan result with user corrections
    // 2. Create expense via ExpensesService
    // 3. Update scan status to CONFIRMED
    // 4. Link scan to created expense
    throw new Error('Not implemented');
  }

  /**
   * Reject scan
   * Reject the scan result without creating an expense
   */
  @Post(':scanId/reject')
  @RequirePermissions(Permission.EXPENSES_CREATE)
  @ApiOperation({
    summary: 'Reject scan',
    description: 'Reject the scan result without creating an expense',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'scanId',
    description: 'Scan ID',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Rejection reason',
          example: 'Poor image quality',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Scan rejected',
  })
  @ApiResponse({
    status: 400,
    description: 'Scan already confirmed or rejected',
  })
  @ApiResponse({
    status: 404,
    description: 'Scan not found',
  })
  async rejectScan(
    @Param('scanId') scanId: string,
    @Body('reason') reason?: string,
  ): Promise<void> {
    // TODO: Implement scan rejection
    throw new Error('Not implemented');
  }

  /**
   * Get scan history
   * List all receipt scans with filtering and pagination
   */
  @Get()
  @RequirePermissions(Permission.EXPENSES_READ)
  @ApiOperation({
    summary: 'Get scan history',
    description: 'List all receipt scans with filters and pagination',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan history retrieved',
    type: PaginatedResult<ReceiptScan>,
  })
  async getScanHistory(
    @Param('orgId') orgId: string,
    @Query() filters: ScanHistoryFiltersDto,
  ): Promise<PaginatedResult<ReceiptScan>> {
    // TODO: Implement scan history retrieval
    throw new Error('Not implemented');
  }

  /**
   * Re-scan a receipt
   * Trigger a new scan on an existing receipt (e.g., after failed scan)
   */
  @Post(':scanId/rescan')
  @RequirePermissions(Permission.EXPENSES_CREATE)
  @ApiOperation({
    summary: 'Re-scan receipt',
    description:
      'Trigger a new OCR scan on an existing receipt (useful after failed scans)',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'scanId',
    description: 'Scan ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Re-scan initiated',
    type: ReceiptScanResult,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot re-scan confirmed or rejected scan',
  })
  @ApiResponse({
    status: 404,
    description: 'Scan not found',
  })
  async rescanReceipt(
    @Param('scanId') scanId: string,
  ): Promise<ReceiptScanResult> {
    // TODO: Implement re-scan
    throw new Error('Not implemented');
  }
}
