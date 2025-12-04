import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Lookup Public Entity DTO
 */
export class LookupEntityDto {
  @ApiProperty({
    description: 'Public entity SIRET (14 digits)',
    example: '98765432109876',
  })
  @IsString()
  @IsNotEmpty()
  @Length(14, 14)
  siret: string;

  @ApiPropertyOptional({
    description: 'Entity name (optional, for additional filtering)',
    example: 'Ministère de l\'Économie',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
