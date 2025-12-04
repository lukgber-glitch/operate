import {
  IsString,
  IsOptional,
  IsDate,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query Invoice Status DTO
 */
export class QueryStatusDto {
  @ApiPropertyOptional({
    description: 'Chorus Pro invoice ID',
    example: 'CHO-123456789',
  })
  @IsString()
  @IsOptional()
  chorusInvoiceId?: string;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'FAC2024-001',
  })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Supplier SIRET (14 digits)',
    example: '12345678901234',
  })
  @IsString()
  @Length(14, 14)
  @IsOptional()
  supplierSiret?: string;

  @ApiPropertyOptional({
    description: 'Recipient SIRET (14 digits)',
    example: '98765432109876',
  })
  @IsString()
  @Length(14, 14)
  @IsOptional()
  recipientSiret?: string;

  @ApiPropertyOptional({
    description: 'Start date for query range',
    example: '2024-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'End date for query range',
    example: '2024-12-31',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateTo?: Date;
}
