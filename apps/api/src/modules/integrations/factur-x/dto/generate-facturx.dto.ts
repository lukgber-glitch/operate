import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsObject,
  ValidateNested,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FacturXProfile,
  FrenchInvoiceType,
  FrenchVATCategory,
  FrenchPaymentMeans,
} from '../types/factur-x.types';

export class FrenchAddressDto {
  @ApiProperty({ example: '123 Rue de la République' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ example: 'Bâtiment A' })
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiPropertyOptional({ example: 'Appartement 5' })
  @IsString()
  @IsOptional()
  line3?: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'FR' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: 'CEDEX 01' })
  @IsString()
  @IsOptional()
  cedex?: string;
}

export class FrenchBusinessIdentifiersDto {
  @ApiPropertyOptional({ example: '12345678901234' })
  @IsString()
  @IsOptional()
  siret?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  siren?: string;

  @ApiPropertyOptional({ example: 'FR12345678901' })
  @IsString()
  @IsOptional()
  tva?: string;

  @ApiPropertyOptional({ example: '6201Z' })
  @IsString()
  @IsOptional()
  codeAPE?: string;
}

export class ContactDto {
  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+33 1 23 45 67 89' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@example.fr' })
  @IsString()
  @IsOptional()
  email?: string;
}

export class FrenchPartyDto {
  @ApiProperty({ example: 'ACME France SARL' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ACME France Société à Responsabilité Limitée' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ example: 'ACME' })
  @IsString()
  @IsOptional()
  tradeName?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => FrenchAddressDto)
  address: FrenchAddressDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => FrenchBusinessIdentifiersDto)
  identifiers: FrenchBusinessIdentifiersDto;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: ContactDto;

  @ApiPropertyOptional({ example: 'acme@peppol.fr' })
  @IsString()
  @IsOptional()
  electronicAddress?: string;
}

export class FrenchVATInfoDto {
  @ApiProperty({ example: 20, description: 'VAT rate in percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiProperty({ enum: FrenchVATCategory, example: FrenchVATCategory.STANDARD })
  @IsEnum(FrenchVATCategory)
  category: FrenchVATCategory;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'TVA non applicable, art. 293 B du CGI' })
  @IsString()
  @IsOptional()
  exemptionReason?: string;
}

export class FacturXLineItemDto {
  @ApiProperty({ example: '1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Consulting services' })
  @IsString()
  description: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'C62', description: 'UN/ECE unit code (C62 = unit)' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @Min(0)
  netAmount: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => FrenchVATInfoDto)
  vat: FrenchVATInfoDto;

  @ApiPropertyOptional({ example: 'PROD-001' })
  @IsString()
  @IsOptional()
  productCode?: string;
}

export class FrenchVATBreakdownDto {
  @ApiProperty({ example: 20 })
  @IsNumber()
  rate: number;

  @ApiProperty({ enum: FrenchVATCategory })
  @IsEnum(FrenchVATCategory)
  category: FrenchVATCategory;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  taxableAmount: number;

  @ApiProperty({ example: 200.0 })
  @IsNumber()
  vatAmount: number;
}

export class BankAccountDto {
  @ApiProperty({ example: 'FR7612345678901234567890123' })
  @IsString()
  iban: string;

  @ApiPropertyOptional({ example: 'BNPAFRPPXXX' })
  @IsString()
  @IsOptional()
  bic?: string;

  @ApiPropertyOptional({ example: 'BNP Paribas' })
  @IsString()
  @IsOptional()
  bankName?: string;
}

export class FrenchLegalMentionsDto {
  @ApiPropertyOptional({ example: 'Paris B 123 456 789' })
  @IsString()
  @IsOptional()
  rcs?: string;

  @ApiPropertyOptional({ example: '100000 EUR' })
  @IsString()
  @IsOptional()
  capital?: string;

  @ApiPropertyOptional({ example: 'TVA non applicable, art. 293 B du CGI' })
  @IsString()
  @IsOptional()
  tvaExemptionMention?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  intracommunautaryNotice?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reverseChargeMention?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  penaltyClause?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  microEnterpriseMention?: boolean;
}

export class GenerateFacturXDto {
  @ApiProperty({ example: 'INV-2025-001' })
  @IsString()
  number: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({ example: '2025-02-15' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: '2025-01-10' })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @ApiProperty({ enum: FrenchInvoiceType, example: FrenchInvoiceType.COMMERCIAL })
  @IsEnum(FrenchInvoiceType)
  type: FrenchInvoiceType;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => FrenchPartyDto)
  seller: FrenchPartyDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => FrenchPartyDto)
  buyer: FrenchPartyDto;

  @ApiProperty({ type: [FacturXLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturXLineItemDto)
  items: FacturXLineItemDto[];

  @ApiProperty({ type: [FrenchVATBreakdownDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrenchVATBreakdownDto)
  vatBreakdown: FrenchVATBreakdownDto[];

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 200.0 })
  @IsNumber()
  @Min(0)
  totalVAT: number;

  @ApiProperty({ example: 1200.0 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ example: 'Paiement à 30 jours' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ enum: FrenchPaymentMeans })
  @IsEnum(FrenchPaymentMeans)
  @IsOptional()
  paymentMeans?: FrenchPaymentMeans;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => BankAccountDto)
  @IsOptional()
  bankAccount?: BankAccountDto;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => FrenchLegalMentionsDto)
  @IsOptional()
  legalMentions?: FrenchLegalMentionsDto;

  @ApiPropertyOptional({ example: 'PO-2025-001' })
  @IsString()
  @IsOptional()
  purchaseOrderReference?: string;

  @ApiPropertyOptional({ example: 'CONTRACT-2024-123' })
  @IsString()
  @IsOptional()
  contractReference?: string;

  @ApiPropertyOptional({ example: 'REF-CLIENT-456' })
  @IsString()
  @IsOptional()
  customerReference?: string;

  @ApiPropertyOptional({ example: 'Note: Merci pour votre commande' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: FacturXProfile, default: FacturXProfile.EN16931 })
  @IsEnum(FacturXProfile)
  @IsOptional()
  profile?: FacturXProfile;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  validateSIRET?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  validateTVA?: boolean;
}
