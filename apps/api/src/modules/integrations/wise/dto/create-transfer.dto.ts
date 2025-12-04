import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transfer Details DTO
 */
export class TransferDetailsDto {
  @ApiProperty({
    description: 'Transfer reference/description (visible to recipient)',
    example: 'Invoice #12345',
  })
  @IsString()
  reference: string;

  @ApiPropertyOptional({
    description: 'Transfer purpose code (required for some corridors)',
    example: 'verification.transfers.purpose.invoice.payment',
  })
  @IsOptional()
  @IsString()
  transferPurpose?: string;

  @ApiPropertyOptional({
    description: 'Sub-purpose code',
  })
  @IsOptional()
  @IsString()
  transferPurposeSubTransferPurpose?: string;

  @ApiPropertyOptional({
    description: 'Source of funds (required for compliance)',
    example: 'verification.source.of.funds.business',
  })
  @IsOptional()
  @IsString()
  sourceOfFunds?: string;
}

/**
 * Create Transfer DTO
 */
export class CreateTransferDto {
  @ApiProperty({
    description: 'Recipient account ID',
    example: 12345678,
  })
  @IsNumber()
  targetAccount: number;

  @ApiProperty({
    description: 'Quote UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  quoteUuid: string;

  @ApiPropertyOptional({
    description: 'Your internal transaction ID (for idempotency)',
    example: 'TXN-2024-001',
  })
  @IsOptional()
  @IsString()
  customerTransactionId?: string;

  @ApiProperty({
    description: 'Transfer details',
    type: TransferDetailsDto,
  })
  @ValidateNested()
  @Type(() => TransferDetailsDto)
  details: TransferDetailsDto;
}
