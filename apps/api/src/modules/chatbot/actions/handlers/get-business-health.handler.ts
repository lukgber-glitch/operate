/**
 * Get Business Health Action Handler
 * Gets business health score and breakdown via chatbot
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
export class GetBusinessHealthHandler extends BaseActionHandler {
  constructor(private healthScoreService: HealthScoreService) {
    super('GetBusinessHealthHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_BUSINESS_HEALTH;
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
          'You do not have permission to view business health',
          'PERMISSION_DENIED',
        );
      }

      const health = await this.healthScoreService.getCurrentScore(
        context.organizationId,
      );

      return this.success(
        `Business health score: ${health.overallScore}/100`,
        undefined,
        'HealthScore',
        {
          overall: health.overallScore,
          components: {
            cashFlow: health.cashFlowScore,
            arHealth: health.arHealthScore,
            apHealth: health.apHealthScore,
            taxCompliance: health.taxComplianceScore,
            profitability: health.profitabilityScore,
            runway: health.runwayScore,
          },
          insights: health.insights,
          recommendations: health.recommendations,
          lastUpdated: health.date,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get business health:', error);
      return this.error(
        'Failed to get business health',
        error.message || 'Unknown error',
      );
    }
  }
}
