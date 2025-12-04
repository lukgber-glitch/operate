import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';

/**
 * DTO for creating a new bank account
 */
export class CreateBankAccountDto {
  @ApiProperty({
    description: 'Account name/label',
    example: 'Main Business Account',
  })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'IBAN',
    example: 'DE89370400440532013000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/)
  iban?: string;

  @ApiPropertyOptional({
    description: 'BIC/SWIFT code',
    example: 'DEUTDEFF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
  bic?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Deutsche Bank',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Account type (checking, savings, etc.)',
    example: 'checking',
  })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Is account active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
