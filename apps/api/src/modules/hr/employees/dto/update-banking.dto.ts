import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';

/**
 * DTO for updating employee banking details
 */
export class UpdateBankingDto {
  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Deutsche Bank',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'IBAN',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, {
    message: 'Invalid IBAN format',
  })
  iban?: string;

  @ApiPropertyOptional({
    description: 'BIC/SWIFT code',
    example: 'DEUTDEFF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
    message: 'Invalid BIC format',
  })
  bic?: string;
}
