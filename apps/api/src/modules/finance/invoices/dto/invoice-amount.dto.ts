import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for invoice amounts in multiple currencies
 *
 * Used to display invoice amounts in both original and converted currencies
 */
export class InvoiceAmountDto {
  @ApiProperty({
    description: 'Amount value',
    example: 1234.56,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
  })
  currency: string;

  @ApiProperty({
    description: 'Formatted amount with currency symbol',
    example: '€1,234.56',
  })
  formatted: string;

  @ApiPropertyOptional({
    description: 'Converted amount details (if conversion was requested)',
    type: 'object',
    properties: {
      amount: { type: 'number', example: 1320.45 },
      currency: { type: 'string', example: 'USD' },
      formatted: { type: 'string', example: '$1,320.45' },
      exchangeRate: { type: 'number', example: 1.07 },
    },
  })
  converted?: {
    amount: number;
    currency: string;
    formatted: string;
    exchangeRate: number;
  };
}

/**
 * DTO for invoice totals in multiple currencies
 */
export class InvoiceTotalsDto {
  @ApiProperty({
    description: 'Subtotal (before tax)',
    type: InvoiceAmountDto,
  })
  subtotal: InvoiceAmountDto;

  @ApiProperty({
    description: 'Tax amount',
    type: InvoiceAmountDto,
  })
  taxAmount: InvoiceAmountDto;

  @ApiProperty({
    description: 'Total amount (including tax)',
    type: InvoiceAmountDto,
  })
  totalAmount: InvoiceAmountDto;

  @ApiPropertyOptional({
    description: 'Exchange rate used (if currency conversion was applied)',
    example: 1.07,
  })
  exchangeRate?: number;
}
