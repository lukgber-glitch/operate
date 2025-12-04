import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { TaxTypeEnum } from '../constants/deadlines.constants';

export class CreateTaxDeadlineDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'DE',
  })
  @IsString()
  countryId: string;

  @ApiProperty({
    description: 'Tax type',
    enum: TaxTypeEnum,
    example: TaxTypeEnum.VAT_MONTHLY,
  })
  @IsEnum(TaxTypeEnum)
  taxType: TaxTypeEnum;

  @ApiProperty({
    description: 'Period type',
    enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'SEMI_ANNUAL', 'BI_MONTHLY'],
    example: 'MONTHLY',
  })
  @IsString()
  periodType: string;

  @ApiProperty({
    description: 'Period start date',
    example: '2024-01-01',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'Period end date',
    example: '2024-01-31',
  })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({
    description: 'Due date for filing',
    example: '2024-02-10',
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    description: 'Description',
    example: 'Monthly VAT return for January 2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Whether this deadline was auto-created',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAutoCreated?: boolean;

  @ApiProperty({
    description: 'Whether this is a recurring deadline',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
