import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PeppolDocumentType } from '../types/peppol.types';

/**
 * Participant ID DTO
 */
export class ParticipantIdDto {
  @IsString()
  @IsNotEmpty()
  scheme: string;

  @IsString()
  @IsNotEmpty()
  identifier: string;
}

/**
 * UBL Party DTO
 */
export class UBLPartyDto {
  @ValidateNested()
  @Type(() => ParticipantIdDto)
  participantId: ParticipantIdDto;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsString()
  @IsOptional()
  vatId?: string;

  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: ContactDto;
}

/**
 * Address DTO
 */
export class AddressDto {
  @IsString()
  @IsOptional()
  streetName?: string;

  @IsString()
  @IsNotEmpty()
  cityName: string;

  @IsString()
  @IsNotEmpty()
  postalZone: string;

  @IsString()
  @IsNotEmpty()
  countryCode: string; // ISO 3166-1 alpha-2
}

/**
 * Contact DTO
 */
export class ContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

/**
 * Invoice Line DTO
 */
export class InvoiceLineDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unitCode: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  priceAmount: number;

  @IsNotEmpty()
  lineExtensionAmount: number;

  @IsNotEmpty()
  taxPercent: number;

  @IsNotEmpty()
  taxAmount: number;
}

/**
 * Payment Means DTO
 */
export class PaymentMeansDto {
  @IsString()
  @IsNotEmpty()
  paymentMeansCode: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsString()
  @IsOptional()
  iban?: string;

  @IsString()
  @IsOptional()
  bic?: string;

  @IsString()
  @IsOptional()
  accountName?: string;
}

/**
 * Send Peppol Document DTO
 */
export class SendDocumentDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsEnum(PeppolDocumentType)
  documentType: PeppolDocumentType;

  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsString()
  @IsNotEmpty()
  issueDate: string; // ISO date string

  @IsString()
  @IsOptional()
  dueDate?: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  currency: string; // ISO 4217

  @ValidateNested()
  @Type(() => UBLPartyDto)
  supplier: UBLPartyDto;

  @ValidateNested()
  @Type(() => UBLPartyDto)
  customer: UBLPartyDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];

  @IsNotEmpty()
  taxTotal: number;

  @IsNotEmpty()
  totalAmount: number;

  @ValidateNested()
  @Type(() => PaymentMeansDto)
  @IsOptional()
  paymentMeans?: PaymentMeansDto;
}
