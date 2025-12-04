import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CraService } from './cra.service';
import {
  ConnectCraDto,
  SubmitGstHstReturnDto,
  ValidateReturnDto,
  CheckFilingStatusDto,
  GetFilingHistoryDto,
} from './dto/cra.dto';

/**
 * CRA NetFile Integration Controller
 *
 * Endpoints for Canadian tax filing via CRA NetFile API
 */
@ApiTags('CRA')
@Controller('integrations/cra')
@ApiBearerAuth()
export class CraController {
  constructor(private readonly craService: CraService) {}

  /**
   * Connect organization to CRA
   */
  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect organization to CRA NetFile' })
  @ApiResponse({
    status: 200,
    description: 'Successfully connected to CRA',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async connect(@Body() connectDto: ConnectCraDto) {
    return this.craService.connect(
      connectDto.organizationId,
      connectDto.businessNumber,
      connectDto.webAccessCode,
    );
  }

  /**
   * Disconnect organization from CRA
   */
  @Post(':organizationId/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect organization from CRA' })
  @ApiResponse({
    status: 200,
    description: 'Successfully disconnected from CRA',
  })
  async disconnect(@Param('organizationId') organizationId: string) {
    return this.craService.disconnect(organizationId);
  }

  /**
   * Get CRA connection status
   */
  @Get(':organizationId/connection')
  @ApiOperation({ summary: 'Get CRA connection status' })
  @ApiResponse({
    status: 200,
    description: 'Connection info retrieved',
  })
  async getConnection(@Param('organizationId') organizationId: string) {
    return this.craService.getConnectionInfo(organizationId);
  }

  /**
   * Validate GST/HST return
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate GST/HST return before submission' })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async validateReturn(@Body() validateDto: ValidateReturnDto) {
    return this.craService.validateReturn(
      validateDto.organizationId,
      validateDto.returnData,
    );
  }

  /**
   * Submit GST/HST return
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit GST/HST return to CRA' })
  @ApiResponse({
    status: 201,
    description: 'Return submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Submission failed - validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate submission',
  })
  async submitReturn(@Body() submitDto: SubmitGstHstReturnDto) {
    return this.craService.submitReturn({
      organizationId: submitDto.organizationId,
      gstHstReturn: submitDto.gstHstReturn,
      transmitterInfo: submitDto.transmitterInfo,
    });
  }

  /**
   * Check filing status
   */
  @Post('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check filing status by confirmation number' })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved',
  })
  async checkStatus(@Body() statusDto: CheckFilingStatusDto) {
    return this.craService.checkStatus(
      statusDto.organizationId,
      statusDto.confirmationNumber,
    );
  }

  /**
   * Get filing history
   */
  @Get(':organizationId/filings')
  @ApiOperation({ summary: 'Get filing history for organization' })
  @ApiResponse({
    status: 200,
    description: 'Filing history retrieved',
  })
  async getFilingHistory(
    @Param('organizationId') organizationId: string,
    @Query() query: GetFilingHistoryDto,
  ) {
    return this.craService.getFilingHistory(organizationId, {
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit,
    });
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'CRA integration health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'CRA NetFile Integration',
      timestamp: new Date().toISOString(),
    };
  }
}
