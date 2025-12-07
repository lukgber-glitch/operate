import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional } from 'class-validator';
import { PeppolEventType } from '../types/peppol.types';

/**
 * Peppol Webhook DTO
 */
export class PeppolWebhookDto {
  eventType: PeppolEventType;

  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  participantId: string;

  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsString()
  @IsOptional()
  signature?: string;
}
