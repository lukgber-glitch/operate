import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import { PersonaInquiryService } from './services/persona-inquiry.service';
import { PersonaVerificationService } from './services/persona-verification.service';
import { PrismaService } from '../../database/prisma.service';
import {
  PERSONA_WEBHOOK_EVENTS,
  PersonaInquiryStatus,
  PersonaWebhookPayload,
} from './types/persona.types';

/**
 * Persona Webhook Controller
 * Handles incoming webhook events from Persona
 *
 * Supported Events:
 * - inquiry.completed - Inquiry completed by user
 * - inquiry.expired - Inquiry expired without completion
 * - inquiry.failed - Inquiry failed verification
 * - inquiry.marked-for-review - Inquiry needs manual review
 * - inquiry.approved - Inquiry approved (passed all checks)
 * - inquiry.declined - Inquiry declined (failed checks)
 * - verification.created - New verification created
 * - verification.passed - Verification passed
 * - verification.failed - Verification failed
 *
 * Security:
 * - All webhooks are verified using HMAC-SHA256 signature
 * - Raw body is required for signature verification
 * - Events are idempotent and safe to retry
 * - Webhook logs stored for audit trail
 */
@ApiTags('persona-webhooks')
@Controller('integrations/persona/webhooks')
export class PersonaWebhookController {
  private readonly logger = new Logger(PersonaWebhookController.name);

  constructor(
    private readonly personaService: PersonaService,
    private readonly inquiryService: PersonaInquiryService,
    private readonly verificationService: PersonaVerificationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle Persona webhook events
   * Requires raw body for signature verification
   */
  @Post()
  @ApiOperation({ summary: 'Receive Persona webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('persona-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
    @Body() payload: PersonaWebhookPayload,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing persona-signature header');
    }

    // Get raw body (required for signature verification)
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'Missing raw body for signature verification',
      );
    }

