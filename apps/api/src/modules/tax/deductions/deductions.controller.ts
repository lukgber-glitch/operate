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
import {
  CommuterCalculatorInput,
  HomeOfficeFlatCalculatorInput,
  HomeOfficeRoomCalculatorInput,
  PerDiemCalculatorInput,
  MileageCalculatorInput,
  TrainingCalculatorInput,
  DeductionResultDto,
} from './dto/calculators';
import {
  CommuterCalculatorService,
  HomeOfficeCalculatorService,
  PerDiemCalculatorService,
  MileageCalculatorService,
  TrainingCalculatorService,
} from './calculators';
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
    private readonly commuterCalc: CommuterCalculatorService,
    private readonly homeOfficeCalc: HomeOfficeCalculatorService,
    private readonly perDiemCalc: PerDiemCalculatorService,
    private readonly mileageCalc: MileageCalculatorService,
    private readonly trainingCalc: TrainingCalculatorService,
  ) {}

  // ========================================
  // Calculator Endpoints
  // ========================================

  /**
   * Calculate commuter allowance deduction
   */
  @Post('calculate/commuter')
  @ApiOperation({
    summary: 'Calculate commuter allowance',
    description:
      'Calculate tax-deductible commuter allowance based on distance and working days',
  })
  @ApiResponse({
    status: 201,
    description: 'Calculation completed successfully',
    type: DeductionResultDto,
  })
  async calculateCommuter(
    @Body() input: CommuterCalculatorInput,
  ): Promise<DeductionResultDto> {
    return this.commuterCalc.calculate(input);
  }

  /**
   * Calculate home office flat rate deduction
   */
  @Post('calculate/home-office-flat')
  @ApiOperation({
    summary: 'Calculate home office flat rate',
    description: 'Calculate home office deduction using flat daily rate method',
  })
  @ApiResponse({
    status: 201,
    description: 'Calculation completed successfully',
    type: DeductionResultDto,
  })
  async calculateHomeOfficeFlat(
    @Body() input: HomeOfficeFlatCalculatorInput,
  ): Promise<DeductionResultDto> {
    return this.homeOfficeCalc.calculateFlat(input);
  }

  /**
   * Calculate home office room-based deduction
   */
  @Post('calculate/home-office-room')
  @ApiOperation({
    summary: 'Calculate home office room deduction',
    description: 'Calculate home office deduction based on actual room costs',
  })
  @ApiResponse({
    status: 201,
    description: 'Calculation completed successfully',
    type: DeductionResultDto,
  })
  async calculateHomeOfficeRoom(
    @Body() input: HomeOfficeRoomCalculatorInput,
  ): Promise<DeductionResultDto> {
    return this.homeOfficeCalc.calculateRoom(input);
  }

  /**
   * Calculate per diem meal allowance
   */
  @Post('calculate/per-diem')
  @ApiOperation({
    summary: 'Calculate per diem allowance',
    description: 'Calculate meal allowance for business trips based on duration',
  })
  @ApiResponse({
    status: 201,
    description: 'Calculation completed successfully',
    type: DeductionResultDto,
  })
  async calculatePerDiem(
    @Body() input: PerDiemCalculatorInput,
  ): Promise<DeductionResultDto> {
    return this.perDiemCalc.calculate(input);
  }

  /**
   * Calculate business mileage deduction
   */
  @Post('calculate/mileage')
  @ApiOperation({
    summary: 'Calculate mileage deduction',
    description: 'Calculate business mileage deduction based on distance and vehicle type',
  })
  @ApiResponse({
    status: 201,
    description: 'Calculation completed successfully',
    type: DeductionResultDto,
  })
  async calculateMileage(
    @Body() input: MileageCalculatorInput,
  ): Promise<DeductionResultDto> {
    return this.mileageCalc.calculate(input);
  }

  /**
   * Calculate training/education deduction
   */
  @Post('calculate/training')
  @ApiOperation({
    summary: 'Calculate training deduction',
    description: 'Calculate deduction for professional training and education expenses',
  })
  @ApiResponse({
    status: 201,
    description: 'Calculation completed successfully',
    type: DeductionResultDto,
  })
  async calculateTraining(
    @Body() input: TrainingCalculatorInput,
  ): Promise<DeductionResultDto> {
    return this.trainingCalc.calculate(input);
  }

  /**
   * Get country-specific tax deduction rates
   */
  @Get('rates/:countryCode')
  @ApiOperation({
    summary: 'Get country rates',
    description: 'Get all tax deduction rates for a specific country',
  })
  @ApiResponse({
    status: 200,
    description: 'Rates retrieved successfully',
  })
  async getCountryRates(@Param('countryCode') countryCode: string) {
    const year = new Date().getFullYear();

    const [commuter, homeOffice, perDiem, mileage, training] = await Promise.all([
      this.commuterCalc.getCountryRates(countryCode, year),
      this.homeOfficeCalc.getCountryRates(countryCode, year),
      this.perDiemCalc.getCountryRates(countryCode, year),
      this.mileageCalc.getCountryRates(countryCode, year),
      this.trainingCalc.getEducationRules(countryCode, year),
    ]);

    return {
      countryCode,
      year,
      commuter,
      homeOffice,
      perDiem,
      mileage,
      training,
    };
  }

  /**
   * Get rates for a specific deduction category
   */
  @Get('rates/:countryCode/:category')
  @ApiOperation({
    summary: 'Get category rates',
    description: 'Get tax deduction rates for a specific category',
  })
  @ApiResponse({
    status: 200,
    description: 'Category rates retrieved successfully',
  })
  async getCategoryRates(
    @Param('countryCode') countryCode: string,
    @Param('category') category: string,
  ) {
    const year = new Date().getFullYear();

    switch (category) {
      case 'commuter':
        return this.commuterCalc.getCountryRates(countryCode, year);
      case 'home-office':
        return this.homeOfficeCalc.getCountryRates(countryCode, year);
      case 'per-diem':
        return this.perDiemCalc.getCountryRates(countryCode, year);
      case 'mileage':
        return this.mileageCalc.getCountryRates(countryCode, year);
      case 'training':
        return this.trainingCalc.getEducationRules(countryCode, year);
      default:
        throw new Error(`Unknown category: ${category}`);
    }
  }

  // ========================================
  // Existing Endpoints (unchanged)
  // ========================================

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
