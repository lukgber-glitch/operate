/**
 * Classification DTOs
 */

import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassifyTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Amazon Web Services EMEA' })
  @IsString()
  description!: string;

  @ApiProperty({ example: -125.50 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency!: string;

  @ApiProperty({ example: '2024-11-29' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'Amazon Web Services EMEA SARL' })
  @IsOptional()
  @IsString()
  counterparty?: string;

  @ApiPropertyOptional({ example: '7372' })
  @IsOptional()
  @IsString()
  mccCode?: string;
}

export class ClassifyBatchDto {
  @ApiProperty({ type: [ClassifyTransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassifyTransactionDto)
  transactions!: ClassifyTransactionDto[];
}
