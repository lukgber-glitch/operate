/**
 * Action Parser Service
 * Parses AI responses to extract action intents
 */

import { Injectable, Logger } from '@nestjs/common';
import { ActionIntent, ActionType } from './action.types';

/**
 * Action format: [ACTION:type params={"key":"value"}]
 * Example: [ACTION:create_invoice params={"customerId":"123","amount":500}]
 */
@Injectable()
export class ActionParserService {
  private readonly logger = new Logger(ActionParserService.name);

  // Regex to match action format
  private readonly ACTION_REGEX =
    /\[ACTION:(\w+)\s+params=(\{[^}]+\})\]/gi;

  /**
   * Parse AI response for action intents
   */
  parseActionIntent(aiResponse: string): ActionIntent | null {
    try {
      // Reset regex lastIndex
      this.ACTION_REGEX.lastIndex = 0;

      const match = this.ACTION_REGEX.exec(aiResponse);

      if (!match) {
        return null;
      }

      const actionTypeStr = match[1];
      const paramsStr = match[2];

      // Validate action type
      const actionType = this.validateActionType(actionTypeStr);
      if (!actionType) {
        this.logger.warn(`Invalid action type: ${actionTypeStr}`);
        return null;
      }

      // Parse parameters
      let parameters: Record<string, any>;
      try {
        parameters = JSON.parse(paramsStr);
      } catch (error) {
        this.logger.error('Failed to parse action parameters:', error);
        return null;
      }

      // Determine if confirmation is required
      const confirmationRequired = this.requiresConfirmation(actionType);

      // Generate description
      const description = this.generateDescription(actionType, parameters);

      return {
        type: actionType,
        parameters,
        confirmationRequired,
        description,
      };
    } catch (error) {
      this.logger.error('Error parsing action intent:', error);
      return null;
    }
  }

  /**
   * Parse multiple action intents from response
   */
  parseMultipleActions(aiResponse: string): ActionIntent[] {
    const intents: ActionIntent[] = [];
    let match: RegExpExecArray | null;

    // Reset regex lastIndex
    this.ACTION_REGEX.lastIndex = 0;

    while ((match = this.ACTION_REGEX.exec(aiResponse)) !== null) {
      const actionTypeStr = match[1];
      const paramsStr = match[2];

      const actionType = this.validateActionType(actionTypeStr);
      if (!actionType) {
        continue;
      }

      try {
        const parameters = JSON.parse(paramsStr);
        const confirmationRequired = this.requiresConfirmation(actionType);
        const description = this.generateDescription(actionType, parameters);

        intents.push({
          type: actionType,
          parameters,
          confirmationRequired,
          description,
        });
      } catch (error) {
        this.logger.error('Failed to parse action parameters:', error);
        continue;
      }
    }

    return intents;
  }

  /**
   * Validate action type string
   */
  private validateActionType(actionTypeStr: string): ActionType | null {
    const normalized = actionTypeStr.toLowerCase();

    // Check if it's a valid ActionType
    const validTypes = Object.values(ActionType);
    const found = validTypes.find(
      (type) => type.toLowerCase() === normalized,
    );

    return found || null;
  }

  /**
   * Check if action requires user confirmation
   */
  private requiresConfirmation(actionType: ActionType): boolean {
    const confirmationRequired: ActionType[] = [
      ActionType.CREATE_INVOICE,
      ActionType.SEND_REMINDER,
      ActionType.SEND_EMAIL,
      ActionType.EXPORT_DATA,
    ];

    return confirmationRequired.includes(actionType);
  }

  /**
   * Generate human-readable description of action
   */
  private generateDescription(
    actionType: ActionType,
    parameters: Record<string, any>,
  ): string {
    switch (actionType) {
      case ActionType.CREATE_INVOICE:
        return `Create invoice for ${parameters.customerName || parameters.customerId} - ${parameters.amount} ${parameters.currency || 'EUR'}`;

      case ActionType.CREATE_EXPENSE:
        return `Create expense: ${parameters.description} - ${parameters.amount} ${parameters.currency || 'EUR'}`;

      case ActionType.SEND_REMINDER:
        return `Send ${parameters.reminderType || 'payment'} reminder for invoice ${parameters.invoiceId}`;

      case ActionType.GENERATE_REPORT:
        return `Generate ${parameters.reportType} report from ${parameters.fromDate} to ${parameters.toDate}`;

      case ActionType.UPDATE_STATUS:
        return `Update ${parameters.entityType} ${parameters.entityId} status to ${parameters.status}`;

      case ActionType.SEND_EMAIL:
        return `Send email to ${parameters.recipient}`;

      case ActionType.EXPORT_DATA:
        return `Export ${parameters.dataType} data`;

      case ActionType.SCHEDULE_TASK:
        return `Schedule task: ${parameters.taskName}`;

      default:
        return `Execute ${actionType}`;
    }
  }

  /**
   * Remove action tags from response text
   */
  removeActionTags(text: string): string {
    return text.replace(this.ACTION_REGEX, '').trim();
  }

  /**
   * Extract clean response without action tags
   */
  extractCleanResponse(aiResponse: string): string {
    return this.removeActionTags(aiResponse);
  }

  /**
   * Check if response contains any actions
   */
  hasActions(text: string): boolean {
    this.ACTION_REGEX.lastIndex = 0;
    return this.ACTION_REGEX.test(text);
  }
}
