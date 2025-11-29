import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveType, LeaveRequestStatus } from '@prisma/client';

/**
 * DTO for querying leave requests
 */
export class LeaveQueryDto {
  @ApiProperty({
    description: 'Filter by leave type',
    enum: LeaveType,
    required: false,
  })
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @ApiProperty({
    description: 'Filter by status',
    enum: LeaveRequestStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(LeaveRequestStatus)
  status?: LeaveRequestStatus;

  @ApiProperty({
    description: 'Filter by start date (from)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiProperty({
    description: 'Filter by start date (to)',
    example: '2024-12-31T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

/**
 * DTO for calendar query
 */
export class LeaveCalendarQueryDto {
  @ApiProperty({
    description: 'Start date for calendar view',
    example: '2024-07-01T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for calendar view',
    example: '2024-07-31T00:00:00Z',
  })
  @IsDateString()
  endDate: string;
}

/**
 * Calendar entry response
 */
export class CalendarEntryDto {
  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Employee name',
    example: 'John Doe',
  })
  employeeName: string;

  @ApiProperty({
    description: 'Leave request ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  leaveRequestId: string;

  @ApiProperty({
    description: 'Leave type',
    enum: LeaveType,
    example: LeaveType.ANNUAL,
  })
  leaveType: LeaveType;

  @ApiProperty({
    description: 'Start date',
    example: '2024-07-15T00:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2024-07-19T00:00:00Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Number of days',
    example: 5,
  })
  totalDays: number;

  @ApiProperty({
    description: 'Request status',
    enum: LeaveRequestStatus,
    example: LeaveRequestStatus.APPROVED,
  })
  status: LeaveRequestStatus;
}
