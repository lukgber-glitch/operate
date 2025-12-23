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

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const summary = await this.mileageService.getSummary(
        context.organizationId,
        startDate,
        endDate,
      );

      return this.success(
        `Mileage summary for ${year}`,
        undefined,
        'MileageSummary',
        {
          year,
          totalDistanceKm: summary.totalDistanceKm,
          totalDistanceMiles: summary.totalDistanceMiles,
          totalAmount: summary.totalAmount,
          totalReimbursed: summary.totalReimbursed,
          totalPending: summary.totalPending,
          entries: summary.totalEntries,
          byVehicleType: summary.byVehicleType,
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
