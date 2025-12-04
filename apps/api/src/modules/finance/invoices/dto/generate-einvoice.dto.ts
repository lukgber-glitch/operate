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
    default: EInvoiceFormat.STANDARD,
    example: EInvoiceFormat.ZUGFERD,
  })
  @IsOptional()
  @IsEnum(EInvoiceFormat)
  format?: EInvoiceFormat = EInvoiceFormat.STANDARD;

  @ApiPropertyOptional({
    description: 'ZUGFeRD/Factur-X profile (only for zugferd/facturx format)',
    enum: ZugferdProfile,
    default: ZugferdProfile.EN16931,
    example: ZugferdProfile.EN16931,
  })
  @IsOptional()
  @IsEnum(ZugferdProfile)
  zugferdProfile?: ZugferdProfile = ZugferdProfile.EN16931;

  @ApiPropertyOptional({
    description: 'XRechnung XML syntax (only for xrechnung format)',
    enum: XRechnungSyntax,
    default: XRechnungSyntax.UBL,
    example: XRechnungSyntax.UBL,
  })
  @IsOptional()
  @IsEnum(XRechnungSyntax)
  xrechnungSyntax?: XRechnungSyntax = XRechnungSyntax.UBL;
}
