/**
 * Create Conversation DTO
 * Data transfer object for creating a new AI assistant conversation
 */

import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Initial conversation title',
    example: 'How do I create an invoice?',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Context type for the conversation',
    example: 'invoice',
    enum: ['invoice', 'expense', 'tax', 'payroll', 'general'],
  })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional({
    description: 'Context ID - reference to related entity',
    example: 'inv_123',
  })
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiPropertyOptional({
    description: 'Page context where conversation was started',
    example: '/invoices/new',
  })
  @IsOptional()
  @IsString()
  pageContext?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'help_button', language: 'en' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
