import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  IsEnum,
  IsUrl,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeliveryMethod {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  BOTH = 'both',
  SAVE_ONLY = 'save_only',
}

export class EmailDeliveryDto {
  @ApiProperty({
    description: 'List of recipient email addresses',
    type: [String],
    example: ['finance@company.com', 'cfo@company.com'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiPropertyOptional({
    description: 'CC email addresses',
    type: [String],
    example: ['accounting@company.com'],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC email addresses',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({
    description: 'Email subject line template (supports variables: {{reportType}}, {{period}}, {{generatedAt}})',
    example: 'Monthly {{reportType}} Report - {{period}}',
  })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiPropertyOptional({
    description: 'Email body template (supports variables)',
    example: 'Please find attached your {{reportType}} report for {{period}}.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  @ApiPropertyOptional({
    description: 'Reply-to email address',
    example: 'noreply@company.com',
  })
  @IsOptional()
  @IsEmail()
  replyTo?: string;
}

export class WebhookDeliveryDto {
  @ApiProperty({
    description: 'Webhook URL to send report data',
    example: 'https://api.company.com/webhooks/reports',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    description: 'Custom headers for webhook request',
    example: { 'X-API-Key': 'secret-key' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'HTTP method for webhook',
    enum: ['POST', 'PUT'],
    default: 'POST',
  })
  @IsOptional()
  @IsEnum(['POST', 'PUT'])
  method?: 'POST' | 'PUT';

  @ApiPropertyOptional({
    description: 'Include report file as base64 in webhook payload',
    default: false,
  })
  @IsOptional()
  includeFile?: boolean;
}

export class DeliveryConfigDto {
  @ApiProperty({
    description: 'Delivery method',
    enum: DeliveryMethod,
    example: 'EMAIL',
  })
  method: DeliveryMethod;

  @ApiPropertyOptional({
    description: 'Email delivery configuration',
    type: EmailDeliveryDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailDeliveryDto)
  email?: EmailDeliveryDto;

  @ApiPropertyOptional({
    description: 'Webhook delivery configuration',
    type: WebhookDeliveryDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookDeliveryDto)
  webhook?: WebhookDeliveryDto;

  @ApiPropertyOptional({
    description: 'Maximum file size for attachments in MB',
    default: 25,
  })
  @IsOptional()
  maxFileSizeMb?: number;

  @ApiPropertyOptional({
    description: 'Retry configuration for failed deliveries',
    example: { maxAttempts: 3, backoffMs: 5000 },
  })
  @IsOptional()
  @IsObject()
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}
