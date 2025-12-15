/**
 * Create Quote Action Handler
 * Creates quotes/estimates via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { QuotesService } from '../../../quotes/quotes.service';

@Injectable()
export class CreateQuoteHandler extends BaseActionHandler {
  constructor(private quotesService: QuotesService) {
    super('CreateQuoteHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_QUOTE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'clientId',
        type: 'string',
        required: true,
        description: 'Client ID for the quote',
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        description: 'Quote title/description',
      },
      {
        name: 'items',
        type: 'array',
        required: true,
        description: 'Array of line items with description, quantity, unitPrice',
      },
      {
        name: 'validDays',
        type: 'number',
        required: false,
        description: 'Number of days quote is valid',
        default: 30,
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description: 'Additional notes for the quote',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'quotes:create')) {
        return this.error(
          'You do not have permission to create quotes',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const createDto = {
        clientId: normalized.clientId,
        title: normalized.title,
        items: normalized.items,
        validDays: normalized.validDays || 30,
        notes: normalized.notes,
        status: 'DRAFT',
      };

      const quote = await this.quotesService.create(
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Quote ${quote.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Quote "${normalized.title}" created successfully`,
        quote.id,
        'Quote',
        {
          id: quote.id,
          title: quote.title,
          total: quote.total,
          validUntil: quote.validUntil,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create quote:', error);
      return this.error(
        'Failed to create quote',
        error.message || 'Unknown error',
      );
    }
  }
}
