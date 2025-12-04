import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SvMeldungService } from './sv-meldung.service';
import { SvAnmeldungDto } from './dto/sv-anmeldung.dto';
import { SvAbmeldungDto } from './dto/sv-abmeldung.dto';
import { SvAenderungDto } from './dto/sv-aenderung.dto';
import {
  SvResponseDto,
  DeuevPreviewDto,
  BatchSvResponseDto,
  CachedSubmissionDto,
} from './dto/sv-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * SV-Meldung Controller
 * Handles German social security reporting endpoints
 */
@ApiTags('SV-Meldung')
@Controller('integrations/sv-meldung')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SvMeldungController {
  constructor(private readonly svMeldungService: SvMeldungService) {}

  /**
   * Create Anmeldung (Employee Registration)
   */
  @Post('anmeldung')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create SV-Anmeldung (Employee Registration)',
    description:
      'Register a new employee with social security authorities (Sozialversicherung)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Anmeldung created successfully',
    type: SvResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createAnmeldung(
    @Body() data: SvAnmeldungDto,
  ): Promise<SvResponseDto> {
    return await this.svMeldungService.createAnmeldung(data);
  }

  /**
   * Create Abmeldung (Employee Deregistration)
   */
  @Post('abmeldung')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create SV-Abmeldung (Employee Deregistration)',
    description:
      'Deregister an employee from social security (employment end)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Abmeldung created successfully',
    type: SvResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createAbmeldung(
    @Body() data: SvAbmeldungDto,
  ): Promise<SvResponseDto> {
    return await this.svMeldungService.createAbmeldung(data);
  }

  /**
   * Create Änderung (Change Notification)
   */
  @Post('aenderung')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create SV-Änderung (Change Notification)',
    description:
      'Notify social security of employment changes (salary, contribution groups, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Änderung created successfully',
    type: SvResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createAenderung(
    @Body() data: SvAenderungDto,
  ): Promise<SvResponseDto> {
    return await this.svMeldungService.createAenderung(data);
  }

  /**
   * Preview DEÜV message
   */
  @Post('preview/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview DEÜV message',
    description:
      'Generate DEÜV message without submitting (for validation/testing)',
  })
  @ApiParam({
    name: 'type',
    enum: ['anmeldung', 'abmeldung', 'aenderung'],
    description: 'Message type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'DEÜV message preview',
    type: DeuevPreviewDto,
  })
  async previewDeuev(
    @Param('type') type: string,
    @Body() data: SvAnmeldungDto | SvAbmeldungDto | SvAenderungDto,
  ): Promise<DeuevPreviewDto> {
    const messageType = type.toUpperCase() as
      | 'ANMELDUNG'
      | 'ABMELDUNG'
      | 'AENDERUNG';

    const deuevMessage = await this.svMeldungService.generateDeuevMessage(
      messageType,
      data,
    );

    return {
      messageType,
      deuevMessage,
      messageSize: Buffer.byteLength(deuevMessage, 'utf-8'),
      recordCount: deuevMessage.split('\n').length,
      isValid: true,
      generatedAt: new Date(),
    };
  }

  /**
   * Get submission status
   */
  @Get('submission/:submissionId')
  @ApiOperation({
    summary: 'Get submission status',
    description: 'Retrieve the status of a specific submission',
  })
  @ApiParam({
    name: 'submissionId',
    description: 'Submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission details',
    type: SvResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Submission not found',
  })
  async getSubmissionStatus(
    @Param('submissionId') submissionId: string,
  ): Promise<SvResponseDto> {
    const submission = await this.svMeldungService.getSubmissionStatus(
      submissionId,
    );

    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission;
  }

  /**
   * Get employee submissions
   */
  @Get('employee/:employeeId/submissions')
  @ApiOperation({
    summary: 'Get employee submissions',
    description: 'Retrieve all SV submissions for a specific employee',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of employee submissions',
    type: [CachedSubmissionDto],
  })
  async getEmployeeSubmissions(
    @Param('employeeId') employeeId: string,
  ): Promise<CachedSubmissionDto[]> {
    return await this.svMeldungService.getEmployeeSubmissions(
      employeeId,
    );
  }

  /**
   * Process carrier response
   */
  @Post('response/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process carrier response',
    description:
      'Process a response received from a social security carrier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Response processed',
    type: SvResponseDto,
  })
  async processCarrierResponse(
    @Body('response') response: string,
  ): Promise<SvResponseDto> {
    return await this.svMeldungService.processCarrierResponse(
      response,
    );
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if SV-Meldung service is operational',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
