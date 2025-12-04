import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { GustoService } from './gusto.service';
import { GustoEmployeeService } from './services/gusto-employee.service';
import { GustoEncryptionUtil } from './utils/gusto-encryption.util';
import {
  GustoWebhookPayload,
  GustoWebhookEventType,
} from './gusto.types';

/**
 * Gusto Webhook Controller
 * Handles webhook events from Gusto for real-time updates
 *
 * Webhook Events:
 * - company.created/updated
 * - employee.created/updated/terminated
 * - payroll.created/updated/processed/cancelled
 * - payment.initiated/completed/failed
 */
@ApiTags('integrations/gusto/webhooks')
@Controller('integrations/gusto/webhooks')
export class GustoWebhookController {
  private readonly logger = new Logger(GustoWebhookController.name);

  constructor(
    private readonly gustoService: GustoService,
    private readonly employeeService: GustoEmployeeService,
    private readonly encryption: GustoEncryptionUtil,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Receive Gusto webhook events' })
  @ApiHeader({ name: 'X-Gusto-Signature', required: true })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-gusto-signature') signature: string,
    @Body() payload: GustoWebhookPayload,
  ): Promise<{ received: boolean }> {
    this.logger.log('Received Gusto webhook', {
      eventType: payload.event_type,
      entityType: payload.entity_type,
      companyUuid: payload.company_uuid,
    });

    // Verify webhook signature
    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(payload);
    const webhookSecret = this.gustoService.getConfig().webhookSecret;

    if (!this.encryption.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      this.logger.error('Invalid webhook signature', { signature });
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process webhook based on event type
    try {
      await this.processWebhook(payload);

      // TODO: Log webhook event in database
      // await this.logWebhookEvent({
      //   eventId: payload.resource_uuid || 'unknown',
      //   eventType: payload.event_type,
      //   status: 'SUCCESS',
      // });

      return { received: true };
    } catch (error) {
      this.logger.error('Failed to process webhook', {
        eventType: payload.event_type,
        error: error.message,
      });

      // TODO: Log webhook error
      // await this.logWebhookEvent({
      //   eventId: payload.resource_uuid || 'unknown',
      //   eventType: payload.event_type,
      //   status: 'FAILED',
      //   errorMessage: error.message,
      // });

      throw error;
    }
  }

  /**
   * Process webhook based on event type
   */
  private async processWebhook(payload: GustoWebhookPayload): Promise<void> {
    switch (payload.event_type) {
      case GustoWebhookEventType.COMPANY_CREATED:
        await this.handleCompanyCreated(payload);
        break;

      case GustoWebhookEventType.COMPANY_UPDATED:
        await this.handleCompanyUpdated(payload);
        break;

      case GustoWebhookEventType.EMPLOYEE_CREATED:
        await this.handleEmployeeCreated(payload);
        break;

      case GustoWebhookEventType.EMPLOYEE_UPDATED:
        await this.handleEmployeeUpdated(payload);
        break;

      case GustoWebhookEventType.EMPLOYEE_TERMINATED:
        await this.handleEmployeeTerminated(payload);
        break;

      case GustoWebhookEventType.PAYROLL_CREATED:
        await this.handlePayrollCreated(payload);
        break;

      case GustoWebhookEventType.PAYROLL_UPDATED:
        await this.handlePayrollUpdated(payload);
        break;

      case GustoWebhookEventType.PAYROLL_PROCESSED:
        await this.handlePayrollProcessed(payload);
        break;

      case GustoWebhookEventType.PAYROLL_CANCELLED:
        await this.handlePayrollCancelled(payload);
        break;

      case GustoWebhookEventType.PAYMENT_INITIATED:
        await this.handlePaymentInitiated(payload);
        break;

      case GustoWebhookEventType.PAYMENT_COMPLETED:
        await this.handlePaymentCompleted(payload);
        break;

      case GustoWebhookEventType.PAYMENT_FAILED:
        await this.handlePaymentFailed(payload);
        break;

      default:
        this.logger.warn('Unhandled webhook event type', {
          eventType: payload.event_type,
        });
    }
  }

  // ==================== Company Webhook Handlers ====================

  private async handleCompanyCreated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing company.created', {
      companyUuid: payload.company_uuid,
    });

    // TODO: Update company in database
    // Mark as fully provisioned and active
  }

  private async handleCompanyUpdated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing company.updated', {
      companyUuid: payload.company_uuid,
    });

    // TODO: Sync company details
    // const accessToken = await this.getAccessToken(payload.company_uuid);
    // const company = await this.gustoService.getCompany(accessToken, payload.company_uuid);
    // await this.updateCompanyInDatabase(company);
  }

  // ==================== Employee Webhook Handlers ====================

  private async handleEmployeeCreated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing employee.created', {
      companyUuid: payload.company_uuid,
      employeeUuid: payload.entity_uuid,
    });

    // TODO: Create employee in Operate database
    // const accessToken = await this.getAccessToken(payload.company_uuid);
    // const employee = await this.employeeService.getEmployee(
    //   accessToken,
    //   payload.entity_uuid,
    // );
    // await this.createEmployeeInDatabase(employee, payload.company_uuid);
  }

  private async handleEmployeeUpdated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing employee.updated', {
      companyUuid: payload.company_uuid,
      employeeUuid: payload.entity_uuid,
    });

    // TODO: Update employee in Operate database
    // const accessToken = await this.getAccessToken(payload.company_uuid);
    // const employee = await this.employeeService.getEmployee(
    //   accessToken,
    //   payload.entity_uuid,
    // );
    // await this.updateEmployeeInDatabase(employee);
  }

  private async handleEmployeeTerminated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing employee.terminated', {
      companyUuid: payload.company_uuid,
      employeeUuid: payload.entity_uuid,
    });

    // TODO: Mark employee as terminated
    // await this.terminateEmployeeInDatabase(payload.entity_uuid);
  }

  // ==================== Payroll Webhook Handlers ====================

  private async handlePayrollCreated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payroll.created', {
      companyUuid: payload.company_uuid,
      payrollUuid: payload.entity_uuid,
    });

    // TODO: Create payroll record
    // Notify relevant users about new payroll
  }

  private async handlePayrollUpdated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payroll.updated', {
      companyUuid: payload.company_uuid,
      payrollUuid: payload.entity_uuid,
    });

    // TODO: Sync payroll details
  }

  private async handlePayrollProcessed(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payroll.processed', {
      companyUuid: payload.company_uuid,
      payrollUuid: payload.entity_uuid,
    });

    // TODO: Mark payroll as processed
    // Create accounting entries
    // Send notifications
  }

  private async handlePayrollCancelled(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payroll.cancelled', {
      companyUuid: payload.company_uuid,
      payrollUuid: payload.entity_uuid,
    });

    // TODO: Mark payroll as cancelled
    // Reverse any pending accounting entries
  }

  // ==================== Payment Webhook Handlers ====================

  private async handlePaymentInitiated(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payment.initiated', {
      companyUuid: payload.company_uuid,
      paymentUuid: payload.entity_uuid,
    });

    // TODO: Track payment initiation
  }

  private async handlePaymentCompleted(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payment.completed', {
      companyUuid: payload.company_uuid,
      paymentUuid: payload.entity_uuid,
    });

    // TODO: Mark payment as completed
    // Update accounting records
  }

  private async handlePaymentFailed(payload: GustoWebhookPayload): Promise<void> {
    this.logger.log('Processing payment.failed', {
      companyUuid: payload.company_uuid,
      paymentUuid: payload.entity_uuid,
    });

    // TODO: Mark payment as failed
    // Send alert notifications
    // Log error for review
  }

  /**
   * Helper: Get access token for company
   * TODO: Implement database lookup
   */
  private async getAccessToken(companyUuid: string): Promise<string> {
    // TODO: Fetch from database and decrypt
    throw new Error('Not implemented');
  }
}
