/**
 * InvoiceNow Webhook DTO
 * Request body for webhook events
 */

import { IsString } from 'class-validator';

export class InvoiceNowWebhookDto {
  @IsString()
  organizationId: string;

  @IsString()
  messageId: string;

  @IsString()
  soapEnvelope: string;
}
