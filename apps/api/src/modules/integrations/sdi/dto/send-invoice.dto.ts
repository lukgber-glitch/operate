import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { FatturaPAFormat, FatturaPADocumentType, RegimeFiscale, ModalitaPagamento, CondizioniPagamento, NaturaIVA } from '../types/sdi.types';

/**
 * DTO for sending invoice to SDI
 */
export class SendSDIInvoiceDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  formatoTrasmissione: FatturaPAFormat;

  tipoDocumento: FatturaPADocumentType;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsDateString()
  data: string;

  @IsString()
  @IsOptional()
  causale?: string;

  @IsBoolean()
  @IsOptional()
  art73?: boolean;

  @ValidateNested()
  @Type(() => SupplierDto)
  cedentePrestatore: SupplierDto;

  @ValidateNested()
  @Type(() => CustomerDto)
  cessionarioCommittente: CustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  dettaglioLinee: InvoiceLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxSummaryDto)
  datiRiepilogo: TaxSummaryDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentDataDto)
  datiPagamento?: PaymentDataDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  allegati?: AttachmentDto[];

  @IsString()
  @IsOptional()
  codiceDestinatario?: string;

  @IsString()
  @IsOptional()
  pecDestinatario?: string;
}

/**
 * Supplier DTO
 */
export class SupplierDto {
  @ValidateNested()
  @Type(() => SupplierAnagraficaDto)
  datiAnagrafici: SupplierAnagraficaDto;

  @ValidateNested()
  @Type(() => AddressDto)
  sede: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactsDto)
  contattiTrasmittente?: ContactsDto;
}

/**
 * Supplier Anagrafica DTO
 */
export class SupplierAnagraficaDto {
  @IsString()
  @IsNotEmpty()
  partitaIVA: string;

  @IsString()
  @IsOptional()
  codiceFiscale?: string;

  @IsString()
  @IsOptional()
  denominazione?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  cognome?: string;

  regimeFiscale: RegimeFiscale;
}

/**
 * Customer DTO
 */
export class CustomerDto {
  @ValidateNested()
  @Type(() => CustomerAnagraficaDto)
  datiAnagrafici: CustomerAnagraficaDto;

  @ValidateNested()
  @Type(() => AddressDto)
  sede: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  stabileOrganizzazione?: AddressDto;
}

/**
 * Customer Anagrafica DTO
 */
export class CustomerAnagraficaDto {
  @IsString()
  @IsOptional()
  partitaIVA?: string;

  @IsString()
  @IsNotEmpty()
  codiceFiscale: string;

  @IsString()
  @IsOptional()
  denominazione?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  cognome?: string;
}

/**
 * Address DTO
 */
export class AddressDto {
  @IsString()
  @IsNotEmpty()
  indirizzo: string;

  @IsString()
  @IsOptional()
  numeroCivico?: string;

  @IsString()
  @IsNotEmpty()
  cap: string;

  @IsString()
  @IsNotEmpty()
  comune: string;

  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsNotEmpty()
  nazione: string;
}

/**
 * Contacts DTO
 */
export class ContactsDto {
  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

/**
 * Invoice Line DTO
 */
export class InvoiceLineDto {
  @IsNumber()
  @Min(1)
  numeroLinea: number;

  @IsString()
  @IsNotEmpty()
  descrizione: string;

  @IsNumber()
  @IsOptional()
  quantita?: number;

  @IsString()
  @IsOptional()
  unitaMisura?: string;

  @IsNumber()
  @Min(0)
  prezzoUnitario: number;

  @IsNumber()
  @Min(0)
  prezzoTotale: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  aliquotaIVA: number;

  @IsOptional()
  natura?: NaturaIVA;
}

/**
 * Tax Summary DTO
 */
export class TaxSummaryDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  aliquotaIVA: number;

  @IsOptional()
  natura?: NaturaIVA;

  @IsNumber()
  @Min(0)
  imponibile: number;

  @IsNumber()
  @Min(0)
  imposta: number;

  @IsString()
  @IsOptional()
  esigibilitaIVA?: 'I' | 'D' | 'S';

  @IsString()
  @IsOptional()
  riferimentoNormativo?: string;
}

/**
 * Payment Data DTO
 */
export class PaymentDataDto {
  condizioniPagamento: CondizioniPagamento;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  dettaglioPagamento: PaymentDetailDto[];
}

/**
 * Payment Detail DTO
 */
export class PaymentDetailDto {
  modalitaPagamento: ModalitaPagamento;

  @IsDateString()
  @IsOptional()
  dataScadenzaPagamento?: string;

  @IsNumber()
  @Min(0)
  importoPagamento: number;

  @IsString()
  @IsOptional()
  iban?: string;

  @IsString()
  @IsOptional()
  bic?: string;

  @IsString()
  @IsOptional()
  istitutoFinanziario?: string;
}

/**
 * Attachment DTO
 */
export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  nomeAttachment: string;

  @IsString()
  @IsOptional()
  algoritmoCompressione?: string;

  @IsString()
  @IsNotEmpty()
  formatoAttachment: string;

  @IsString()
  @IsOptional()
  descrizioneAttachment?: string;

  @IsString()
  @IsNotEmpty()
  attachment: string; // Base64 encoded
}
