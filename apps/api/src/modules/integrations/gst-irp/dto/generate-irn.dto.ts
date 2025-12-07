/**
 * Generate IRN DTO
 *
 * Data Transfer Object for IRN generation requests
 */

import { IsString, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { GstInvoiceType, SupplyType } from '../gst-irp.types';

export class AddressDto {
  @IsOptional()
  @IsString()
  buildingNo?: string;

  @IsOptional()
  @IsString()
  buildingName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @IsNotEmpty()
  @IsString()
  stateCode: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  locality?: string;
}

export class ContactDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class PartyDetailsDto {
  @IsNotEmpty()
  @IsString()
  gstin: string;

  @IsNotEmpty()
  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;
}

export class ItemDetailsDto {
  @IsNotEmpty()
  @IsString()
  slNo: string;

  @IsNotEmpty()
  @IsString()
  productDescription: string;

  @IsNotEmpty()
  @IsEnum(['Y', 'N'])
  isService: 'Y' | 'N';

  @IsNotEmpty()
  @IsString()
  hsnCode: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @IsNotEmpty()
  @IsNumber()
  totAmount: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsNotEmpty()
  @IsNumber()
  assAmount: number;

  @IsNotEmpty()
  @IsNumber()
  gstRate: number;

  @IsOptional()
  @IsNumber()
  igstAmount?: number;

  @IsOptional()
  @IsNumber()
  cgstAmount?: number;

  @IsOptional()
  @IsNumber()
  sgstAmount?: number;

  @IsOptional()
  @IsNumber()
  cessAmount?: number;

  @IsNotEmpty()
  @IsNumber()
  totItemValue: number;
}

export class ValueDetailsDto {
  @IsNotEmpty()
  @IsNumber()
  assVal: number;

  @IsOptional()
  @IsNumber()
  cgstVal?: number;

  @IsOptional()
  @IsNumber()
  sgstVal?: number;

  @IsOptional()
  @IsNumber()
  igstVal?: number;

  @IsOptional()
  @IsNumber()
  cessVal?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  otherCharge?: number;

  @IsOptional()
  @IsNumber()
  roundOff?: number;

  @IsNotEmpty()
  @IsNumber()
  totInvVal: number;
}

export class TransactionDetailsDto {
  @IsNotEmpty()
  @IsString()
  taxSch: 'GST';

  @IsNotEmpty()
  supTyp: SupplyType;

  @IsOptional()
  @IsEnum(['Y', 'N'])
  regRev?: 'Y' | 'N';

  @IsOptional()
  @IsString()
  ecmGstin?: string;

  @IsOptional()
  @IsEnum(['Y', 'N'])
  igstOnIntra?: 'Y' | 'N';
}

export class DocumentDetailsDto {
  @IsNotEmpty()
  typ: GstInvoiceType;

  @IsNotEmpty()
  @IsString()
  no: string;

  @IsNotEmpty()
  @IsString()
  dt: string; // DD/MM/YYYY format
}

export class GenerateIrnDto {
  @IsOptional()
  @IsString()
  version?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TransactionDetailsDto)
  tranDtls: TransactionDetailsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DocumentDetailsDto)
  docDtls: DocumentDetailsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PartyDetailsDto)
  sellerDtls: PartyDetailsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PartyDetailsDto)
  buyerDtls: PartyDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartyDetailsDto)
  dispDtls?: PartyDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartyDetailsDto)
  shipDtls?: PartyDetailsDto;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDetailsDto)
  itemList: ItemDetailsDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ValueDetailsDto)
  valDtls: ValueDetailsDto;
}
