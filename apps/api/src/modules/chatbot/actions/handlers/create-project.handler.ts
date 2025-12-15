/**
 * Create Project Action Handler
 * Creates projects via chatbot
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
export class CreateProjectHandler extends BaseActionHandler {
  constructor(private timeTrackingService: TimeTrackingService) {
    super('CreateProjectHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_PROJECT;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Project name',
      },
      {
        name: 'clientId',
        type: 'string',
        required: false,
        description: 'Client ID (optional)',
      },
      {
        name: 'budgetHours',
        type: 'number',
        required: false,
        description: 'Budget in hours (optional)',
      },
      {
        name: 'hourlyRate',
        type: 'number',
        required: false,
        description: 'Hourly rate (optional)',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'projects:create')) {
        return this.error(
          'You do not have permission to create projects',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const createDto = {
        name: normalized.name,
        clientId: normalized.clientId,
        budgetHours: normalized.budgetHours,
        hourlyRate: normalized.hourlyRate,
      };

      const project = await this.timeTrackingService.createProject(
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Project ${project.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Project "${normalized.name}" created successfully`,
        project.id,
        'Project',
        {
          id: project.id,
          name: project.name,
          budgetHours: project.budgetHours,
          hourlyRate: project.hourlyRate,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create project:', error);
      return this.error(
        'Failed to create project',
        error.message || 'Unknown error',
      );
    }
  }
}
