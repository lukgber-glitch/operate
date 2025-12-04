import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class MarkFiledDto {
  @ApiProperty({
    description: 'Date when filed',
    example: '2024-02-09T14:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  filedAt?: string;

  @ApiProperty({
    description: 'External filing confirmation ID',
    example: 'ELSTER-2024-001234',
    required: false,
  })
  @IsOptional()
  @IsString()
  confirmationId?: string;

  @ApiProperty({
    description: 'Additional notes about the filing',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
