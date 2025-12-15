/**
 * Get Contract Status Action Handler
 * Gets contract status via chatbot
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
export class GetContractStatusHandler extends BaseActionHandler {
  constructor(private contractsService: ContractsService) {
    super('GetContractStatusHandler');
  }

  get actionType(): ActionType {
    return ActionType.GET_CONTRACT_STATUS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'contractId',
        type: 'string',
        required: true,
        description: 'Contract ID to check',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'contracts:view')) {
        return this.error(
          'You do not have permission to view contracts',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const contract = await this.contractsService.findOne(
        normalized.contractId,
        context.organizationId,
      );

      return this.success(
        `Contract status: ${contract.status}`,
        contract.id,
        'Contract',
        {
          id: contract.id,
          title: contract.title,
          status: contract.status,
          signed: contract.signedAt !== null,
          signedAt: contract.signedAt,
          clientId: contract.clientId,
        },
      );
    } catch (error) {
      this.logger.error('Failed to get contract status:', error);
      return this.error(
        'Failed to get contract status',
        error.message || 'Unknown error',
      );
    }
  }
}
