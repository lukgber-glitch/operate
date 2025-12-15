import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuoteItemDto } from './create-quote-item.dto';

/**
 * DTO for creating a new quote
 */
export class CreateQuoteDto {
  @ApiProperty({
    description: 'Quote title',
    example: 'Website Development Proposal',
  })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiPropertyOptional({
    description: 'Quote description',
    example: 'Complete website redesign with modern UI/UX',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Client ID (if client exists in system)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Valid until date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({
    description: 'Quote line items',
    type: [CreateQuoteItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];

  @ApiPropertyOptional({
    description: 'Customer-facing notes/terms',
    example: 'Payment terms: 50% upfront, 50% on completion',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Terms and conditions',
    example: 'This quote is valid for 30 days...',
  })
  @IsOptional()
  @IsString()
  terms?: string;
}
