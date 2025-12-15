import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { InsuranceType, PolicyStatus } from '@prisma/client';

export class PolicyQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by insurance type',
    enum: InsuranceType,
  })
  @IsOptional()
  @IsEnum(InsuranceType)
  type?: InsuranceType;

  @ApiPropertyOptional({
    description: 'Filter by policy status',
    enum: PolicyStatus,
  })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
