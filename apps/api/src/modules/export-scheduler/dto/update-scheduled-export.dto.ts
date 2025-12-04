import { PartialType } from '@nestjs/swagger';
import { CreateScheduledExportDto } from './create-scheduled-export.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduledExportDto extends PartialType(
  CreateScheduledExportDto,
) {
  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  orgId?: string;
}
