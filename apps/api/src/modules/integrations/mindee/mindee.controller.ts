import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MindeeService } from './mindee.service';
import { ReceiptParseResultDto, MindeeHealthDto } from './dto/mindee.dto';

/**
 * Mindee Receipt OCR Controller
 * Endpoints for receipt parsing
 */
@ApiTags('Integrations - Mindee')
@ApiBearerAuth()
@Controller('integrations/mindee')
export class MindeeController {
  constructor(private readonly mindeeService: MindeeService) {}

  /**
   * Parse receipt synchronously
   */
  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Parse receipt (sync)',
    description: 'Upload and parse a receipt image or PDF synchronously',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Receipt image or PDF file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt parsed successfully',
    type: ReceiptParseResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file type',
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
  })
  async parseReceipt(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ReceiptParseResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.mindeeService.parseReceipt(file.buffer, file.mimetype);
  }

  /**
   * Parse receipt asynchronously (for larger files)
   */
  @Post('parse/async')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Parse receipt (async)',
    description:
      'Upload a receipt for asynchronous parsing. Returns a job ID for polling.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Receipt image or PDF file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Receipt submitted for parsing',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', example: 'pending' },
      },
    },
  })
  async parseReceiptAsync(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ jobId: string; status: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const jobId = await this.mindeeService.parseReceiptAsync(
      file.buffer,
      file.mimetype,
    );

    return {
      jobId,
      status: 'pending',
    };
  }

  /**
   * Get async parsing result
   */
  @Get('parse/async/:jobId')
  @ApiOperation({
    summary: 'Get async parse result',
    description: 'Retrieve the result of an async parsing job',
  })
  @ApiResponse({
    status: 200,
    description: 'Parse result retrieved',
    type: ReceiptParseResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getParseResult(
    @Param('jobId') jobId: string,
  ): Promise<ReceiptParseResultDto> {
    return this.mindeeService.getParseResult(jobId);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check Mindee API connection status',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check result',
    type: MindeeHealthDto,
  })
  async healthCheck(): Promise<MindeeHealthDto> {
    return this.mindeeService.checkConnection();
  }
}
