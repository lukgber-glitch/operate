/**
 * Conversation Response DTOs
 * Data transfer objects for conversation API responses
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'msg_123' })
  id: string;

  @ApiProperty({ example: 'conv_123' })
  conversationId: string;

  @ApiProperty({
    enum: ['USER', 'ASSISTANT', 'SYSTEM'],
    example: 'ASSISTANT',
  })
  role: string;

  @ApiProperty({
    enum: ['TEXT', 'ACTION_REQUEST', 'ACTION_RESULT', 'UI_COMPONENT', 'SUGGESTION'],
    example: 'TEXT',
  })
  type: string;

  @ApiProperty({ example: 'Here is how you can create an invoice...' })
  content: string;

  @ApiPropertyOptional({ example: 'create_invoice' })
  actionType?: string;

  @ApiPropertyOptional({ example: { amount: 1000, clientId: 'client_123' } })
  actionParams?: Record<string, any>;

  @ApiPropertyOptional({ example: { invoiceId: 'inv_456', status: 'created' } })
  actionResult?: Record<string, any>;

  @ApiPropertyOptional({ example: 'completed' })
  actionStatus?: string;

  @ApiPropertyOptional({ example: 'table' })
  componentType?: string;

  @ApiPropertyOptional({ example: { columns: [], rows: [] } })
  componentData?: Record<string, any>;

  @ApiPropertyOptional({ example: 'claude-3-5-sonnet-20241022' })
  model?: string;

  @ApiPropertyOptional({ example: 150 })
  tokenCount?: number;

  @ApiProperty({ example: '2025-12-03T20:00:00Z' })
  createdAt: Date;

  @ApiPropertyOptional()
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
  }>;
}

export class ConversationResponseDto {
  @ApiProperty({ example: 'conv_123' })
  id: string;

  @ApiProperty({ example: 'org_456' })
  orgId: string;

  @ApiProperty({ example: 'user_789' })
  userId: string;

  @ApiPropertyOptional({ example: 'How to create invoices' })
  title?: string;

  @ApiProperty({
    enum: ['ACTIVE', 'RESOLVED', 'ARCHIVED'],
    example: 'ACTIVE',
  })
  status: string;

  @ApiPropertyOptional({ example: 'invoice' })
  contextType?: string;

  @ApiPropertyOptional({ example: 'inv_123' })
  contextId?: string;

  @ApiPropertyOptional({ example: '/invoices/new' })
  pageContext?: string;

  @ApiPropertyOptional({ example: { language: 'en' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: 5 })
  messageCount: number;

  @ApiPropertyOptional({ example: '2025-12-03T20:00:00Z' })
  lastMessageAt?: Date;

  @ApiPropertyOptional({ example: '2025-12-03T21:00:00Z' })
  resolvedAt?: Date;

  @ApiProperty({ example: '2025-12-03T19:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-03T20:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [MessageResponseDto] })
  messages?: MessageResponseDto[];
}

export class PaginatedConversationsResponseDto {
  @ApiProperty({ type: [ConversationResponseDto] })
  conversations: ConversationResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;

  @ApiProperty({ example: true })
  hasMore: boolean;
}
