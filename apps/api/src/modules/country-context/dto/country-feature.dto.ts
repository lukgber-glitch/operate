import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Country Feature DTO for API responses
 */
export class CountryFeatureDto {
  @ApiProperty({
    description: 'Feature name',
    example: 'tax_filing',
  })
  feature: string;

  @ApiProperty({
    description: 'Whether feature is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Feature configuration',
    example: { provider: 'ELSTER' },
    nullable: true,
  })
  config: Record<string, any> | null;
}
