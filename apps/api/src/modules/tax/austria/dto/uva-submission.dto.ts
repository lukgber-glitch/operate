import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UvaKennzahlenDto {
  @ApiProperty({ description: 'Total revenue (Gesamtbetrag der Bemessungsgrundlagen)' })
  @IsNumber()
  kz000: number;

  @ApiProperty({ description: 'Revenue 20% VAT (davon steuerpflichtig mit 20%)' })
  @IsNumber()
  kz022: number;

  @ApiProperty({ description: 'Revenue 10% VAT (davon steuerpflichtig mit 10%)' })
  @IsNumber()
  kz029: number;

  @ApiProperty({ description: 'Revenue 13% VAT (davon steuerpflichtig mit 13%)' })
  @IsNumber()
  kz006: number;

  @ApiProperty({ description: 'Input VAT (Vorsteuer)' })
  @IsNumber()
  kz072: number;

  @ApiProperty({ description: 'Net VAT payable (Zahllast/Überschuss)' })
  @IsNumber()
  kz083: number;
}

export class SubmitUvaDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Period (e.g., 2025-01, 2025-Q1)' })
  @IsString()
  period: string;

  @ApiProperty({ description: 'Period type', enum: ['monthly', 'quarterly', 'yearly'] })
  @IsEnum(['monthly', 'quarterly', 'yearly'])
  periodType: 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({ description: 'UVA Kennzahlen (form fields)', type: UvaKennzahlenDto })
  @ValidateNested()
  @Type(() => UvaKennzahlenDto)
  uva: UvaKennzahlenDto;
}

export class VerifyUidDto {
  @ApiProperty({ description: 'Austrian UID number (ATU12345678)' })
  @IsString()
  uid: string;
}
