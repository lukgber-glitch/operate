import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Validate TRN DTO
 */
export class ValidateTRNDto {
  @ApiProperty({ description: 'Tax Registration Number to validate' })
  @IsString()
  trn: string;

  @ApiPropertyOptional({ description: 'Whether to validate with FTA online service' })
  @IsOptional()
  @IsBoolean()
  checkWithFTA?: boolean;
}
