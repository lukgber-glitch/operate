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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ViesService } from './vies.service';
import {
  ValidateVatDto,
  BulkValidateVatDto,
  ValidateVatQueryDto,
} from './dto/validate-vat.dto';
import {
  VatValidationResultDto,
  BulkVatValidationResultDto,
  CrossBorderRulesDto,
} from './dto/vat-validation-result.dto';

/**
 * VIES VAT Validation Controller
 * Provides endpoints for EU VAT number validation
 */
@ApiTags('VAT Validation')
@Controller({ path: 'vat', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ViesController {
  constructor(private readonly viesService: ViesService) {}

  /**
   * Validate a single VAT number (POST)
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate VAT number',
    description:
      'Validates an EU VAT number using the VIES service. Results are cached for 24 hours.',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT validation result',
    type: VatValidationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid VAT number format or non-EU country',
  })
  @ApiResponse({
    status: 503,
    description: 'VIES service unavailable',
  })
  async validateVat(
    @Body() dto: ValidateVatDto,
  ): Promise<VatValidationResultDto> {
    return this.viesService.validateVat(
      dto.vatNumber,
      dto.countryCode,
      false,
    );
  }

  /**
   * Validate a single VAT number (GET)
   */
  @Get('validate/:vatNumber')
  @ApiOperation({
    summary: 'Validate VAT number (GET)',
    description:
      'Validates an EU VAT number using the VIES service via GET request for simple lookups.',
  })
  @ApiParam({
    name: 'vatNumber',
    description: 'VAT number to validate (e.g., DE123456789)',
    example: 'DE123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT validation result',
    type: VatValidationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid VAT number format or non-EU country',
  })
  @ApiResponse({
    status: 503,
    description: 'VIES service unavailable',
  })
  async validateVatGet(
    @Param('vatNumber') vatNumber: string,
    @Query() query: ValidateVatQueryDto,
  ): Promise<VatValidationResultDto> {
    return this.viesService.validateVat(
      vatNumber,
      undefined,
      query.skipCache,
    );
  }

  /**
   * Validate multiple VAT numbers
   */
  @Post('validate/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate multiple VAT numbers',
    description:
      'Validates multiple EU VAT numbers in a single request. Maximum 10 VAT numbers per request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk validation results',
    type: BulkVatValidationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (too many VAT numbers or invalid format)',
  })
  async validateBulk(
    @Body() dto: BulkValidateVatDto,
  ): Promise<BulkVatValidationResultDto> {
    return this.viesService.validateBulk(dto.vatNumbers);
  }

  /**
   * Get cross-border transaction rules
   */
  @Post('cross-border-rules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cross-border transaction rules',
    description:
      'Determines applicable VAT rules for cross-border transactions based on supplier and customer countries.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cross-border transaction rules',
    type: CrossBorderRulesDto,
  })
  async getCrossBorderRules(
    @Body()
    body: {
      supplierCountry: string;
      customerCountry: string;
      customerVatNumber?: string;
    },
  ): Promise<CrossBorderRulesDto> {
    let customerVatValid = false;

    // If customer VAT number is provided, validate it
    if (body.customerVatNumber) {
      const validation = await this.viesService.validateVat(
        body.customerVatNumber,
        body.customerCountry,
      );
      customerVatValid = validation.valid;
    }

    return this.viesService.getCrossBorderRules(
      body.supplierCountry,
      body.customerCountry,
      customerVatValid,
    );
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'VIES service health check',
    description: 'Checks if the VIES integration is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
