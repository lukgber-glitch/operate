/**
 * Base Action Handler
 * Abstract base class for all action handlers
 */

import { Logger } from '@nestjs/common';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
  ValidationResult,
} from '../action.types';

export abstract class BaseActionHandler {
  protected readonly logger: Logger;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  /**
   * The action type this handler processes
   */
  abstract get actionType(): ActionType;

  /**
   * Required parameters for this action
   */
  abstract getRequiredParameters(): ParameterDefinition[];

  /**
   * Execute the action
   */
  abstract execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult>;

  /**
   * Validate action parameters
   */
  validate(
    params: Record<string, any>,
    context: ActionContext,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredParams = this.getRequiredParameters();

    // Check all required parameters
    for (const paramDef of requiredParams) {
      const value = params[paramDef.name];

      // Check if required parameter is missing
      if (paramDef.required && (value === undefined || value === null)) {
        errors.push(`Missing required parameter: ${paramDef.name}`);
        continue;
      }

      // Skip validation if parameter is optional and not provided
      if (!paramDef.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, paramDef.type)) {
        errors.push(
          `Parameter '${paramDef.name}' must be of type ${paramDef.type}`,
        );
      }

      // Custom validation
      if (paramDef.validation && !paramDef.validation(value)) {
        errors.push(`Parameter '${paramDef.name}' failed validation`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate parameter type
   */
  protected validateType(
    value: any,
    expectedType: ParameterDefinition['type'],
  ): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Create a success result
   */
  protected success(
    message: string,
    entityId?: string,
    entityType?: string,
    data?: any,
  ): ActionResult {
    return {
      success: true,
      message,
      entityId,
      entityType,
      data,
    };
  }

  /**
   * Create an error result
   */
  protected error(message: string, error?: string): ActionResult {
    return {
      success: false,
      message,
      error,
    };
  }

  /**
   * Sanitize and normalize parameters
   */
  protected normalizeParams(params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      // Remove null/undefined values
      if (value === null || value === undefined) {
        continue;
      }

      // Trim strings
      if (typeof value === 'string') {
        normalized[key] = value.trim();
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Check if user has required permission
   */
  protected hasPermission(context: ActionContext, permission: string): boolean {
    return context.permissions.includes(permission);
  }

  /**
   * Log action execution
   */
  protected logExecution(
    context: ActionContext,
    params: Record<string, any>,
    result: ActionResult,
  ): void {
    this.logger.log(
      `Action ${this.actionType} executed by user ${context.userId} in org ${context.organizationId}: ${result.success ? 'SUCCESS' : 'FAILED'}`,
    );

    if (!result.success && result.error) {
      this.logger.error(`Action error: ${result.error}`);
    }
  }
}
