/**
 * Get Health Recommendations Action Handler
 * Gets recommendations to improve business health via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { HealthScoreService } from '../../../health-score/health-score.service';

@Injectable()
export class GetHealthRecommendationsHandler extends BaseActionHandler {
  constructor(private healthScoreService: HealthScoreService) {
    super('GetHealthRecommendationsHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_HEALTH_RECOMMENDATIONS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'reports:view')) {
        return this.error(
          'You do not have permission to view recommendations',
          'PERMISSION_DENIED',
        );
      }

      const recommendations = await this.healthScoreService.getRecommendations(
        context.organizationId,
      );

      return this.success(
        `Found ${recommendations.length} recommendations`,
        undefined,
        'Recommendations',
        {
          recommendations,
          count: recommendations.length,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get health recommendations:', error);
      return this.error(
        'Failed to get health recommendations',
        error.message || 'Unknown error',
      );
    }
  }
}
