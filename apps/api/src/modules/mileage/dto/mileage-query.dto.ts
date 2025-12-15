import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { VehicleType } from '@prisma/client';

/**
 * DTO for querying mileage entries
 */
export class MileageQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by start date (inclusive)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (inclusive)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by client ID',
  })
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
  })
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by vehicle type',
    enum: VehicleType,
  })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({
    description: 'Filter by reimbursement status',
  })
  @IsOptional()
  @IsBoolean()
  reimbursed?: boolean;
}
