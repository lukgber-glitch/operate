/**
 * Request Leave Action Handler
 * Handles leave requests via chatbot
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
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateLeaveRequestDto } from '../../../hr/leave/dto/create-leave-request.dto';
import { LeaveType } from '@prisma/client';

@Injectable()
export class RequestLeaveHandler extends BaseActionHandler {
  constructor(
    private leaveService: LeaveService,
    private prisma: PrismaService,
  ) {
    super('RequestLeaveHandler');
  }

  get actionType(): ActionType {
    return ActionType.REQUEST_LEAVE;
  }

  getRequiredParameters(): ParameterDefinition[] {
    return [
      {
        name: 'startDate',
        type: 'string',
        required: true,
        description: 'Leave start date (ISO format)',
      },
      {
        name: 'endDate',
        type: 'string',
        required: true,
        description: 'Leave end date (ISO format)',
      },
      {
        name: 'leaveType',
        type: 'string',
        required: true,
        description:
          'Leave type (VACATION, SICK, PARENTAL, UNPAID, SPECIAL, TRAINING)',
        validation: (value) =>
          ['VACATION', 'SICK', 'PARENTAL', 'UNPAID', 'SPECIAL', 'TRAINING', 'ANNUAL'].includes(
            value.toUpperCase(),
          ),
      },
      {
        name: 'reason',
        type: 'string',
        required: false,
        description: 'Reason for leave',
      },
    ];
  }

  async execute(
    params: Record<string, any>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      // Check permission
      if (!this.hasPermission(context, 'hr:leave:request')) {
        return this.error(
          'You do not have permission to request leave',
          'PERMISSION_DENIED',
        );
      }

      // Normalize parameters
      const normalized = this.normalizeParams(params);

      // Validate required fields
      if (!normalized.startDate || !normalized.endDate || !normalized.leaveType) {
        return this.error(
          'startDate, endDate, and leaveType are required',
          'VALIDATION_ERROR',
        );
      }

      // Find employee for this user
      const employee = await this.prisma.employee.findFirst({
        where: {
          userId: context.userId,
          orgId: context.organizationId,
          deletedAt: null,
        },
      });

      if (!employee) {
        return this.error(
          'No employee record found for your user account',
          'NOT_FOUND',
        );
      }

      // Map leaveType - handle both VACATION and ANNUAL
      let mappedLeaveType = normalized.leaveType.toUpperCase();
      if (mappedLeaveType === 'VACATION') {
        mappedLeaveType = 'ANNUAL';
      }

      // Check leave balance before requesting
      const balance = await this.leaveService.getBalance(employee.id);
      if (mappedLeaveType === 'ANNUAL') {
        const annualBalance = balance.balances.find(
          (b) => b.leaveType === LeaveType.ANNUAL,
        );

        // Calculate requested days
        const startDate = new Date(normalized.startDate);
        const endDate = new Date(normalized.endDate);
        const daysDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

        if (annualBalance && annualBalance.availableDays < daysDiff) {
          return this.error(
            `Insufficient leave balance. Available: ${annualBalance.availableDays} days, Requested: ${daysDiff} days`,
            'INSUFFICIENT_BALANCE',
          );
        }
      }

      // Build leave request DTO
      const leaveDto: CreateLeaveRequestDto = {
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        leaveType: mappedLeaveType as LeaveType,
        reason: normalized.reason,
      };

      // Submit leave request
      const leaveRequest = await this.leaveService.submitRequest(
        employee.id,
        leaveDto,
      );

      this.logger.log(
        `Leave request ${leaveRequest.id} created by AI assistant for employee ${employee.id}`,
      );

      return this.success(
        `Leave request submitted successfully for ${normalized.leaveType} from ${normalized.startDate} to ${normalized.endDate}. Total days: ${leaveRequest.totalDays}. Status: Pending approval`,
        leaveRequest.id,
        'LeaveRequest',
        {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          leaveType: leaveRequest.leaveType,
          startDate: normalized.startDate,
          endDate: normalized.endDate,
          totalDays: Number(leaveRequest.totalDays),
          status: leaveRequest.status,
        },
      );
    } catch (error) {
      this.logger.error('Failed to request leave:', error);
      return this.error(
        'Failed to request leave',
        error.message || 'Unknown error',
      );
    }
  }
}
