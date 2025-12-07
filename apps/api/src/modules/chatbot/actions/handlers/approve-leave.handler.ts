/**
 * Approve Leave Action Handler
 * Handles leave approval/rejection via chatbot
 */

import { Injectable } from '@nestjs/common';
import { BaseActionHandler } from './base.handler';
import {
  ActionType,
  ActionResult,
  ActionContext,
  ParameterDefinition,
} from '../action.types';
import { LeaveService } from '../../../hr/leave/leave.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ApproveLeaveHandler extends BaseActionHandler {
  constructor(
    private leaveService: LeaveService,
    private prisma: PrismaService,
  ) {
    super('ApproveLeaveHandler');
  }

  get actionType(): ActionType {
    return ActionType.APPROVE_LEAVE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'leaveRequestId',
        type: 'string',
        required: true,
        description: 'Leave request ID to approve or reject',
      },
      {
        name: 'approved',
        type: 'boolean',
        required: true,
        description: 'Whether to approve (true) or reject (false)',
      },
      {
        name: 'comment',
        type: 'string',
        required: false,
        description: 'Optional comment or reason',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'hr:leave:approve')) {
        return this.error(
          'You do not have permission to approve leave requests',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Validate required fields
      if (!normalized.leaveRequestId || normalized.approved === undefined) {
        return this.error(
          'leaveRequestId and approved are required',
          'VALIDATION_ERROR',
        );
      }

      // Get leave request details
      const leaveRequest = await this.leaveService.getRequest(
        normalized.leaveRequestId,
      );

      if (!leaveRequest) {
        return this.error(
          `Leave request ${normalized.leaveRequestId} not found`,
          'NOT_FOUND',
        );
      }

      // Get employee details for the notification
      const employee = await this.prisma.employee.findUnique({
        where: { id: leaveRequest.employeeId },
      });

      if (!employee) {
        return this.error('Employee not found', 'NOT_FOUND');
      }

      // Find manager's employee record (for audit trail)
      const manager = await this.prisma.employee.findFirst({
        where: {
          userId: context.userId,
          orgId: context.organizationId,
          deletedAt: null,
        },
      });

      const managerId = manager?.id || context.userId;

      let result;
      if (normalized.approved === true) {
        // Approve the leave request
        result = await this.leaveService.approveRequest(
          normalized.leaveRequestId,
          managerId,
          normalized.comment,
        );

        this.logger.log(
          `Leave request ${normalized.leaveRequestId} approved by ${context.userId}`,
        );

        return this.success(
          `Leave request approved for ${employee.firstName} ${employee.lastName}. ${leaveRequest.leaveType} leave from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} (${leaveRequest.totalDays} days)${normalized.comment ? `. Comment: ${normalized.comment}` : ''}`,
          result.id,
          'LeaveRequest',
          {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: result.leaveType,
            startDate: result.startDate.toISOString().split('T')[0],
            endDate: result.endDate.toISOString().split('T')[0],
            totalDays: Number(result.totalDays),
            status: result.status,
            approvedBy: managerId,
            comment: normalized.comment,
          },
        );
      } else {
        // Reject the leave request
        const rejectionReason =
          normalized.comment || 'No reason provided';

        result = await this.leaveService.rejectRequest(
          normalized.leaveRequestId,
          managerId,
          rejectionReason,
        );

        this.logger.log(
          `Leave request ${normalized.leaveRequestId} rejected by ${context.userId}`,
        );

        return this.success(
          `Leave request rejected for ${employee.firstName} ${employee.lastName}. Reason: ${rejectionReason}`,
          result.id,
          'LeaveRequest',
          {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: result.leaveType,
            startDate: result.startDate.toISOString().split('T')[0],
            endDate: result.endDate.toISOString().split('T')[0],
            totalDays: Number(result.totalDays),
            status: result.status,
            rejectedBy: managerId,
            reason: rejectionReason,
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to process leave approval:', error);
      return this.error(
        'Failed to process leave approval',
        error.message || 'Unknown error',
      );
    }
  }
}
