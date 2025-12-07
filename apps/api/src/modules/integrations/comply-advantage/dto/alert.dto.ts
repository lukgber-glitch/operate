import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { AlertStatus } from '../types/comply-advantage.types';

/**
 * DTO for reviewing an AML alert
 */
export class ReviewAlertDto {
  status: AlertStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsString()
  reviewedBy: string; // User ID of reviewer
}

/**
 * DTO for creating manual alert
 */
export class CreateAlertDto {
  @IsString()
  screeningId: string;

  @IsString()
  alertType: string;

  @IsString()
  matchName: string;

  @IsNumber()
  matchScore: number;

  @IsString()
  sourceList: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;
}
