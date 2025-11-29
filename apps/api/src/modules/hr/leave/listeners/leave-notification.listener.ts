import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Leave Notification Listener
 * Handles leave request events and triggers appropriate notifications
 *
 * This is a placeholder implementation that logs events.
 * In production, this should:
 * - Send emails via an email service
 * - Create in-app notifications
 * - Send webhooks to external systems
 */
@Injectable()
export class LeaveNotificationListener {
  private readonly logger = new Logger(LeaveNotificationListener.name);

  /**
   * Handle leave request submission
   * Notify manager that a new leave request needs approval
   */
  @OnEvent('leave.request.submitted')
  async handleLeaveRequestSubmitted(payload: any) {
    this.logger.log(
      `[Event] Leave request ${payload.leaveRequest.id} submitted by employee ${payload.employeeId}`,
    );

    // TODO: Implement actual notification logic
    // Example implementation:
    // const employee = await this.prisma.employee.findUnique({
    //   where: { id: payload.employeeId },
    //   include: { organisation: true },
    // });
    //
    // const managers = await this.getOrganizationManagers(employee.orgId);
    //
    // await this.emailService.send({
    //   to: managers.map(m => m.email),
    //   subject: 'New Leave Request Pending Approval',
    //   template: 'leave-request-submitted',
    //   data: {
    //     employeeName: `${employee.firstName} ${employee.lastName}`,
    //     leaveType: payload.leaveRequest.leaveType,
    //     startDate: payload.leaveRequest.startDate,
    //     endDate: payload.leaveRequest.endDate,
    //     reason: payload.leaveRequest.reason,
    //   },
    // });
  }

  /**
   * Handle leave request approval
   * Notify employee that their leave request was approved
   */
  @OnEvent('leave.request.approved')
  async handleLeaveRequestApproved(payload: any) {
    this.logger.log(
      `[Event] Leave request ${payload.leaveRequest.id} approved by manager ${payload.managerId}`,
    );

    // TODO: Implement actual notification logic
    // Example implementation:
    // const employee = await this.prisma.employee.findUnique({
    //   where: { id: payload.employeeId },
    //   include: { user: true },
    // });
    //
    // await this.emailService.send({
    //   to: employee.email,
    //   subject: 'Leave Request Approved',
    //   template: 'leave-request-approved',
    //   data: {
    //     employeeName: `${employee.firstName} ${employee.lastName}`,
    //     leaveType: payload.leaveRequest.leaveType,
    //     startDate: payload.leaveRequest.startDate,
    //     endDate: payload.leaveRequest.endDate,
    //     approverNote: payload.note,
    //   },
    // });
    //
    // // Create in-app notification
    // await this.notificationService.create({
    //   userId: employee.userId,
    //   type: 'LEAVE_APPROVED',
    //   title: 'Leave Request Approved',
    //   message: `Your leave request from ${formatDate(payload.leaveRequest.startDate)} to ${formatDate(payload.leaveRequest.endDate)} has been approved.`,
    //   link: `/hr/leave/requests/${payload.leaveRequest.id}`,
    // });
  }

  /**
   * Handle leave request rejection
   * Notify employee that their leave request was rejected
   */
  @OnEvent('leave.request.rejected')
  async handleLeaveRequestRejected(payload: any) {
    this.logger.log(
      `[Event] Leave request ${payload.leaveRequest.id} rejected by manager ${payload.managerId}`,
    );

    // TODO: Implement actual notification logic
    // Example implementation:
    // const employee = await this.prisma.employee.findUnique({
    //   where: { id: payload.employeeId },
    //   include: { user: true },
    // });
    //
    // await this.emailService.send({
    //   to: employee.email,
    //   subject: 'Leave Request Rejected',
    //   template: 'leave-request-rejected',
    //   data: {
    //     employeeName: `${employee.firstName} ${employee.lastName}`,
    //     leaveType: payload.leaveRequest.leaveType,
    //     startDate: payload.leaveRequest.startDate,
    //     endDate: payload.leaveRequest.endDate,
    //     rejectionReason: payload.reason,
    //   },
    // });
    //
    // // Create in-app notification
    // await this.notificationService.create({
    //   userId: employee.userId,
    //   type: 'LEAVE_REJECTED',
    //   title: 'Leave Request Rejected',
    //   message: `Your leave request has been rejected. Reason: ${payload.reason}`,
    //   link: `/hr/leave/requests/${payload.leaveRequest.id}`,
    // });
  }

  /**
   * Handle leave request cancellation
   * Notify manager if an approved leave request was cancelled
   */
  @OnEvent('leave.request.cancelled')
  async handleLeaveRequestCancelled(payload: any) {
    this.logger.log(
      `[Event] Leave request ${payload.leaveRequest.id} cancelled by employee ${payload.employeeId}`,
    );

    if (payload.wasApproved) {
      // TODO: Implement actual notification logic for manager
      // Example implementation:
      // const employee = await this.prisma.employee.findUnique({
      //   where: { id: payload.employeeId },
      //   include: { organisation: true },
      // });
      //
      // const managers = await this.getOrganizationManagers(employee.orgId);
      //
      // await this.emailService.send({
      //   to: managers.map(m => m.email),
      //   subject: 'Approved Leave Request Cancelled',
      //   template: 'leave-request-cancelled',
      //   data: {
      //     employeeName: `${employee.firstName} ${employee.lastName}`,
      //     leaveType: payload.leaveRequest.leaveType,
      //     startDate: payload.leaveRequest.startDate,
      //     endDate: payload.leaveRequest.endDate,
      //   },
      // });
    }
  }
}
