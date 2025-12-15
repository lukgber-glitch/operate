import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaxAssistantService } from './tax-assistant.service';
import { TaxSuggestionFiltersDto } from './dto';

@ApiTags('tax-assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organisations/:orgId/tax-assistant')
export class TaxAssistantController {
  constructor(private readonly taxAssistantService: TaxAssistantService) {}

  // ============================================================================
  // SUGGESTION ENDPOINTS
  // ============================================================================

  @Get('suggestions')
  @ApiOperation({ summary: 'Get tax suggestions' })
  @ApiResponse({ status: 200, description: 'Returns tax suggestions' })
  async getSuggestions(
    @Param('orgId') organisationId: string,
    @Query() filters?: TaxSuggestionFiltersDto,
  ) {
    return this.taxAssistantService.getSuggestions(organisationId, filters);
  }

  @Get('suggestions/summary')
  @ApiOperation({ summary: 'Get suggestion summary with potential savings' })
  @ApiResponse({ status: 200, description: 'Returns summary of potential tax savings' })
  async getSuggestionSummary(@Param('orgId') organisationId: string) {
    return this.taxAssistantService.getSuggestionSummary(organisationId);
  }

  @Post('suggestions/:id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a tax suggestion' })
  @ApiResponse({ status: 200, description: 'Suggestion dismissed' })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  async dismissSuggestion(
    @Param('id') id: string,
    @Param('orgId') organisationId: string,
  ) {
    return this.taxAssistantService.dismissSuggestion(id, organisationId);
  }

  @Post('suggestions/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark suggestion as complete' })
  @ApiResponse({ status: 200, description: 'Suggestion marked as complete' })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  async completeSuggestion(
    @Param('id') id: string,
    @Param('orgId') organisationId: string,
  ) {
    return this.taxAssistantService.completeSuggestion(id, organisationId);
  }

  // ============================================================================
  // DEADLINE ENDPOINTS
  // ============================================================================

  @Get('deadlines')
  @ApiOperation({ summary: 'Get all tax deadlines' })
  @ApiResponse({ status: 200, description: 'Returns tax deadlines' })
  async getDeadlines(@Param('orgId') organisationId: string) {
    return this.taxAssistantService.getUpcomingDeadlines(organisationId, 365); // Next year
  }

  @Get('deadlines/upcoming')
  @ApiOperation({ summary: 'Get upcoming tax deadlines (next 30 days)' })
  @ApiResponse({ status: 200, description: 'Returns upcoming tax deadlines' })
  async getUpcomingDeadlines(
    @Param('orgId') organisationId: string,
    @Query('days') days?: string,
  ) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.taxAssistantService.getUpcomingDeadlines(organisationId, daysAhead);
  }

  @Get('deadlines/overdue')
  @ApiOperation({ summary: 'Get overdue tax deadlines' })
  @ApiResponse({ status: 200, description: 'Returns overdue tax deadlines' })
  async getOverdueDeadlines(@Param('orgId') organisationId: string) {
    return this.taxAssistantService.checkOverdueDeadlines(organisationId);
  }

  @Post('deadlines/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate tax deadlines for current year' })
  @ApiResponse({ status: 201, description: 'Tax deadlines generated' })
  async generateDeadlines(@Param('orgId') organisationId: string) {
    return this.taxAssistantService.generateDeadlines(organisationId);
  }

  // ============================================================================
  // ANALYSIS ENDPOINT
  // ============================================================================

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run tax analysis and generate new suggestions' })
  @ApiResponse({ status: 200, description: 'Tax analysis completed' })
  async analyzeTaxSavings(@Param('orgId') organisationId: string) {
    const suggestions = await this.taxAssistantService.analyzeTaxSavings(organisationId);
    return {
      message: 'Tax analysis completed',
      suggestionsGenerated: suggestions.length,
      suggestions,
    };
  }
}
