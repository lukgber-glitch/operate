import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AvalaraService } from './avalara.service';
import {
  CalculateTaxDto,
  TaxCalculationResponseDto,
  CommitTransactionDto,
  CommitTransactionResponseDto,
  VoidTransactionDto,
  VoidTransactionResponseDto,
  ValidateAddressDto,
  ValidateAddressResponseDto,
} from './dto';

/**
 * Avalara AvaTax Controller
 * Provides endpoints for US sales tax calculations
 */
@ApiTags('Avalara Tax')
@Controller({ path: 'avalara', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AvalaraController {
  constructor(private readonly avalaraService: AvalaraService) {}

  /**
   * Calculate sales tax for a transaction
   */
  @Post('calculate-tax')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate US sales tax',
    description:
      'Calculates sales tax for a transaction using Avalara AvaTax. Handles multi-jurisdiction taxes (state + county + city + special districts).',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax calculation result',
    type: TaxCalculationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 503,
    description: 'Avalara service unavailable',
  })
  async calculateTax(
    @Body() dto: CalculateTaxDto,
  ): Promise<TaxCalculationResponseDto> {
    return this.avalaraService.calculateTax(dto);
  }

  /**
   * Commit a transaction
   */
  @Post('commit-transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Commit a tax transaction',
    description:
      'Commits a transaction to finalize tax liability. Once committed, the transaction appears on tax returns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction committed successfully',
    type: CommitTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction code or already committed',
  })
  async commitTransaction(
    @Body() dto: CommitTransactionDto,
  ): Promise<CommitTransactionResponseDto> {
    return this.avalaraService.commitTransaction(dto);
  }

  /**
   * Void a transaction
   */
  @Post('void-transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void a tax transaction',
    description:
      'Voids a previously committed transaction. Use this to cancel incorrect or duplicate transactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction voided successfully',
    type: VoidTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction code or cannot be voided',
  })
  async voidTransaction(
    @Body() dto: VoidTransactionDto,
  ): Promise<VoidTransactionResponseDto> {
    return this.avalaraService.voidTransaction(dto);
  }

  /**
   * Validate and normalize a US address
   */
  @Post('validate-address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate US address',
    description:
      'Validates and normalizes a US address for accurate tax calculations. Returns standardized address and tax jurisdiction information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Address validation result',
    type: ValidateAddressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format',
  })
  async validateAddress(
    @Body() dto: ValidateAddressDto,
  ): Promise<ValidateAddressResponseDto> {
    return this.avalaraService.validateAddress(dto);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Avalara service health check',
    description: 'Checks if the Avalara AvaTax integration is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck(): Promise<{ status: string; environment: string }> {
    return this.avalaraService.healthCheck();
  }
}
