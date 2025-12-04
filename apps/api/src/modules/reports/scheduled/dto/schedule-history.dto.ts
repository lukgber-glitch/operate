import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
  PARTIAL = 'partial',
}

export class ScheduleExecutionDto {
  @ApiProperty({
    description: 'Execution ID',
    example: 'exec_123',
  })
  id: string;

  @ApiProperty({
    description: 'Schedule ID',
    example: 'schedule_123',
  })
  scheduleId: string;

  @ApiProperty({
    description: 'Execution status',
    enum: ExecutionStatus,
  })
  status: ExecutionStatus;

  @ApiPropertyOptional({
    description: 'Generated report ID',
    example: 'report_123',
  })
  reportId?: string;

  @ApiPropertyOptional({
    description: 'Delivery status',
    enum: DeliveryStatus,
  })
  deliveryStatus?: DeliveryStatus;

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Error stack trace',
  })
  errorStack?: string;

  @ApiProperty({
    description: 'Execution started at',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Execution completed at',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Duration in milliseconds',
  })
  durationMs?: number;

  @ApiPropertyOptional({
    description: 'Report file size in bytes',
  })
  fileSizeBytes?: number;

  @ApiPropertyOptional({
    description: 'Number of delivery attempts',
  })
  deliveryAttempts?: number;

  @ApiPropertyOptional({
    description: 'Recipients who received the report',
    type: [String],
  })
  deliveredTo?: string[];

  @ApiPropertyOptional({
    description: 'Recipients who failed to receive',
    type: [String],
  })
  failedRecipients?: string[];

  @ApiPropertyOptional({
    description: 'Additional execution metadata',
  })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ScheduleHistoryResponseDto {
  @ApiProperty({
    description: 'Schedule ID',
  })
  scheduleId: string;

  @ApiProperty({
    description: 'Schedule name',
  })
  scheduleName: string;

  @ApiProperty({
    description: 'Execution history',
    type: [ScheduleExecutionDto],
  })
  executions: ScheduleExecutionDto[];

  @ApiProperty({
    description: 'Total executions',
  })
  total: number;

  @ApiProperty({
    description: 'Successful executions',
  })
  successful: number;

  @ApiProperty({
    description: 'Failed executions',
  })
  failed: number;

  @ApiProperty({
    description: 'Success rate percentage',
  })
  successRate: number;

  @ApiPropertyOptional({
    description: 'Last successful execution',
  })
  lastSuccess?: Date;

  @ApiPropertyOptional({
    description: 'Last failed execution',
  })
  lastFailure?: Date;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ExecutionStatus,
  })
  @IsOptional()
  @IsEnum(ExecutionStatus)
  status?: ExecutionStatus;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Start date filter',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
