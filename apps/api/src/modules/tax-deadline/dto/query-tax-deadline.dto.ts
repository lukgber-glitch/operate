import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxTypeEnum } from '../constants/deadlines.constants';

export enum TaxDeadlineStatusEnum {
  PENDING = 'PENDING',
  FILED = 'FILED',
  OVERDUE = 'OVERDUE',
  EXTENDED = 'EXTENDED',
  CANCELLED = 'CANCELLED',
}

export class QueryTaxDeadlineDto {
  @ApiProperty({
    description: 'Organization ID to filter by',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    description: 'Country code to filter by',
    example: 'DE',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiProperty({
    description: 'Tax type to filter by',
    enum: TaxTypeEnum,
    required: false,
  })
  @IsOptional()
  taxType?: TaxTypeEnum;

  @ApiProperty({
    description: 'Status to filter by',
    enum: TaxDeadlineStatusEnum,
    required: false,
  })
  @IsOptional()
  status?: TaxDeadlineStatusEnum;

  @ApiProperty({
    description: 'Filter deadlines due after this date',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiProperty({
    description: 'Filter deadlines due before this date',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiProperty({
    description: 'Number of results per page',
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    description: 'Page number (0-indexed)',
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
