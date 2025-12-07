import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { CreateTaxDeadlineDto } from './create-tax-deadline.dto';

export enum TaxDeadlineStatusEnum {
  PENDING = 'PENDING',
  FILED = 'FILED',
  OVERDUE = 'OVERDUE',
  EXTENDED = 'EXTENDED',
  CANCELLED = 'CANCELLED',
}

export class UpdateTaxDeadlineDto extends PartialType(CreateTaxDeadlineDto) {
  @ApiProperty({
    description: 'Deadline status',
    enum: TaxDeadlineStatusEnum,
    required: false,
  })
  @IsOptional()
  status?: TaxDeadlineStatusEnum;
}
