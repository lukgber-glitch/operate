import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single imported transaction
 */
export class ImportedTransactionDto {
  @ApiProperty({
    description: 'External transaction ID from bank',
    example: 'TXN-123456',
  })
  @IsString()
  externalId: string;

  @ApiProperty({
    description: 'Transaction date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Payment from ACME Corp',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Transaction amount (positive for credit, negative for debit)',
    example: 1500.00,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
  })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({
    description: 'Transaction type (credit or debit)',
    example: 'credit',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Counterparty name',
    example: 'ACME Corp GmbH',
  })
  @IsOptional()
  @IsString()
  counterpartyName?: string;

  @ApiProperty({
    description: 'Counterparty IBAN',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  counterpartyIban?: string;

  @ApiProperty({
    description: 'Payment reference',
    example: 'INV-2024-001',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: 'Booking text from bank',
    example: 'SEPA Transfer',
  })
  @IsOptional()
  @IsString()
  bookingText?: string;
}

/**
 * DTO for importing bank transactions
 */
export class ImportTransactionsDto {
  @ApiProperty({
    description: 'Array of transactions to import',
    type: [ImportedTransactionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportedTransactionDto)
  transactions: ImportedTransactionDto[];
}
