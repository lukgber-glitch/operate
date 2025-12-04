import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportType } from './create-scheduled-export.dto';

export class ScheduledExportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ExportType })
  exportType: ExportType;

  @ApiProperty()
  config: Record<string, any>;

  @ApiProperty()
  schedule: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastRunAt?: Date;

  @ApiPropertyOptional()
  nextRunAt?: Date;

  @ApiPropertyOptional()
  lastStatus?: string;

  @ApiPropertyOptional()
  notifyEmail?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ScheduledExportRunResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  scheduledExportId: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  exportId?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}
