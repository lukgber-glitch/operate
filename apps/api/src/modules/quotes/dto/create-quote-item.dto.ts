import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Length,
} from 'class-validator';

/**
 * DTO for creating quote line item
 */
export class CreateQuoteItemDto {
  @ApiProperty({
    description: 'Item description',
    example: 'Website Development - Premium Package',
  })
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit price (before tax)',
    example: 5000.0,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Tax rate (percentage)',
    example: 19,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
