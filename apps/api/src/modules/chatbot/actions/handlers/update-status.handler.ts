/**
 * Update Status Action Handler
 * Handles status updates for various entities via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { PrismaService } from '@/modules/database/prisma.service';
import { InvoiceStatus, ExpenseStatus } from '@prisma/client';

@Injectable()
export class UpdateStatusHandler extends BaseActionHandler {
  constructor(private prisma: PrismaService) {
    super('UpdateStatusHandler');
  }

  get actionType(): ActionType {
    return ActionType.UPDATE_STATUS;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'entityType',
        type: 'string',
        required: true,
        description: 'Type of entity to update (invoice, expense, task)',
        validation: (value) =>
          ['invoice', 'expense', 'task'].includes(value.toLowerCase()),
      },
      {
        name: 'entityId',
        type: 'string',
        required: true,
        description: 'ID of entity to update',
      },
      {
        name: 'status',
        type: 'string',
        required: true,
        description: 'New status value',
      },
      {
        name: 'reason',
        type: 'string',
        required: false,
        description: 'Reason for status change',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Normalize parameters
      const normalized = this.normalizeParams(params);
      const entityType = normalized.entityType.toLowerCase();

      // Route to appropriate handler
      switch (entityType) {
        case 'invoice':
          return await this.updateInvoiceStatus(normalized, context);
        case 'expense':
          return await this.updateExpenseStatus(normalized, context);
        case 'task':
          return await this.updateTaskStatus(normalized, context);
        default:
          return this.error(`Unsupported entity type: ${entityType}`, 'VALIDATION_ERROR');
      }
    } catch (error) {
      this.logger.error('Failed to update status:', error);
      return this.error(
        'Failed to update status',
        error.message || 'Unknown error',
      );
    }
  }

  /**
   * Update invoice status
   */
  private async updateInvoiceStatus(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    // Check permission
    if (!this.hasPermission(context, 'invoices:update')) {
      return this.error(
        'You do not have permission to update invoice status',
        'PERMISSION_DENIED',
      );
    }

    // Validate status
    const validStatuses = Object.values(InvoiceStatus);
    const status = params.status.toUpperCase();

    if (!validStatuses.includes(status as InvoiceStatus)) {
      return this.error(`Invalid invoice status: ${params.status}`, 'VALIDATION_ERROR');
    }

    // Verify invoice exists and belongs to organization
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: params.entityId,
        orgId: context.organizationId,
      },
    });

    if (!invoice) {
      return this.error('Invoice not found', 'NOT_FOUND');
    }

    // Update status
    const updated = await this.prisma.invoice.update({
      where: { id: params.entityId },
      data: {
        status: status as InvoiceStatus,
      },
    });

    this.logger.log(
      `Invoice ${invoice.id} status updated to ${status} by AI assistant`,
    );

    return this.success(
      `Invoice ${invoice.number} status updated to ${status}`,
      invoice.id,
      'Invoice',
      {
        number: invoice.number,
        previousStatus: invoice.status,
        newStatus: status,
      },
    );
  }

  /**
   * Update expense status
   */
  private async updateExpenseStatus(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    // Check permission
    if (!this.hasPermission(context, 'expenses:update')) {
      return this.error(
        'You do not have permission to update expense status',
        'PERMISSION_DENIED',
      );
    }

    // Validate status
    const validStatuses = Object.values(ExpenseStatus);
    const status = params.status.toUpperCase();

    if (!validStatuses.includes(status as ExpenseStatus)) {
      return this.error(`Invalid expense status: ${params.status}`, 'VALIDATION_ERROR');
    }

    // Verify expense exists and belongs to organization
    const expense = await this.prisma.expense.findFirst({
      where: {
        id: params.entityId,
        orgId: context.organizationId,
      },
    });

    if (!expense) {
      return this.error('Expense not found', 'NOT_FOUND');
    }

    // Update status with additional fields based on status
    const updateData: any = {
      status: status as ExpenseStatus,
    };

    if (status === ExpenseStatus.APPROVED) {
      updateData.approvedBy = context.userId;
      updateData.approvedAt = new Date();
    } else if (status === ExpenseStatus.REJECTED) {
      updateData.rejectionReason = params.reason || 'Rejected via AI Assistant';
    } else if (status === ExpenseStatus.REIMBURSED) {
      updateData.reimbursedAt = new Date();
    }

    const updated = await this.prisma.expense.update({
      where: { id: params.entityId },
      data: updateData,
    });

    this.logger.log(
      `Expense ${expense.id} status updated to ${status} by AI assistant`,
    );

    return this.success(
      `Expense status updated to ${status}: ${expense.description}`,
      expense.id,
      'Expense',
      {
        description: expense.description,
        amount: expense.amount,
        previousStatus: expense.status,
        newStatus: status,
      },
    );
  }

  /**
   * Update task status (placeholder for future implementation)
   */
  private async updateTaskStatus(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    // This would integrate with a task management module
    return this.error('Task status updates not yet implemented', 'NOT_IMPLEMENTED');
  }
}
