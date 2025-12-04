import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for updating employee tax information
 */
export class UpdateTaxInfoDto {
  @ApiPropertyOptional({
    description: 'Tax ID (Steuer-ID, etc.)',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Tax class (German Steuerklasse)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  taxClass?: string;

  @ApiPropertyOptional({
    description: 'Church tax liability',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  churchTax?: boolean;
}
