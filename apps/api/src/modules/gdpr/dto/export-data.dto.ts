/**
 * GDPR Data Export DTOs
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class ExportDataRequestDto {
  @ApiProperty({
    description: 'Specific data categories to export (optional, exports all if not specified)',
    example: ['profile', 'conversations', 'transactions'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({
    description: 'Export format',
    example: 'json',
    enum: ['json', 'csv'],
    default: 'json',
    required: false,
  })
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv';
}

export class ExportDataResponseDto {
  @ApiProperty({ description: 'User profile data' })
  profile: any;

  @ApiProperty({ description: 'User conversations' })
  conversations: any[];

  @ApiProperty({ description: 'User messages' })
  messages: any[];

  @ApiProperty({ description: 'User sessions' })
  sessions: any[];

  @ApiProperty({ description: 'User consents' })
  consents: any[];

  @ApiProperty({ description: 'Organization memberships' })
  memberships: any[];

  @ApiProperty({ description: 'OAuth accounts' })
  oauthAccounts: any[];

  @ApiProperty({ description: 'Usage events' })
  usageEvents: any[];

  @ApiProperty({ description: 'Export metadata' })
  metadata: {
    exportedAt: Date;
    userId: string;
    format: string;
    totalRecords: number;
  };
}
