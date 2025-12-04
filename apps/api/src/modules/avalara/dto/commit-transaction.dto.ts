import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * Commit Transaction Request DTO
 */
export class CommitTransactionDto {
  @ApiProperty({
    example: 'INV-12345',
    description: 'Transaction code to commit',
  })
  @IsString()
  transactionCode: string;

  @ApiPropertyOptional({
    example: 'SalesInvoice',
    description: 'Document type',
  })
  @IsString()
  @IsOptional()
  documentType?: string;
}

/**
 * Commit Transaction Response DTO
 */
export class CommitTransactionResponseDto {
  @ApiProperty({ example: 'INV-12345' })
  code: string;

  @ApiProperty({ example: 'Committed' })
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
