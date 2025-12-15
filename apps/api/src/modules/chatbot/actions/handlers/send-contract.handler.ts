/**
 * Send Contract Action Handler
 * Sends contracts for signature via chatbot
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
export class SendContractHandler extends BaseActionHandler {
  constructor(private contractsService: ContractsService) {
    super('SendContractHandler');
  }

  get actionType(): ActionType {
    return ActionType.SEND_CONTRACT;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'contractId',
        type: 'string',
        required: true,
        description: 'Contract ID to send',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      if (!this.hasPermission(context, 'contracts:send')) {
        return this.error(
          'You do not have permission to send contracts',
          'PERMISSION_DENIED',
        );
      }

      const normalized = this.normalizeParams(params);

      const contract = await this.contractsService.send(
        normalized.contractId,
        context.organizationId,
      );

      this.logger.log(
        `Contract ${contract.id} sent by AI assistant for user ${context.userId}`,
      );

      return this.success(
        `Contract sent for signature`,
        contract.id,
        'Contract',
        {
          id: contract.id,
          status: contract.status,
          sentAt: contract.sentAt,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send contract:', error);
      return this.error(
        'Failed to send contract',
        error.message || 'Unknown error',
      );
    }
  }
}
