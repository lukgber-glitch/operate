import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
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
import { DeductionsService } from './deductions.service';
import { DeductionAnalyzerService } from './deduction-analyzer.service';
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
import {
  AnalyzeExpensesDto,
  DeductionCategoryDto,
  ApplyDeductionDto,
} from './dto/index';
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
  constructor(
    private readonly deductionsService: DeductionsService,
    private readonly analyzerService: DeductionAnalyzerService,
  ) {}

  /**
   * Get all deductions (suggestions and confirmed)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all deductions',
    description: 'Get all tax deductions with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Deductions retrieved successfully',
    type: DeductionListResponseDto,
  })
  async getDeductions(
    @CurrentUser() user: { id: string; orgId: string },
    @Query() filters: SuggestionFiltersDto,
  ): Promise<DeductionListResponseDto> {
    const orgId = user.orgId;
    return this.deductionsService.getSuggestions(orgId, filters);
  }

  /**
   * Get AI-suggested deductions
   */
  @Get('suggestions')
  @ApiOperation({
    summary: 'Get AI-suggested deductions',
    description: 'Get AI-powered tax deduction suggestions with optional filters',
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
   * Get deduction categories
   */
  @Get('categories')
  @ApiOperation({
    summary: 'List deduction categories',
    description: 'Get all available German tax deduction categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [DeductionCategoryDto],
  })
  async getCategories(): Promise<DeductionCategoryDto[]> {
    return this.analyzerService.getDeductionCategories();
  }

  /**
   * Analyze expenses for deductions using AI
   */
  @Post('analyze')
  @ApiOperation({
    summary: 'Analyze expenses for deductions',
    description: 'Use Claude AI to analyze expenses and suggest optimal tax deductions',
  })
  @ApiResponse({
    status: 201,
    description: 'Expenses analyzed successfully',
  })
  async analyzeExpenses(
    @CurrentUser() user: { id: string; orgId: string },
    @Body() dto: AnalyzeExpensesDto,
  ) {
    const orgId = user.orgId;

    return this.analyzerService.analyzeExpensesByIds(
      orgId,
      dto.expenseIds,
      dto.taxBracket || 42,
    );
  }

  /**
   * Get deduction summary by category
   */
  @Get('summary/:year')
  @ApiOperation({
    summary: 'Get deduction summary',
    description: 'Get summary of all deductions for a specific tax year',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
    type: DeductionSummaryDto,
  })
  async getDeductionSummary(
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

  /**
   * Confirm a deduction
   */
  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirm deduction',
    description: 'User confirms a deduction',
  })
  @ApiResponse({
    status: 200,
    description: 'Deduction confirmed successfully',
    type: DeductionSuggestionDto,
  })
  async confirmDeduction(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto?: ConfirmDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.confirmSuggestion(orgId, id, userId, dto);
  }

  /**
   * Reject a deduction
   */
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject deduction',
    description: 'User rejects a deduction with a reason',
  })
  @ApiResponse({
    status: 200,
    description: 'Deduction rejected successfully',
    type: DeductionSuggestionDto,
  })
  async rejectDeduction(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: RejectDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.rejectSuggestion(orgId, id, userId, dto);
  }

  /**
   * Apply a suggested deduction
   */
  @Post(':id/apply')
  @ApiOperation({
    summary: 'Apply suggested deduction',
    description: 'User applies/confirms a deduction suggestion',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion applied successfully',
    type: DeductionSuggestionDto,
  })
  async applyDeduction(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto?: ApplyDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.confirmSuggestion(orgId, id, userId, dto);
  }

  /**
   * Dismiss a suggested deduction
   */
  @Post(':id/dismiss')
  @ApiOperation({
    summary: 'Dismiss deduction suggestion',
    description: 'User dismisses/rejects a deduction suggestion with a reason',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion dismissed successfully',
    type: DeductionSuggestionDto,
  })
  async dismissDeduction(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: RejectDeductionDto,
  ): Promise<DeductionSuggestionDto> {
    const orgId = user.orgId;
    const userId = user.id;

    return this.deductionsService.rejectSuggestion(orgId, id, userId, dto);
  }

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
}
