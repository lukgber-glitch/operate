import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AutopilotActionType, AutopilotActionStatus } from '@prisma/client';

export class ActionQueryDto {
  @ApiProperty({ required: false, enum: AutopilotActionType })
  @IsOptional()
  @IsString()
  type?: AutopilotActionType;

  @ApiProperty({ required: false, enum: AutopilotActionStatus })
  @IsOptional()
  @IsString()
  status?: AutopilotActionStatus;

  @ApiProperty({ required: false, description: 'Page number (1-based)', minimum: 1, default: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Items per page', minimum: 1, default: 20 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
