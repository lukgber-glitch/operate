import { ApiProperty } from '@nestjs/swagger';
import { LeaveType, LeaveRequestStatus } from '@prisma/client';

/**
 * DTO for leave request response
 */
export class LeaveRequestResponseDto {
  @ApiProperty({
    description: 'Leave request unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Employee unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Type of leave',
    enum: LeaveType,
    example: 'ANNUAL',
  })
  leaveType: LeaveType;

  @ApiProperty({
    description: 'Leave start date',
    example: '2024-07-15T00:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Leave end date',
    example: '2024-07-19T00:00:00Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Total number of days',
    example: 5,
  })
  totalDays: number;

  @ApiProperty({
    description: 'Reason for leave',
    example: 'Family vacation',
    nullable: true,
  })
  reason: string | null;

  @ApiProperty({
    description: 'Request status',
    enum: LeaveRequestStatus,
    example: 'PENDING',
  })
  status: LeaveRequestStatus;

  @ApiProperty({
    description: 'ID of user who reviewed',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  reviewedBy: string | null;

  @ApiProperty({
    description: 'Date when request was reviewed',
    example: '2024-07-10T14:30:00Z',
    nullable: true,
  })
  reviewedAt: Date | null;

  @ApiProperty({
    description: 'Review note from manager',
    example: 'Approved - have a great time',
    nullable: true,
  })
  reviewNote: string | null;

  @ApiProperty({
    description: 'Request creation timestamp',
    example: '2024-07-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-07-10T14:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Employee information (optional)',
    required: false,
  })
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
}
