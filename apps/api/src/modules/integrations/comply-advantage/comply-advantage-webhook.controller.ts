import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ComplyAdvantageService } from './comply-advantage.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { ComplyAdvantageEncryptionUtil } from './utils/comply-advantage-encryption.util';

/**
 * ComplyAdvantage Webhook Controller
 * Handles incoming webhooks from ComplyAdvantage
 */
@Controller('aml/webhooks')
export class ComplyAdvantageWebhookController {
  private readonly logger = new Logger(ComplyAdvantageWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly complyAdvantageService: ComplyAdvantageService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret =
      this.configService.get<string>('COMPLY_ADVANTAGE_WEBHOOK_SECRET') || '';
  }

  /**
   * Handle ComplyAdvantage webhooks
   * POST /aml/webhooks
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-complyadvantage-signature') signature: string,
    @Headers('x-complyadvantage-timestamp') timestamp: string,
  ) {
    try {
      this.logger.log('Received webhook', {
        eventType: payload.event_type,
        searchId: payload.search_id,
        timestamp,
      });

      // Verify webhook signature
      if (this.webhookSecret) {
        this.verifyWebhookSignature(payload, signature);
      }

      // Process webhook based on event type
      switch (payload.event_type) {
        case 'search_updated':
          await this.handleSearchUpdated(payload);
          break;

        case 'monitoring_match':
          await this.handleMonitoringMatch(payload);
          break;

        case 'new_source_added':
          await this.handleNewSourceAdded(payload);
          break;

        default:
          this.logger.warn('Unknown webhook event type', {
            eventType: payload.event_type,
          });
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(
    payload: WebhookPayloadDto,
    signature: string,
  ): void {
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const payloadString = JSON.stringify(payload);
    const isValid = ComplyAdvantageEncryptionUtil.verifyWebhookSignature(
      payloadString,
      signature,
      this.webhookSecret,
    );

    if (!isValid) {
      this.logger.error('Invalid webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.debug('Webhook signature verified successfully');
  }

  /**
   * Handle search_updated event
   */
  private async handleSearchUpdated(payload: WebhookPayloadDto): Promise<void> {
    this.logger.log('Processing search_updated event', {
      searchId: payload.search_id,
    });

    // Implementation: Update screening record with new data
    // This could include new matches, updated scores, etc.

    if (payload.data.new_hits && payload.data.new_hits.length > 0) {
      await this.complyAdvantageService.monitoring.processMonitoringUpdate(
        payload.search_id,
        payload.data.new_hits,
      );
    }
  }

  /**
   * Handle monitoring_match event
   */
  private async handleMonitoringMatch(payload: WebhookPayloadDto): Promise<void> {
    this.logger.log('Processing monitoring_match event', {
      searchId: payload.search_id,
      monitoringId: payload.monitoring_id,
    });

    // Process new matches found during ongoing monitoring
    if (payload.data.new_hits && payload.data.new_hits.length > 0) {
      await this.complyAdvantageService.monitoring.processMonitoringUpdate(
        payload.search_id,
        payload.data.new_hits,
      );
    }
  }

  /**
   * Handle new_source_added event
   */
  private async handleNewSourceAdded(payload: WebhookPayloadDto): Promise<void> {
    this.logger.log('Processing new_source_added event', {
      searchId: payload.search_id,
    });

    // Implementation: Log that a new source was added to a match
    // This is informational and may trigger a re-review
  }

  /**
   * Webhook health check
   * GET /aml/webhooks/health
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  async webhookHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      webhookSecretConfigured: !!this.webhookSecret,
    };
  }
}
