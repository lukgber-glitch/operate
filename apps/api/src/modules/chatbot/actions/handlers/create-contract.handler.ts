/**
 * Create Contract Action Handler
 * Creates contracts from templates via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { ContractsService } from '../../../contracts/contracts.service';

@Injectable()
export class CreateContractHandler extends BaseActionHandler {
  constructor(private contractsService: ContractsService) {
    super('CreateContractHandler');
  }

  get actionType(): ActionType {
    return ActionType.CREATE_CONTRACT;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'templateId',
        type: 'string',
        required: true,
        description: 'Contract template ID',
      },
      {
        name: 'clientId',
        type: 'string',
        required: true,
        description: 'Client ID for the contract',
      },
      {
        name: 'variables',
        type: 'object',
        required: true,
        description: 'Template variables (key-value pairs)',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'contracts:create')) {
        return this.error(
          'You do not have permission to create contracts',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const createDto = {
        templateId: normalized.templateId,
        clientId: normalized.clientId,
        variables: normalized.variables,
      };

      const contract = await this.contractsService.createFromTemplate(
        context.organizationId,
        createDto,
      );

      this.logger.log(
        `Contract ${contract.id} created by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Contract created successfully`,
        contract.id,
        'Contract',
        {
          id: contract.id,
          title: contract.title,
          status: contract.status,
          clientId: contract.clientId,
        },
      );
    } catch (error) {
      this.logger.error('Failed to create contract:', error);
      return this.error(
        'Failed to create contract',
        error.message || 'Unknown error',
      );
    }
  }
}
