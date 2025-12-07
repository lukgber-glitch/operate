import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * DTO for leave balance information
 */
export class LeaveBalanceDto {
  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Calendar year',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Leave balances by type',
    type: 'array',
    example: [
      {
        leaveType: 'ANNUAL',
        totalDays: 25,
        usedDays: 10,
        pendingDays: 2,
        availableDays: 13,
        carriedOver: 3,
      },
    ],
  })
  balances: LeaveBalanceItemDto[];
}

/**
 * Individual leave balance item
 */
export class LeaveBalanceItemDto {
  @ApiProperty({
    description: 'Type of leave',
    enum: LeaveType,
    example: 'ANNUAL',
  })
  leaveType: LeaveType;

  @ApiProperty({
    description: 'Total entitled days',
    example: 25,
  })
  totalDays: number;

  @ApiProperty({
    description: 'Days already used',
    example: 10,
  })
  usedDays: number;

  @ApiProperty({
    description: 'Days pending approval',
    example: 2,
  })
  pendingDays: number;

  @ApiProperty({
    description: 'Available days remaining',
    example: 13,
  })
  availableDays: number;

  @ApiProperty({
    description: 'Days carried over from previous year',
    example: 3,
  })
  carriedOver: number;

  @ApiProperty({
    description: 'Date when carryover expires',
    example: '2024-03-31T00:00:00Z',
    nullable: true,
  })
  carryoverExpiry: Date | null;
}
