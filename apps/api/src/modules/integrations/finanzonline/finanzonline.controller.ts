import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanzOnlineService } from './finanzonline.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  FonCredentialsDto,
  FonSessionDto,
  ValidateTaxIdDto,
  TaxIdValidationResultDto,
} from './dto/fon-credentials.dto';
import {
  FonVatReturnDto,
  VatReturnResponseDto,
} from './dto/fon-vat-return.dto';
import {
  FonIncomeTaxDto,
  IncomeTaxResponseDto,
} from './dto/fon-income-tax.dto';
import { FonStatusResponseDto } from './dto/fon-status.dto';
import { validateTaxId } from './utils/fon-auth.util';

/**
 * FinanzOnline Controller
 * Handles HTTP requests for Austrian FinanzOnline integration
 */
@ApiTags('FinanzOnline')
@Controller('integrations/finanzonline')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanzOnlineController {
  constructor(private readonly fonService: FinanzOnlineService) {}

  /**
   * Authenticate with FinanzOnline
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with FinanzOnline',
    description:
      'Authenticate using Austrian tax ID and certificate to obtain a session token',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: FonSessionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials or certificate format',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  @ApiResponse({
    status: 503,
    description: 'FinanzOnline service unavailable',
  })
  async login(
    @Body() credentials: FonCredentialsDto,
  ): Promise<FonSessionDto> {
    return await this.fonService.authenticate(credentials);
  }

  /**
   * Logout from FinanzOnline
   */
  @Delete('auth/logout/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Logout from FinanzOnline',
    description: 'Invalidate the session and logout from FinanzOnline',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID to logout',
    example: 'sess_1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired session',
  })
  async logout(@Param('sessionId') sessionId: string): Promise<void> {
    await this.fonService.logout(sessionId);
  }

  /**
   * Submit VAT return
   */
  @Post('vat-return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit VAT return (Umsatzsteuervoranmeldung)',
    description:
      'Submit a VAT return to Austrian FinanzOnline for a specific period',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT return submitted successfully',
    type: VatReturnResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid submission data',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired session',
  })
  @ApiResponse({
    status: 503,
    description: 'FinanzOnline service unavailable',
  })
  async submitVatReturn(
    @Body() data: FonVatReturnDto,
  ): Promise<VatReturnResponseDto> {
    return await this.fonService.submitVATReturn(data);
  }

  /**
   * Submit income tax return
   */
  @Post('income-tax')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit income tax return (Einkommensteuererklärung)',
    description:
      'Submit an income tax return to Austrian FinanzOnline for a specific tax year',
  })
  @ApiResponse({
    status: 200,
    description: 'Income tax return submitted successfully',
    type: IncomeTaxResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid submission data',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired session',
  })
  @ApiResponse({
    status: 503,
    description: 'FinanzOnline service unavailable',
  })
  async submitIncomeTax(
    @Body() data: FonIncomeTaxDto,
  ): Promise<IncomeTaxResponseDto> {
    return await this.fonService.submitIncomeTax(data);
  }

  /**
   * Get submission status
   */
  @Get('status/:referenceId')
  @ApiOperation({
    summary: 'Get submission status',
    description:
      'Query the status of a previously submitted VAT or income tax return',
  })
  @ApiParam({
    name: 'referenceId',
    description: 'Reference ID from submission response',
    example: 'FON-2025-11-29-ABCD1234',
  })
  @ApiQuery({
    name: 'sessionId',
    description: 'Active session ID',
    required: true,
    example: 'sess_1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    type: FonStatusResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired session',
  })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
  })
  @ApiResponse({
    status: 503,
    description: 'FinanzOnline service unavailable',
  })
  async getStatus(
    @Param('referenceId') referenceId: string,
    @Query('sessionId') sessionId: string,
  ): Promise<FonStatusResponseDto> {
    return await this.fonService.getSubmissionStatus(
      referenceId,
      sessionId,
    );
  }

  /**
   * Validate tax ID format
   */
  @Post('validate/tax-id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate Austrian tax ID format',
    description:
      'Validate that a tax ID (Steuernummer) conforms to Austrian format',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: TaxIdValidationResultDto,
  })
  validateTaxId(
    @Body() data: ValidateTaxIdDto,
  ): TaxIdValidationResultDto {
    const valid = validateTaxId(data.taxId);

    return {
      valid,
      taxId: data.taxId,
      errorMessage: valid
        ? undefined
        : 'Invalid tax ID format. Expected format: XX-YYY/ZZZZ',
    };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if FinanzOnline integration is configured correctly',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  healthCheck(): {
    status: string;
    environment: string;
    timestamp: string;
  } {
    return {
      status: 'ok',
      environment: process.env.FON_ENVIRONMENT || 'sandbox',
      timestamp: new Date().toISOString(),
    };
  }
}
