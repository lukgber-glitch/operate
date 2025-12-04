import { IsString, IsEnum, IsDate, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UAEInvoiceType, UAEVATRateCode } from '../constants/uae.constants';

/**
 * Address DTO
 */
export class AddressDto {
  @ApiProperty()
  @IsString()
  streetName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalStreet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @ApiProperty()
  @IsString()
  cityName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalZone?: string;

  @ApiProperty()
  @IsString()
  emirate: string;

  @ApiProperty()
  @IsString()
  country: string;
}

/**
 * Party Information DTO
 */
export class PartyInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trn?: string;

  @ApiProperty()
  @IsString()
  legalName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsBoolean()
  vatRegistered: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emiratesId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commercialRegistration?: string;
}

/**
 * Allowance/Charge DTO
 */
export class AllowanceChargeDto {
  @ApiProperty({ enum: ['ALLOWANCE', 'CHARGE'] })
  @IsEnum(['ALLOWANCE', 'CHARGE'])
  type: 'ALLOWANCE' | 'CHARGE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reasonCode?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  baseAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ enum: UAEVATRateCode })
  @IsOptional()
  @IsEnum(UAEVATRateCode)
  taxCategory?: UAEVATRateCode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;
}

/**
 * Invoice Line Item DTO
 */
export class InvoiceLineItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsString()
  unitCode: string;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiProperty()
  @IsNumber()
  lineExtensionAmount: number;

  @ApiProperty({ enum: UAEVATRateCode })
  @IsEnum(UAEVATRateCode)
  taxCategory: UAEVATRateCode;

  @ApiProperty()
  @IsNumber()
  taxRate: number;

  @ApiProperty()
  @IsNumber()
  taxAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellersItemId?: string;
}

/**
 * Tax Breakdown DTO
 */
export class TaxBreakdownDto {
  @ApiProperty({ enum: UAEVATRateCode })
  @IsEnum(UAEVATRateCode)
  taxCategory: UAEVATRateCode;

  @ApiProperty()
  @IsNumber()
  taxRate: number;

  @ApiProperty()
  @IsNumber()
  taxableAmount: number;

  @ApiProperty()
  @IsNumber()
  taxAmount: number;
}

/**
 * Invoice Totals DTO
 */
export class InvoiceTotalsDto {
  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNumber()
  lineExtensionAmount: number;

  @ApiPropertyOptional({ type: [AllowanceChargeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceChargeDto)
  allowances?: AllowanceChargeDto[];

  @ApiPropertyOptional({ type: [AllowanceChargeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceChargeDto)
  charges?: AllowanceChargeDto[];

  @ApiProperty()
  @IsNumber()
  taxExclusiveAmount: number;

  @ApiProperty({ type: [TaxBreakdownDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxBreakdownDto)
  taxBreakdown: TaxBreakdownDto[];

  @ApiProperty()
  @IsNumber()
  taxTotalAmount: number;

  @ApiProperty()
  @IsNumber()
  taxInclusiveAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  prepaidAmount?: number;

  @ApiProperty()
  @IsNumber()
  payableAmount: number;
}

/**
 * Submit Invoice DTO
 */
export class SubmitInvoiceDto {
  @ApiProperty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ enum: UAEInvoiceType })
  @IsEnum(UAEInvoiceType)
  invoiceType: UAEInvoiceType;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalInvoiceReference?: string;

  @ApiProperty({ type: PartyInfoDto })
  @ValidateNested()
  @Type(() => PartyInfoDto)
  supplier: PartyInfoDto;

  @ApiProperty({ type: PartyInfoDto })
  @ValidateNested()
  @Type(() => PartyInfoDto)
  customer: PartyInfoDto;

  @ApiProperty({ type: [InvoiceLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ type: InvoiceTotalsDto })
  @ValidateNested()
  @Type(() => InvoiceTotalsDto)
  totals: InvoiceTotalsDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];
}

/**
 * Submission Options DTO
 */
export class SubmissionOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clearanceRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyCustomer?: boolean;

  @ApiPropertyOptional({ enum: ['en', 'ar'] })
  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: 'en' | 'ar';
}
