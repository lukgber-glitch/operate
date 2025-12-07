import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

/**
 * Void reason codes
 */
export enum VoidReasonCode {
  UNSPECIFIED = 'Unspecified',
  POST_FAILED = 'PostFailed',
  DOC_DELETED = 'DocDeleted',
  DOC_VOIDED = 'DocVoided',
  ADJUSTMENT_CANCELLED = 'AdjustmentCancelled',
}

/**
 * Void Transaction Request DTO
 */
export class VoidTransactionDto {
  @ApiProperty({
    example: 'INV-12345',
    description: 'Transaction code to void',
  })
  @IsString()
  transactionCode: string;

  @ApiProperty({
    example: 'DOC_VOIDED',
    enum: VoidReasonCode,
    description: 'Reason for voiding the transaction',
  })
  code: VoidReasonCode;

  @ApiPropertyOptional({
    example: 'SalesInvoice',
    description: 'Document type',
  })
  @IsString()
  @IsOptional()
  documentType?: string;
}

/**
 * Void Transaction Response DTO
 */
export class VoidTransactionResponseDto {
  @ApiProperty({ example: 'INV-12345' })
  code: string;

  @ApiProperty({ example: 'Cancelled' })
  status: string;

  @ApiProperty({ example: '2024-12-02T10:00:00Z' })
  modifiedDate: string;

  @ApiPropertyOptional()
  messages?: Array<{
    severity: string;
    summary: string;
    details?: string;
  }>;
}
