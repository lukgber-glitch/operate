import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DeductionsService } from './deductions.service';
import {
  GenerateSuggestionsDto,
  SuggestionFiltersDto,
  DeductionSuggestionDto,
} from './dto/deduction-suggestion.dto';
import {
  ConfirmDeductionDto,
  RejectDeductionDto,
  ModifyDeductionDto,
} from './dto/confirm-deduction.dto';
import {
  DeductionSummaryDto,
  DeductionListResponseDto,
} from './dto/deduction-summary.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

/**
 * Tax Deductions Controller
 * Handles deduction suggestion generation and user confirmation workflow
 */
@ApiTags('Tax Deductions')
@ApiBearerAuth()
@Controller('tax/deductions')
@UseGuards(JwtAuthGuard)
export class DeductionsController {
  constructor(private readonly deductionsService: DeductionsService) {}

  /**
   * Generate deduction suggestions for transactions
   */
  @Post('suggest')
  @ApiOperation({
    summary: 'Generate deduction suggestions',
    description:
      'Analyzes classified transactions and generates tax deduction suggestions based on country-specific rules',
  })
  @ApiResponse({
    status: 201,
    description: 'Suggestions generated successfully',
    type: [DeductionSuggestionDto],
  })
  async generateSuggestions(
    @CurrentUser() user: { id: string; orgId: string },
    @Body() dto: GenerateSuggestionsDto,
  ): Promise<DeductionSuggestionDto[]> {
    const orgId = user.orgId;

    return this.deductionsService.generateSuggestions(orgId, dto);
  }

  /**
   * Get deduction suggestions with filters
   */
  @Get('suggestions')
  @ApiOperation({
    summary: 'List deduction suggestions',
    description: 'Get deduction suggestions with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions retrieved successfully',
    type: DeductionListResponseDto,
  })
  async getSuggestions(
    @CurrentUser() user: { id: string; orgId: string },
    @Query() filters: SuggestionFiltersDto,
  ): Promise<DeductionListResponseDto> {
    const orgId = user.orgId;

    return this.deductionsService.getSuggestions(orgId, filters);
  }

  /**
   * Confirm a deduction suggestion
   */
  @Post('suggestions/:id/confirm')
  @ApiOperation({
    summary: 'Confirm deduction suggestion',
    description: 'User confirms a deduction suggestion, optionally modifying the amount',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion confirmed successfully',
    type: DeductionSuggestionDto,
  })
  async confirmSuggestion(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto?: ConfirmDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.confirmSuggestion(orgId, id, userId, dto);
  }

  /**
   * Reject a deduction suggestion
   */
  @Post('suggestions/:id/reject')
  @ApiOperation({
    summary: 'Reject deduction suggestion',
    description: 'User rejects a deduction suggestion with a reason',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion rejected successfully',
    type: DeductionSuggestionDto,
  })
  async rejectSuggestion(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: RejectDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.rejectSuggestion(orgId, id, userId, dto);
  }

  /**
   * Modify a deduction suggestion
   */
  @Patch('suggestions/:id')
  @ApiOperation({
    summary: 'Modify deduction suggestion',
    description: 'User modifies a deduction suggestion (amount, category, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion modified successfully',
    type: DeductionSuggestionDto,
  })
  async modifySuggestion(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: ModifyDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.modifySuggestion(orgId, id, userId, dto);
  }

  /**
   * Get annual deduction summary
   */
  @Get('summary/:year')
  @ApiOperation({
    summary: 'Get annual deduction summary',
    description: 'Get summary of all deductions for a specific tax year',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
    type: DeductionSummaryDto,
  })
  async getAnnualSummary(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('year') year: string,
    @Query('countryCode') countryCode?: string,
  ): Promise<DeductionSummaryDto> {
    const orgId = user.orgId;
    const taxYear = parseInt(year, 10);

    return this.deductionsService.getAnnualSummary(
      orgId,
      taxYear,
      countryCode || 'DE',
    );
  }
}
