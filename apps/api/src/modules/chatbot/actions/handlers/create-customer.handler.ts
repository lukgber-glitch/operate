/**
 * Create Customer Action Handler
 * Creates customers/clients via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { ClientsService } from '../../../crm/clients.service';

@Injectable()
export class CreateCustomerHandler extends BaseActionHandler {
  constructor(private clientsService: ClientsService) {
    super('CreateCustomerHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_CUSTOMER;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Customer/company name',
      },
      {
        name: 'email',
        type: 'string',
        required: false,
        description: 'Contact email',
        validation: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      },
      {
        name: 'phone',
        type: 'string',
        required: false,
        description: 'Contact phone number',
      },
      {
        name: 'address',
        type: 'string',
        required: false,
        description: 'Business address',
      },
      {
        name: 'city',
        type: 'string',
        required: false,
        description: 'City',
      },
      {
        name: 'country',
        type: 'string',
        required: false,
        description: 'Country code (e.g., DE, AT, CH)',
        default: 'DE',
      },
      {
        name: 'vatNumber',
        type: 'string',
        required: false,
        description: 'VAT registration number',
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description: 'Additional notes',
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'Customer type: business or individual',
        default: 'business',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'clients:create')) {
        return this.error(
          'You do not have permission to create customers',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      // Check for existing customer with same name
      const existingClients = await this.clientsService.findAll(
        context.organizationId,
        { search: normalized.name },
      );

      const exactMatch = existingClients.clients?.find(
        (c: any) => c.name.toLowerCase() === normalized.name.toLowerCase(),
      );

      if (exactMatch) {
        return this.success(
          `Customer "${normalized.name}" already exists`,
          exactMatch.id,
          'Client',
          {
            existing: true,
            id: exactMatch.id,
            name: exactMatch.name,
            email: exactMatch.email,
          },
        );
      }

      // Create the customer
      const createDto: any = {
        type: 'COMPANY',
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        street: normalized.address,
        city: normalized.city,
        countryCode: normalized.country || 'DE',
        vatId: normalized.vatNumber,
        notes: normalized.notes
          ? `${normalized.notes}\n\nCreated via AI Assistant`
          : 'Created via AI Assistant',
        source: 'chatbot',
      };

      const customer = await this.clientsService.create(
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Customer ${customer.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Customer "${normalized.name}" created successfully`,
        customer.id,
        'Client',
        {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          countryCode: customer.countryCode,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create customer:', error);
      return this.error(
        'Failed to create customer',
        error.message || 'Unknown error',
      );
    }
  }
}
