import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ElsterService } from './elster.service';
import {
  VATReturnDto,
  VATReturnResponseDto,
  VATReturnStatusDto,
} from './dto/vat-return.dto';
import {
  IncomeTaxReturnDto,
  IncomeTaxReturnResponseDto,
} from './dto/income-tax-return.dto';
import {
  EmployeeTaxDto,
  EmployeeTaxResponseDto,
} from './dto/employee-tax.dto';
import { ElsterResponse } from './interfaces/elster-response.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * ELSTER Controller
 * Handles HTTP endpoints for German tax filing via ELSTER
 */
@ApiTags('ELSTER Integration')
@Controller('integrations/elster')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ElsterController {
  private readonly logger = new Logger(ElsterController.name);

  constructor(private readonly elsterService: ElsterService) {}

  /**
   * Submit VAT return (Umsatzsteuervoranmeldung)
   */
  @Post('vat-return')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Submit VAT return',
    description:
      'Submit Umsatzsteuervoranmeldung (UStVA) to ELSTER',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'VAT return submitted successfully',
    type: VATReturnResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid VAT return data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing certificate',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'ELSTER service unavailable',
  })
  async submitVATReturn(
    @Body() vatReturnDto: VATReturnDto,
  ): Promise<VATReturnResponseDto> {
    this.logger.log(
      `VAT return submission request for org ${vatReturnDto.organizationId}`,
    );

    const response = await this.elsterService.submitVATReturn(
      vatReturnDto,
    );

    return this.mapToVATReturnResponse(response);
  }

  /**
   * Submit income tax return (Einkommensteuererklärung)
   */
  @Post('income-tax-return')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Submit income tax return',
    description:
      'Submit Einkommensteuererklärung (ESt) to ELSTER',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Income tax return submitted successfully',
    type: IncomeTaxReturnResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid income tax return data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing certificate',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'ELSTER service unavailable',
  })
  async submitIncomeTaxReturn(
    @Body() incomeTaxDto: IncomeTaxReturnDto,
  ): Promise<IncomeTaxReturnResponseDto> {
    this.logger.log(
      `Income tax return submission request for org ${incomeTaxDto.organizationId}`,
    );

    const response = await this.elsterService.submitIncomeTaxReturn(
      incomeTaxDto,
    );

    return this.mapToIncomeTaxResponse(response);
  }

  /**
   * Submit employee tax (Lohnsteueranmeldung)
   */
  @Post('employee-tax')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Submit employee tax',
    description: 'Submit Lohnsteueranmeldung to ELSTER',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Employee tax submitted successfully',
    type: EmployeeTaxResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid employee tax data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing certificate',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'ELSTER service unavailable',
  })
  async submitEmployeeTax(
    @Body() employeeTaxDto: EmployeeTaxDto,
  ): Promise<EmployeeTaxResponseDto> {
    this.logger.log(
      `Employee tax submission request for org ${employeeTaxDto.organizationId}`,
    );

    const response = await this.elsterService.submitEmployeeTax(
      employeeTaxDto,
    );

    return this.mapToEmployeeTaxResponse(response);
  }

  /**
   * Check submission status
   */
  @Get('status/:transferTicket')
  @ApiOperation({
    summary: 'Check submission status',
    description:
      'Check the processing status of a submitted tax return',
  })
  @ApiParam({
    name: 'transferTicket',
    description: 'Transfer ticket ID from submission response',
    example: 'OPERATE-1234567890-123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission status retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transfer ticket not found',
  })
  async getSubmissionStatus(@Param('transferTicket') transferTicket: string) {
    this.logger.log(`Status check for ticket ${transferTicket}`);

    return await this.elsterService.checkSubmissionStatus(
      transferTicket,
    );
  }

  /**
   * Validate VAT return data (without submitting)
   */
  @Post('vat-return/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate VAT return',
    description:
      'Validate VAT return data without submitting to ELSTER',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed',
  })
  async validateVATReturn(@Body() vatReturnDto: VATReturnDto) {
    this.logger.log(
      `VAT return validation for org ${vatReturnDto.organizationId}`,
    );

    // Perform local validation
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if VAT calculations are correct
    const calculatedVat19 = vatReturnDto.taxableSales19 * 0.19;
    const calculatedVat7 = vatReturnDto.taxableSales7 * 0.07;

    if (Math.abs(calculatedVat19 - vatReturnDto.vat19) > 0.01) {
      errors.push(
        `VAT at 19% calculation mismatch. Expected: ${calculatedVat19.toFixed(2)}, Got: ${vatReturnDto.vat19}`,
      );
    }

    if (Math.abs(calculatedVat7 - vatReturnDto.vat7) > 0.01) {
      errors.push(
        `VAT at 7% calculation mismatch. Expected: ${calculatedVat7.toFixed(2)}, Got: ${vatReturnDto.vat7}`,
      );
    }

    // Check total VAT calculation
    const totalOutputVat =
      vatReturnDto.vat19 +
      vatReturnDto.vat7 +
      (vatReturnDto.vatIntraCommunity || 0);
    const expectedTotalVat =
      totalOutputVat - vatReturnDto.inputTaxDeduction;

    if (Math.abs(expectedTotalVat - vatReturnDto.totalVat) > 0.01) {
      errors.push(
        `Total VAT calculation mismatch. Expected: ${expectedTotalVat.toFixed(2)}, Got: ${vatReturnDto.totalVat}`,
      );
    }

    // Warnings
    if (vatReturnDto.totalVat < 0) {
      warnings.push('Negative total VAT indicates a refund');
    }

    if (vatReturnDto.inputTaxDeduction > totalOutputVat * 2) {
      warnings.push(
        'Input tax deduction is unusually high compared to output VAT',
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalsMatch: Math.abs(expectedTotalVat - vatReturnDto.totalVat) <= 0.01,
      expectedTotalVat,
    };
  }

  /**
   * Test ELSTER connection
   */
  @Get('test-connection/:organizationId')
  @ApiOperation({
    summary: 'Test ELSTER connection',
    description:
      'Test ELSTER connection and certificate for an organization',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test successful',
  })
  async testConnection(@Param('organizationId') organizationId: string) {
    this.logger.log(
      `Testing ELSTER connection for org ${organizationId}`,
    );

    try {
      const certificate = await this.elsterService.loadCertificate(
        organizationId,
      );

      return {
        success: true,
        message: 'ELSTER connection and certificate valid',
        certificate: {
          subject: certificate.subject,
          issuer: certificate.issuer,
          validFrom: certificate.validFrom,
          validUntil: certificate.validUntil,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * Get supported submission types
   */
  @Get('submission-types')
  @ApiOperation({
    summary: 'Get supported submission types',
    description: 'List all supported ELSTER submission types',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission types retrieved',
  })
  getSubmissionTypes() {
    return [
      {
        type: 'UStVA',
        name: 'Umsatzsteuervoranmeldung',
        description: 'VAT return (quarterly or monthly)',
        endpoint: '/integrations/elster/vat-return',
      },
      {
        type: 'ESt',
        name: 'Einkommensteuererklärung',
        description: 'Income tax return (annual)',
        endpoint: '/integrations/elster/income-tax-return',
      },
      {
        type: 'Lohn',
        name: 'Lohnsteueranmeldung',
        description: 'Employee tax reporting (monthly)',
        endpoint: '/integrations/elster/employee-tax',
      },
    ];
  }

  /**
   * Map ElsterResponse to VATReturnResponseDto
   */
  private mapToVATReturnResponse(
    response: ElsterResponse,
  ): VATReturnResponseDto {
    return {
      success: response.status === 'ACCEPTED' || response.status === 'SUCCESS',
      transferTicket: response.transferTicket,
      dataTransferNumber: response.dataTransferNumber,
      timestamp: response.timestamp,
      status: response.status,
      message: response.serverResponseMessage,
      errors: response.errors.map((e) => ({
        code: e.code,
        message: e.message,
        severity: e.severity,
      })),
      warnings: response.warnings.map((w) => ({
        code: w.code,
        message: w.message,
        severity: w.severity,
      })),
    };
  }

  /**
   * Map ElsterResponse to IncomeTaxReturnResponseDto
   */
  private mapToIncomeTaxResponse(
    response: ElsterResponse,
  ): IncomeTaxReturnResponseDto {
    return {
      success: response.status === 'ACCEPTED' || response.status === 'SUCCESS',
      transferTicket: response.transferTicket,
      dataTransferNumber: response.dataTransferNumber,
      timestamp: response.timestamp,
      status: response.status,
      message: response.serverResponseMessage,
      errors: response.errors.map((e) => ({
        code: e.code,
        message: e.message,
        severity: e.severity,
      })),
      warnings: response.warnings.map((w) => ({
        code: w.code,
        message: w.message,
        severity: w.severity,
      })),
    };
  }

  /**
   * Map ElsterResponse to EmployeeTaxResponseDto
   */
  private mapToEmployeeTaxResponse(
    response: ElsterResponse,
  ): EmployeeTaxResponseDto {
    return {
      success: response.status === 'ACCEPTED' || response.status === 'SUCCESS',
      transferTicket: response.transferTicket,
      dataTransferNumber: response.dataTransferNumber,
      timestamp: response.timestamp,
      status: response.status,
      message: response.serverResponseMessage,
      errors: response.errors.map((e) => ({
        code: e.code,
        message: e.message,
        severity: e.severity,
      })),
      warnings: response.warnings.map((w) => ({
        code: w.code,
        message: w.message,
        severity: w.severity,
      })),
    };
  }
}
