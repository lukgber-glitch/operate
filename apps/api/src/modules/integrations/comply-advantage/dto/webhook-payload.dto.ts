import { IsString, IsEnum, IsObject, IsOptional, IsArray } from 'class-validator';

/**
 * DTO for webhook event types
 */
export enum WebhookEventType {
  SEARCH_UPDATED = 'search_updated',
  MONITORING_MATCH = 'monitoring_match',
  NEW_SOURCE_ADDED = 'new_source_added',
}

/**
 * DTO for ComplyAdvantage webhook payload
 */
export class WebhookPayloadDto {
  @IsEnum(WebhookEventType)
  event_type: WebhookEventType;

  @IsString()
  search_id: string;

  @IsOptional()
  @IsString()
  monitoring_id?: string;

  @IsString()
  created_at: string;

  @IsObject()
  data: {
    new_hits?: any[];
    updated_hits?: any[];
    removed_hits?: string[];
  };
}

/**
 * DTO for monitoring request
 */
export class CreateMonitoringDto {
  @IsString()
  screeningId: string;

  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency: 'daily' | 'weekly' | 'monthly';
}

/**
 * DTO for listing screenings
 */
export class ListScreeningsDto {
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  offset?: string;
}
