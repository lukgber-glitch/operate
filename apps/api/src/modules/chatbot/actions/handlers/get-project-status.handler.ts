/**
 * Get Project Status Action Handler
 * Gets project progress and profitability via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { TimeTrackingService } from '../../../time-tracking/time-tracking.service';

@Injectable()
export class GetProjectStatusHandler extends BaseActionHandler {
  constructor(private timeTrackingService: TimeTrackingService) {
    super('GetProjectStatusHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_PROJECT_STATUS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'Project ID to check',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'projects:view')) {
        return this.error(
          'You do not have permission to view projects',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const status = await this.timeTrackingService.getProjectStatus(
        normalized.projectId,
        context.organizationId,
      );

      return this.success(
        `Project status for "${status.name}"`,
        status.id,
        'ProjectStatus',
        {
          id: status.id,
          name: status.name,
          hoursLogged: status.hoursLogged,
          budgetHours: status.budgetHours,
          percentComplete: status.percentComplete,
          profitability: status.profitability,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get project status:', error);
      return this.error(
        'Failed to get project status',
        error.message || 'Unknown error',
      );
    }
  }
}
