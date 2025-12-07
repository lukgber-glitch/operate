/**
 * ZATCA Submit Invoice DTO
 */

import { IsString, IsEnum, IsNumber, IsDate, IsOptional, IsArray, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ZatcaInvoiceType } from '../zatca.types';

export class ZatcaAddressDto {
  @IsString()
  buildingNumber: string;

  @IsString()
  streetName: string;

  @IsString()
  districtName: string;

  @IsString()
  cityName: string;

  @IsString()
  postalCode: string;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  additionalNumber?: string;

  @IsOptional()
  @IsString()
  additionalStreetName?: string;

  @IsOptional()
  @IsString()
  provinceName?: string;
}

export class ZatcaPartyDto {
  @IsString()
  registrationName: string;

  @IsOptional()
  @IsString()
  vatRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  commercialRegistrationNumber?: string;

  @ValidateNested()
  @Type(() => ZatcaAddressDto)
  address: ZatcaAddressDto;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;
}

export class ZatcaInvoiceLineDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  netAmount: number;

  @IsNumber()
  @Min(0)
  vatRate: number;

  @IsNumber()
  @Min(0)
  vatAmount: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsEnum(['S', 'Z', 'E', 'O'])
  vatCategoryCode: 'S' | 'Z' | 'E' | 'O';

  @IsOptional()
  @IsString()
  vatExemptionReasonCode?: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsString()
  discountReason?: string;

  @IsOptional()
  @IsString()
  measurementUnit?: string;
}

export class SubmitInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsUUID()
  uuid: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsDate()
  @Type(() => Date)
  issueTime: Date;

  invoiceType: ZatcaInvoiceType;

  @IsString()
  currency: string;

  @IsString()
  previousInvoiceHash: string;

  @ValidateNested()
  @Type(() => ZatcaPartyDto)
  seller: ZatcaPartyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ZatcaPartyDto)
  buyer?: ZatcaPartyDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZatcaInvoiceLineDto)
  lines: ZatcaInvoiceLineDto[];

  @IsNumber()
  @Min(0)
  lineExtensionAmount: number;

  @IsNumber()
  @Min(0)
  taxExclusiveAmount: number;

  @IsNumber()
  @Min(0)
  taxInclusiveAmount: number;

  @IsNumber()
  @Min(0)
  payableAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