    try {
      // Verify webhook signature
      const isValid = this.personaService.verifyWebhookSignature(
        rawBody.toString(),
        signature,
      );

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        await this.logWebhookEvent(payload, 'FAILED', 'Invalid signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log(
        `Received webhook event: ${payload.data.type} (ID: ${payload.data.id})`,
      );

      // Determine event type from payload
      const eventType = this.getEventType(payload);

      // Process event based on type
      await this.processEvent(eventType, payload);

      // Log successful webhook processing
      await this.logWebhookEvent(payload, 'SUCCESS');

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      await this.logWebhookEvent(payload, 'FAILED', error.message);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * Get event type from webhook payload
   */
  private getEventType(payload: PersonaWebhookPayload): string {
    // Event type is typically in the data.type field or can be inferred from status changes
    const dataType = payload.data.type;
    const status = payload.data.attributes?.status;

    if (dataType === 'inquiry') {
      if (status === 'completed') return PERSONA_WEBHOOK_EVENTS.INQUIRY_COMPLETED;
      if (status === 'approved') return PERSONA_WEBHOOK_EVENTS.INQUIRY_APPROVED;
      if (status === 'declined') return PERSONA_WEBHOOK_EVENTS.INQUIRY_DECLINED;
      if (status === 'expired') return PERSONA_WEBHOOK_EVENTS.INQUIRY_EXPIRED;
      if (status === 'failed') return PERSONA_WEBHOOK_EVENTS.INQUIRY_FAILED;
      if (status === 'needs_review')
        return PERSONA_WEBHOOK_EVENTS.INQUIRY_MARKED_FOR_REVIEW;
    }

    if (dataType.includes('verification')) {
      if (status === 'passed') return PERSONA_WEBHOOK_EVENTS.VERIFICATION_PASSED;
      if (status === 'failed') return PERSONA_WEBHOOK_EVENTS.VERIFICATION_FAILED;
      return PERSONA_WEBHOOK_EVENTS.VERIFICATION_CREATED;
    }

    return 'unknown';
  }

  /**
   * Process webhook event based on type
   */
  private async processEvent(
    eventType: string,
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    switch (eventType) {
      case PERSONA_WEBHOOK_EVENTS.INQUIRY_COMPLETED:
        await this.handleInquiryCompleted(payload);
        break;

      case PERSONA_WEBHOOK_EVENTS.INQUIRY_APPROVED:
        await this.handleInquiryApproved(payload);
        break;

      case PERSONA_WEBHOOK_EVENTS.INQUIRY_DECLINED:
        await this.handleInquiryDeclined(payload);
        break;

      case PERSONA_WEBHOOK_EVENTS.INQUIRY_EXPIRED:
        await this.handleInquiryExpired(payload);
        break;

      case PERSONA_WEBHOOK_EVENTS.INQUIRY_FAILED:
        await this.handleInquiryFailed(payload);
        break;

      case PERSONA_WEBHOOK_EVENTS.INQUIRY_MARKED_FOR_REVIEW:
        await this.handleInquiryMarkedForReview(payload);
        break;

      case PERSONA_WEBHOOK_EVENTS.VERIFICATION_CREATED:
      case PERSONA_WEBHOOK_EVENTS.VERIFICATION_PASSED:
      case PERSONA_WEBHOOK_EVENTS.VERIFICATION_FAILED:
        await this.handleVerificationEvent(payload);
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }
  }

  // Inquiry Event Handlers

  private async handleInquiryCompleted(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(`Processing inquiry.completed for ${payload.data.id}`);

    await this.inquiryService.updateInquiryStatus(
      payload.data.id,
      PersonaInquiryStatus.COMPLETED,
    );

    // Process verifications
    await this.verificationService.processVerificationResults(payload.data.id);
  }

  private async handleInquiryApproved(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(`Processing inquiry.approved for ${payload.data.id}`);

    await this.inquiryService.updateInquiryStatus(
      payload.data.id,
      PersonaInquiryStatus.APPROVED,
    );

    // Process verifications
    await this.verificationService.processVerificationResults(payload.data.id);

    // TODO: Trigger post-approval actions (e.g., enable account features)
  }

  private async handleInquiryDeclined(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(`Processing inquiry.declined for ${payload.data.id}`);

    await this.inquiryService.updateInquiryStatus(
      payload.data.id,
      PersonaInquiryStatus.DECLINED,
    );

    // Process verifications to get failure reasons
    const results = await this.verificationService.processVerificationResults(
      payload.data.id,
    );

    // TODO: Send notification to user about declined verification
    this.logger.log(
      `Inquiry ${payload.data.id} declined. Reasons: ${results.failureReasons?.join(', ')}`,
    );
  }

  private async handleInquiryExpired(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(`Processing inquiry.expired for ${payload.data.id}`);

    await this.inquiryService.updateInquiryStatus(
      payload.data.id,
      PersonaInquiryStatus.EXPIRED,
    );

    // TODO: Send notification to user about expired inquiry
  }

  private async handleInquiryFailed(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(`Processing inquiry.failed for ${payload.data.id}`);

    await this.inquiryService.updateInquiryStatus(
      payload.data.id,
      PersonaInquiryStatus.FAILED,
    );

    // TODO: Log error and notify support team
  }

  private async handleInquiryMarkedForReview(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(
      `Processing inquiry.marked-for-review for ${payload.data.id}`,
    );

    await this.inquiryService.updateInquiryStatus(
      payload.data.id,
      PersonaInquiryStatus.NEEDS_REVIEW,
    );

    // TODO: Notify compliance team for manual review
  }

  // Verification Event Handlers

  private async handleVerificationEvent(
    payload: PersonaWebhookPayload,
  ): Promise<void> {
    this.logger.log(
      `Processing verification event for ${payload.data.id}`,
    );

    // Get inquiry ID from payload relationships
    const inquiryId = payload.data.attributes?.['inquiry-id'];
    if (inquiryId) {
      // Re-process verification results
      await this.verificationService.processVerificationResults(inquiryId);
    }
  }

  // Helper Methods

  private async logWebhookEvent(
    payload: PersonaWebhookPayload,
    status: 'SUCCESS' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO persona_webhook_logs
        (event_id, event_type, status, payload, error_message, created_at)
        VALUES
        (
          ${payload.data.id},
          ${payload.data.type},
          ${status},
          ${JSON.stringify(payload)}::jsonb,
          ${errorMessage || null},
          NOW()
        )
      `;
    } catch (error) {
      this.logger.error('Failed to log webhook event', error);
    }
  }
}
