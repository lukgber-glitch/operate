import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for validating Italian fiscal code
 */
export class ValidateFiscalCodeDto {
  @IsString()
  @IsNotEmpty()
  codiceFiscale: string;
}

/**
 * DTO for validating Italian VAT number
 */
export class ValidatePartitaIVADto {
  @IsString()
  @IsNotEmpty()
  partitaIVA: string;
}
