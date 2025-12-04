import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsDateString, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { LeaveType } from '@prisma/client';

/**
 * DTO for creating a new leave request
 */
export class CreateLeaveRequestDto {
  @ApiProperty({
    description: 'Type of leave',
    enum: LeaveType,
    example: LeaveType.ANNUAL,
  })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({
    description: 'Leave start date (ISO 8601)',
    example: '2024-07-15T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Leave end date (ISO 8601)',
    example: '2024-07-19T00:00:00Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Total number of days requested',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  totalDays?: number;

  @ApiProperty({
    description: 'Reason for leave (optional)',
    example: 'Family vacation',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Additional notes from employee',
    example: 'Will be available via email in emergencies',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeNote?: string;
}
