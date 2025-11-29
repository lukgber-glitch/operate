import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for approving a leave request
 */
export class ApproveLeaveDto {
  @ApiProperty({
    description: 'Optional note from reviewer',
    example: 'Approved - enjoy your vacation',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * DTO for rejecting a leave request
 */
export class RejectLeaveDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Insufficient coverage during this period',
  })
  @IsString()
  reason: string;
}
