import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Merchant information extracted from receipt
 */
export class MerchantDto {
  @ApiPropertyOptional({ description: 'Merchant name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Merchant address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Merchant phone number' })
  phone?: string;

  @ApiProperty({ description: 'Confidence score (0-1)', minimum: 0, maximum: 1 })
  confidence: number;
}

/**
 * Date information extracted from receipt
 */
export class DateDto {
  @ApiPropertyOptional({ description: 'Receipt date' })
  value?: Date;

  @ApiProperty({ description: 'Confidence score (0-1)', minimum: 0, maximum: 1 })
  confidence: number;
}

/**
 * Total amounts extracted from receipt
 */
export class TotalsDto {
  @ApiPropertyOptional({ description: 'Total amount' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  tax?: number;

  @ApiPropertyOptional({ description: 'Tip amount' })
  tip?: number;

  @ApiPropertyOptional({ description: 'Currency code (e.g., EUR, USD)' })
  currency?: string;

  @ApiProperty({ description: 'Confidence score (0-1)', minimum: 0, maximum: 1 })
  confidence: number;
}

/**
 * Line item extracted from receipt
 */
export class LineItemDto {
  @ApiProperty({ description: 'Item description' })
  description: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price' })
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Total price for this item' })
  totalPrice?: number;

  @ApiProperty({ description: 'Confidence score (0-1)', minimum: 0, maximum: 1 })
  confidence: number;
}

/**
 * Complete receipt parse result
 */
export class ReceiptParseResultDto {
  @ApiProperty({ description: 'Whether parsing was successful' })
  success: boolean;

  @ApiProperty({ description: 'Overall confidence score (0-1)', minimum: 0, maximum: 1 })
  confidence: number;

  @ApiProperty({ description: 'Merchant information', type: MerchantDto })
  merchant: MerchantDto;

  @ApiProperty({ description: 'Date information', type: DateDto })
  date: DateDto;

  @ApiPropertyOptional({ description: 'Time of transaction (HH:MM format)' })
  time?: string;

  @ApiProperty({ description: 'Total amounts', type: TotalsDto })
  totals: TotalsDto;

  @ApiProperty({ description: 'Line items', type: [LineItemDto] })
  lineItems: LineItemDto[];

  @ApiPropertyOptional({ description: 'Payment method used' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Receipt number/ID' })
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Raw API response for debugging' })
  rawResponse?: any;

  @ApiPropertyOptional({ description: 'Error message if parsing failed' })
  errorMessage?: string;
}

/**
 * Async job result DTO
 */
export class AsyncJobDto {
  @ApiProperty({ description: 'Job ID for polling' })
  jobId: string;

  @ApiProperty({ description: 'Job status' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ description: 'Estimated completion time' })
  estimatedCompletionTime?: Date;
}

/**
 * Health check result
 */
export class MindeeHealthDto {
  @ApiProperty({ description: 'Service is available' })
  available: boolean;

  @ApiProperty({ description: 'Response time in milliseconds' })
  responseTime: number;

  @ApiPropertyOptional({ description: 'Error message if unavailable' })
  error?: string;

  @ApiProperty({ description: 'Mock mode is active' })
  mockMode: boolean;
}
