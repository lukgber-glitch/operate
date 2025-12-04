/**
 * Send Invoice DTO
 * Request body for sending invoice via InvoiceNow
 */

import {
  IsString,
  IsDate,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceNowDocumentType, SingaporeGstCategory } from '@operate/shared/types/integrations/invoice-now.types';

/**
 * Address DTO
 */
export class AddressDto {
  @IsOptional()
  @IsString()
  streetName?: string;

  @IsString()
  cityName: string;

  @IsString()
  postalCode: string;

  @IsString()
  countryCode: string;
}

/**
 * Contact DTO
 */
export class ContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

/**
 * Participant DTO
 */
export class ParticipantDto {
  @IsString()
  uen: string;

  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  gstRegistrationNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;
}

/**
 * Invoice Line DTO
 */
export class InvoiceLineDto {
  @IsString()
  id: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unitCode: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  lineExtensionAmount: number;

  @IsEnum(SingaporeGstCategory)
  taxCategory: SingaporeGstCategory;

  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsOptional()
  @IsString()
  itemClassificationCode?: string;
}

/**
 * Payment Means DTO
 */
export class PaymentMeansDto {
  @IsString()
  paymentMeansCode: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  payeeAccountId?: string;

  @IsOptional()
  @IsString()
  payeeAccountName?: string;

  @IsOptional()
  @IsString()
  payeeBankBic?: string;

  @IsOptional()
  @IsString()
  payNowUen?: string;

  @IsOptional()
  @IsString()
  payNowMobile?: string;
}

/**
 * Send Invoice DTO
 */
export class SendInvoiceDto {
  @IsEnum(InvoiceNowDocumentType)
  documentType: InvoiceNowDocumentType;

  @IsString()
  invoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsString()
  currency: string;

  @ValidateNested()
  @Type(() => ParticipantDto)
  supplier: ParticipantDto;

  @ValidateNested()
  @Type(() => ParticipantDto)
  customer: ParticipantDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];

  @IsNumber()
  @Min(0)
  taxTotal: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMeansDto)
  paymentMeans?: PaymentMeansDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  billingReference?: string;

  @IsOptional()
  @IsString()
  projectReference?: string;
}
