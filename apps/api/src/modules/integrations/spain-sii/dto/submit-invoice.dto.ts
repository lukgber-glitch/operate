import {
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SiiInvoiceType,
  SiiVatKey,
  SiiOperationType,
  SiiSpecialCircumstance,
  SiiPaymentMethod,
} from '../constants/sii.constants';

/**
 * Party DTO
 */
export class SiiPartyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{9,14}$/, {
    message: 'Invalid NIF format',
  })
  nif: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, {
    message: 'Invalid country code (ISO 3166-1 alpha-2)',
  })
  countryCode?: string;
}

/**
 * VAT Line DTO
 */
export class SiiVatLineDto {
  @IsEnum(SiiVatKey)
  vatKey: SiiVatKey;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxableBase: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  vatRate: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vatAmount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  equivalenceSurchargeRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  equivalenceSurchargeAmount?: number;
}

/**
 * Rectification DTO
 */
export class SiiRectificationDto {
  @IsString()
  @IsNotEmpty()
  originalInvoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  originalIssueDate: Date;

  @IsString()
  @Matches(/^[SI]$/, {
    message: 'Rectification type must be S (Substitution) or I (Differences)',
  })
  rectificationType: 'S' | 'I';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  rectificationBase?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  rectificationVat?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rectificationReason?: string;
}

/**
 * Related Invoice DTO
 */
export class SiiRelatedInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;
}

/**
 * Submit Issued Invoice DTO
 */
export class SubmitIssuedInvoiceDto {
  // Holder submitting the invoice
  @ValidateNested()
  @Type(() => SiiPartyDto)
  holder: SiiPartyDto;

  // Fiscal period
  @IsNumber()
  @Min(2017) // SII started in 2017
  @Max(2099)
  fiscalYear: number;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2]|[1-4]T|0A)$/, {
    message: 'Period must be MM (01-12), QT (1T-4T), or 0A (annual)',
  })
  period: string;

  // Invoice identification
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  invoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsEnum(SiiInvoiceType)
  invoiceType: SiiInvoiceType;

  // Parties
  @ValidateNested()
  @Type(() => SiiPartyDto)
  issuer: SiiPartyDto;

  @ValidateNested()
  @Type(() => SiiPartyDto)
  recipient: SiiPartyDto;

  // Operation details
  @IsEnum(SiiOperationType)
  operationType: SiiOperationType;

  @IsOptional()
  @IsEnum(SiiSpecialCircumstance)
  specialCircumstance?: SiiSpecialCircumstance;

  // Invoice details
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  invoiceDescription: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalInvoiceAmount: number;

  // VAT breakdown
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiiVatLineDto)
  vatLines: SiiVatLineDto[];

  // Optional fields
  @IsOptional()
  @IsString()
  @MaxLength(60)
  internalReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  externalReference?: string;

  @IsOptional()
  @IsBoolean()
  simplifiedInvoice?: boolean;

  @IsOptional()
  @IsBoolean()
  issuedByThirdParty?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SiiPartyDto)
  thirdPartyIssuer?: SiiPartyDto;

  // Rectification
  @IsOptional()
  @ValidateNested()
  @Type(() => SiiRectificationDto)
  rectification?: SiiRectificationDto;

  // Cash basis
  @IsOptional()
  @IsBoolean()
  isCashBasis?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  collectionDate?: Date;

  // Intracommunity
  @IsOptional()
  @IsBoolean()
  isIntracommunity?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  destinationCountry?: string;

  // Related invoices
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiiRelatedInvoiceDto)
  relatedInvoices?: SiiRelatedInvoiceDto[];

  // Additional info
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

/**
 * Submit Received Invoice DTO
 */
export class SubmitReceivedInvoiceDto {
  // Holder submitting the invoice
  @ValidateNested()
  @Type(() => SiiPartyDto)
  holder: SiiPartyDto;

  // Fiscal period
  @IsNumber()
  @Min(2017)
  @Max(2099)
  fiscalYear: number;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2]|[1-4]T|0A)$/)
  period: string;

  // Invoice identification
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  invoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsEnum(SiiInvoiceType)
  invoiceType: SiiInvoiceType;

  // Parties
  @ValidateNested()
  @Type(() => SiiPartyDto)
  issuer: SiiPartyDto;

  @ValidateNested()
  @Type(() => SiiPartyDto)
  recipient: SiiPartyDto;

  // Operation details
  @IsEnum(SiiOperationType)
  operationType: SiiOperationType;

  @IsOptional()
  @IsEnum(SiiSpecialCircumstance)
  specialCircumstance?: SiiSpecialCircumstance;

  // Invoice details
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  invoiceDescription: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalInvoiceAmount: number;

  // VAT breakdown
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiiVatLineDto)
  vatLines: SiiVatLineDto[];

  // Deductibility
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deductibleAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  deductionPercentage?: number;

  // Optional fields
  @IsOptional()
  @IsString()
  @MaxLength(60)
  internalReference?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registrationDate?: Date;

  // Reverse charge
  @IsOptional()
  @IsBoolean()
  isReverseCharge?: boolean;

  // Intracommunity
  @IsOptional()
  @IsBoolean()
  isIntracommunity?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  originCountry?: string;

  // Import
  @IsOptional()
  @IsBoolean()
  isImport?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  duaReference?: string;

  // Rectification
  @IsOptional()
  @ValidateNested()
  @Type(() => SiiRectificationDto)
  rectification?: SiiRectificationDto;

  // Related invoices
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiiRelatedInvoiceDto)
  relatedInvoices?: SiiRelatedInvoiceDto[];

  // Additional info
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

/**
 * Submit Payment DTO
 */
export class SubmitPaymentDto {
  @ValidateNested()
  @Type(() => SiiPartyDto)
  holder: SiiPartyDto;

  @IsNumber()
  @Min(2017)
  @Max(2099)
  fiscalYear: number;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2]|[1-4]T|0A)$/)
  period: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsDate()
  @Type(() => Date)
  paymentDate: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paymentAmount: number;

  @IsEnum(SiiPaymentMethod)
  paymentMethod: SiiPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  accountOrReference?: string;
}
