/**
 * Validate UEN DTO
 * Request body for validating Singapore UEN
 */

import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class ValidateUenDto {
  @IsString()
  uen: string;

  @IsOptional()
  @IsBoolean()
  validateGst?: boolean;
}
