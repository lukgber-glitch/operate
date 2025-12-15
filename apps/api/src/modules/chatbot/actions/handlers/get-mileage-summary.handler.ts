/**
 * Get Mileage Summary Action Handler
 * Gets mileage summary and tax deduction via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { MileageService } from '../../../mileage/mileage.service';

@Injectable()
export class GetMileageSummaryHandler extends BaseActionHandler {
  constructor(private mileageService: MileageService) {
    super('GetMileageSummaryHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_MILEAGE_SUMMARY;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'year',
        type: 'number',
        required: false,
        description: 'Year for summary (default: current year)',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'mileage:view')) {
        return this.error(
          'You do not have permission to view mileage',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);
      const year = normalized.year || new Date().getFullYear();

      const summary = await this.mileageService.getSummary(
        context.userId,
        context.organizationId,
        year,
      );

      return this.success(
        `Mileage summary for ${year}`,
        undefined,
        'MileageSummary',
        {
          year,
          totalDistance: summary.totalDistance,
          totalDeduction: summary.totalDeduction,
          entries: summary.entries,
          currency: summary.currency,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get mileage summary:', error);
      return this.error(
        'Failed to get mileage summary',
        error.message || 'Unknown error',
      );
    }
  }
}
