import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentReminderService } from './payment-reminder.service';
import { ReminderEscalationService } from './reminder-escalation.service';
import {
  CreateReminderDto,
  UpdateReminderSettingsDto,
  ReminderQueryDto,
} from './dto/payment-reminder.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../../auth/rbac/rbac.guard';
import { Permissions } from '../../../auth/rbac/permissions.decorator';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Payment Reminder Controller
 * Manages payment reminder endpoints
 */
@ApiTags('Payment Reminders')
@ApiBearerAuth()
@Controller('organisations/:orgId')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PaymentReminderController {
  constructor(
    private reminderService: PaymentReminderService,
    private escalationService: ReminderEscalationService,
    @InjectQueue('payment-reminders') private reminderQueue: Queue,
  ) {}

  /**
   * Get reminder history for an invoice
   */
  @Get('invoices/:invoiceId/reminders')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get reminder history for an invoice' })
  @ApiResponse({ status: 200, description: 'Reminder history retrieved' })
  async getReminderHistory(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.reminderService.getReminderHistory(orgId, invoiceId);
  }

  /**
   * Create a manual reminder
   */
  @Post('invoices/:invoiceId/reminders')
  @Permissions('invoices:write')
  @ApiOperation({ summary: 'Create a manual payment reminder' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  async createReminder(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreateReminderDto,
  ) {
    return this.reminderService.createReminder(orgId, invoiceId, dto);
  }

  /**
   * Send a reminder immediately
   */
  @Post('invoices/:invoiceId/reminders/:id/send-now')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a reminder immediately' })
  @ApiResponse({ status: 200, description: 'Reminder sent successfully' })
  async sendReminderNow(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.reminderService.sendReminderNow(orgId, id);
    return { message: 'Reminder sent successfully' };
  }

  /**
   * Cancel a reminder
   */
  @Delete('invoices/:invoiceId/reminders/:id')
  @Permissions('invoices:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a pending reminder' })
  @ApiResponse({ status: 204, description: 'Reminder cancelled successfully' })
  async cancelReminder(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.reminderService.cancelReminder(orgId, id);
  }

  /**
   * Schedule automatic reminders for an invoice
   */
  @Post('invoices/:invoiceId/reminders/schedule-auto')
  @Permissions('invoices:write')
  @ApiOperation({ summary: 'Schedule automatic reminders for an invoice' })
  @ApiResponse({ status: 201, description: 'Reminders scheduled successfully' })
  async scheduleAutoReminders(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    // Queue the job
    await this.reminderQueue.add(
      'schedule-for-invoice',
      { invoiceId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return { message: 'Reminders scheduling in progress' };
  }

  /**
   * Get pending reminders for organisation
   */
  @Get('reminders/pending')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all pending reminders for organisation' })
  @ApiResponse({ status: 200, description: 'Pending reminders retrieved' })
  async getPendingReminders(
    @Param('orgId') orgId: string,
    @Query() query: ReminderQueryDto,
  ) {
    return this.reminderService.getPendingReminders(orgId, query);
  }

  /**
   * Get reminder settings
   */
  @Get('reminder-settings')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get reminder settings for organisation' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings(@Param('orgId') orgId: string) {
    return this.reminderService.getSettings(orgId);
  }

  /**
   * Update reminder settings
   */
  @Patch('reminder-settings')
  @Permissions('settings:write')
  @ApiOperation({ summary: 'Update reminder settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateReminderSettingsDto,
  ) {
    return this.reminderService.updateSettings(orgId, dto);
  }

  /**
   * Get escalation statistics
   */
  @Get('reminders/escalation-stats')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get escalation statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getEscalationStats(@Param('orgId') orgId: string) {
    return this.escalationService.getEscalationStats(orgId);
  }

  /**
   * Manually trigger escalation check
   */
  @Post('reminders/check-escalations')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger escalation check' })
  @ApiResponse({ status: 200, description: 'Escalation check queued' })
  async triggerEscalationCheck(@Param('orgId') orgId: string) {
    // Queue the job for this specific organisation
    await this.reminderQueue.add(
      'check-escalations',
      { organisationId: orgId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return { message: 'Escalation check queued' };
  }

  /**
   * Manually escalate an invoice
   */
  @Post('invoices/:invoiceId/escalate')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually escalate an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice escalation queued' })
  async escalateInvoice(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    await this.reminderQueue.add(
      'escalate',
      { invoiceId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return { message: 'Invoice escalation queued' };
  }
}
