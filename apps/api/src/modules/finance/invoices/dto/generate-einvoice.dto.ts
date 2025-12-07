import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

/**
 * E-Invoice format types
 */
export enum EInvoiceFormat {
  STANDARD = 'standard',
  ZUGFERD = 'zugferd',
  FACTURX = 'facturx',
  XRECHNUNG = 'xrechnung',
}

/**
 * ZUGFeRD/Factur-X profile levels
 */
export enum ZugferdProfile {
  MINIMUM = 'MINIMUM',
  BASIC_WL = 'BASIC_WL',
  BASIC = 'BASIC',
  EN16931 = 'EN16931',
  EXTENDED = 'EXTENDED',
  XRECHNUNG = 'XRECHNUNG',
}

/**
 * XRechnung syntax options
 */
export enum XRechnungSyntax {
  UBL = 'UBL',
  CII = 'CII',
}

/**
 * DTO for generating E-Invoice (query parameters)
 */
export class GenerateEInvoiceDto {
  @ApiPropertyOptional({
    description: 'E-Invoice format to generate',
    enum: EInvoiceFormat,
    default: 'STANDARD',
    example: 'ZUGFERD',
  })
  @IsOptional()
  format?: EInvoiceFormat = 'STANDARD' as EInvoiceFormat;

  @ApiPropertyOptional({
    description: 'ZUGFeRD/Factur-X profile (only for zugferd/facturx format)',
    enum: ZugferdProfile,
    default: 'EN16931',
    example: ZugferdProfile.EN16931,
  })
  @IsOptional()
  zugferdProfile?: ZugferdProfile = 'EN16931' as ZugferdProfile;

  @ApiPropertyOptional({
    description: 'XRechnung XML syntax (only for xrechnung format)',
    enum: XRechnungSyntax,
    default: 'UBL',
    example: 'UBL',
  })
  @IsOptional()
  xrechnungSyntax?: XRechnungSyntax = 'UBL' as XRechnungSyntax;
}
