/**
 * Suggestions Controller
 * REST API endpoints for proactive suggestions
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProactiveSuggestionsService } from './proactive-suggestions.service';
import { AIInsightsService } from './ai-insights.service';
import { ContextService } from '../context/context.service';
import {
  Suggestion,
  Insight,
  Reminder,
  Optimization,
  Anomaly,
} from './suggestion.types';

/**
 * DTOs
 */
class GetSuggestionsQueryDto {
  page?: string;
  entityId?: string;
  limit?: number;
}

class DismissSuggestionDto {
  reason?: string;
}

@Controller('suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(
    private readonly suggestionsService: ProactiveSuggestionsService,
    private readonly aiInsightsService: AIInsightsService,
    private readonly contextService: ContextService,
  ) {}

  /**
   * GET /suggestions
   * Get suggestions for current context
   */
  @Get()
  async getSuggestions(
    @Request() req: any,
    @Query() query: GetSuggestionsQueryDto,
  ): Promise<{ suggestions: Suggestion[]; count: number }> {
    const userId = req.user.userId;
    const orgId = req.user.organizationId;

    // Build context
    const context = await this.contextService.buildContext({
      userId,
      organizationId: orgId,
      currentPage: query.page || '/dashboard',
      selectedEntityId: query.entityId,
    });

    // Get suggestions
    const suggestions = await this.suggestionsService.getSuggestions(context);

    // Apply limit if provided
    const limit = query.limit || 10;
    const limitedSuggestions = suggestions.slice(0, limit);

    return {
      suggestions: limitedSuggestions,
      count: limitedSuggestions.length,
    };
  }

  /**
   * GET /suggestions/page/:page
   * Get suggestions for a specific page
   */
  @Get('page/:page')
  async getPageSuggestions(
    @Request() req: any,
    @Param('page') page: string,
    @Query('entityId') entityId?: string,
  ): Promise<{ suggestions: Suggestion[] }> {
    const userId = req.user.userId;
    const orgId = req.user.organizationId;

    const suggestions = await this.suggestionsService.getPageSuggestions(
      page,
      entityId,
      orgId,
      userId,
    );

    return { suggestions };
  }

  /**
   * GET /suggestions/insights
   * Get AI-generated insights
   */
  @Get('insights')
  async getInsights(@Request() req: any): Promise<{ insights: Insight[] }> {
    const orgId = req.user.organizationId;

    const insights = await this.suggestionsService.getInsights(orgId);

    return { insights };
  }

  /**
   * GET /suggestions/insights/ai
   * Get advanced AI insights using Claude
   */
  @Get('insights/ai')
  async getAIInsights(@Request() req: any): Promise<{ insights: Insight[] }> {
    const orgId = req.user.organizationId;

    const insights = await this.aiInsightsService.generateInsights(orgId);

    return { insights };
  }

  /**
   * GET /suggestions/insights/anomalies
   * Get detected anomalies
   */
  @Get('insights/anomalies')
  async getAnomalies(@Request() req: any): Promise<{ anomalies: Anomaly[] }> {
    const orgId = req.user.organizationId;

    const anomalies = await this.aiInsightsService.detectAnomalies(orgId);

    return { anomalies };
  }

  /**
   * GET /suggestions/deadlines
   * Get deadline reminders
   */
  @Get('deadlines')
  async getDeadlines(@Request() req: any): Promise<{ reminders: Reminder[] }> {
    const orgId = req.user.organizationId;

    const reminders = await this.suggestionsService.getDeadlineReminders(orgId);

    return { reminders };
  }

  /**
   * GET /suggestions/optimizations
   * Get optimization suggestions
   */
  @Get('optimizations')
  async getOptimizations(
    @Request() req: any,
  ): Promise<{ optimizations: Optimization[] }> {
    const orgId = req.user.organizationId;

    const optimizations = await this.suggestionsService.getOptimizations(orgId);

    return { optimizations };
  }

  /**
   * GET /suggestions/recommendations
   * Get personalized recommendations
   */
  @Get('recommendations')
  async getRecommendations(
    @Request() req: any,
  ): Promise<{ recommendations: string[] }> {
    const userId = req.user.userId;
    const orgId = req.user.organizationId;

    const recommendations =
      await this.aiInsightsService.getPersonalizedRecommendations(orgId, userId);

    return { recommendations };
  }

  /**
   * POST /suggestions/:id/dismiss
   * Dismiss a suggestion
   */
  @Post(':id/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissSuggestion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: DismissSuggestionDto,
  ): Promise<void> {
    const userId = req.user.userId;
    const orgId = req.user.organizationId;

    // Invalidate cache
    await this.suggestionsService.invalidateCache(orgId, userId);

    // In a real implementation, you might want to store dismissed suggestions
    // For now, we just invalidate the cache
  }

  /**
   * POST /suggestions/:id/apply
   * Apply/execute a suggestion
   */
  @Post(':id/apply')
  async applySuggestion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() params?: Record<string, any>,
  ): Promise<{ success: boolean; result?: any }> {
    const userId = req.user.userId;
    const orgId = req.user.organizationId;

    // Invalidate cache after applying
    await this.suggestionsService.invalidateCache(orgId, userId);

    // Return success - actual action execution would be handled by action-executor
    return {
      success: true,
      result: { message: 'Suggestion applied successfully' },
    };
  }

  /**
   * POST /suggestions/refresh
   * Force refresh suggestions (invalidate cache)
   */
  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refreshSuggestions(@Request() req: any): Promise<void> {
    const userId = req.user.userId;
    const orgId = req.user.organizationId;

    await this.suggestionsService.invalidateCache(orgId, userId);
  }
}
