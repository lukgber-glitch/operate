import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ description: 'Client ID to associate with this project' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Project name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Project color (hex code)',
    example: '#6366f1',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Budget in hours' })
  @IsOptional()
  @IsNumber()
  budgetHours?: number;

  @ApiPropertyOptional({ description: 'Budget amount in currency' })
  @IsOptional()
  @IsNumber()
  budgetAmount?: number;

  @ApiPropertyOptional({ description: 'Hourly rate for this project' })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Project status',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Project start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
