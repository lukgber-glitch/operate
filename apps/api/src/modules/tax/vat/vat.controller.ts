import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VatService } from './vat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

/**
 * VAT Controller
 * Handles VAT periods, transactions, and returns
 */
@ApiTags('VAT')
@ApiBearerAuth()
@Controller('tax/vat')
@UseGuards(JwtAuthGuard)
export class VatController {
  constructor(private readonly vatService: VatService) {}

  /**
   * Get VAT periods
   */
  @Get('periods')
  @ApiOperation({
    summary: 'Get VAT periods',
    description: 'Get VAT reporting periods with optional year filter',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT periods retrieved successfully',
  })
  async getVatPeriods(
    @CurrentUser() user: { id: string; orgId: string },
    @Query('year') year?: string,
  ) {
    const orgId = user.orgId;
    return this.vatService.getVatPeriods(orgId, year);
  }

  /**
   * Get current VAT period
   */
  @Get('periods/current')
  @ApiOperation({
    summary: 'Get current VAT period',
    description: 'Get the currently active VAT period',
  })
  @ApiResponse({
    status: 200,
    description: 'Current VAT period retrieved successfully',
  })
  async getCurrentVatPeriod(@CurrentUser() user: { id: string; orgId: string }) {
    const orgId = user.orgId;
    return this.vatService.getCurrentVatPeriod(orgId);
  }

  /**
   * Get VAT period by ID
   */
  @Get('periods/:id')
  @ApiOperation({
    summary: 'Get VAT period by ID',
    description: 'Get a specific VAT period by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT period retrieved successfully',
  })
  async getVatPeriodById(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
  ) {
    const orgId = user.orgId;
    return this.vatService.getVatPeriodById(orgId, id);
  }

  /**
   * Get VAT transactions for a period
   */
  @Get('periods/:id/transactions')
  @ApiOperation({
    summary: 'Get VAT transactions',
    description: 'Get all VAT transactions for a specific period',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT transactions retrieved successfully',
  })
  async getVatTransactions(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') periodId: string,
  ) {
    const orgId = user.orgId;
    return this.vatService.getVatTransactions(orgId, periodId);
  }

  /**
   * File VAT return
   */
  @Post('periods/:id/file')
  @ApiOperation({
    summary: 'File VAT return',
    description: 'Submit VAT return for a specific period',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT return filed successfully',
  })
  async fileVatReturn(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') periodId: string,
  ) {
    const orgId = user.orgId;
    const userId = user.id;
    return this.vatService.fileVatReturn(orgId, periodId, userId);
  }
}
