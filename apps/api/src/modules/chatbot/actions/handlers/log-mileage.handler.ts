/**
 * Log Mileage Action Handler
 * Logs business mileage via chatbot
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
export class LogMileageHandler extends BaseActionHandler {
  constructor(private mileageService: MileageService) {
    super('LogMileageHandler');
  }

  get actionType(): ActionType {
    return ActionType.LOG_MILEAGE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'distance',
        type: 'number',
        required: true,
        description: 'Distance traveled',
        validation: (value) => value > 0,
      },
      {
        name: 'unit',
        type: 'string',
        required: true,
        description: 'Distance unit: km or miles',
        validation: (value) => ['km', 'miles'].includes(value),
      },
      {
        name: 'purpose',
        type: 'string',
        required: true,
        description: 'Purpose of the trip',
      },
      {
        name: 'date',
        type: 'string',
        required: false,
        description: 'Date of trip (YYYY-MM-DD, default: today)',
      },
      {
        name: 'roundTrip',
        type: 'boolean',
        required: false,
        description: 'Whether this is a round trip (distance will be doubled)',
        default: false,
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'mileage:create')) {
        return this.error(
          'You do not have permission to log mileage',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      let distance = normalized.distance;
      if (normalized.roundTrip) {
        distance *= 2;
      }

      const createDto = {
        distance,
        unit: normalized.unit,
        purpose: normalized.purpose,
        date: normalized.date ? new Date(normalized.date) : new Date(),
      };

      const entry = await this.mileageService.create(
        context.userId,
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Mileage entry ${entry.id} logged by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Logged ${distance} ${normalized.unit} for "${normalized.purpose}"${normalized.roundTrip ? ' (round trip)' : ''}`,
        entry.id,
        'MileageEntry',
        {
          id: entry.id,
          distance: entry.distance,
          unit: entry.unit,
          purpose: entry.purpose,
          deduction: entry.deduction,
        },
      );
    } catch (error) {
      this.logger.error('Failed to log mileage:', error);
      return this.error(
        'Failed to log mileage',
        error.message || 'Unknown error',
      );
    }
  }
}
