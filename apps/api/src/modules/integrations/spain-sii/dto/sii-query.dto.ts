import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  Matches,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SiiPartyDto } from './submit-invoice.dto';
import { SiiInvoiceType } from '../constants/sii.constants';

/**
 * Query Invoices DTO
 */
export class QueryInvoicesDto {
  @ValidateNested()
  @Type(() => SiiPartyDto)
  holder: SiiPartyDto;

  @IsNumber()
  @Min(2017)
  @Max(2099)
  fiscalYear: number;

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2]|[1-4]T|0A)$/)
  period?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{9,14}$/)
  issuerNif?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{9,14}$/)
  recipientNif?: string;

  @IsOptional()
  @IsEnum(SiiInvoiceType)
  invoiceType?: SiiInvoiceType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * Get Submission Status DTO
 */
export class GetSubmissionStatusDto {
  @IsString()
  submissionId: string;

  @ValidateNested()
  @Type(() => SiiPartyDto)
  holder: SiiPartyDto;
}

/**
 * Delete Invoice DTO
 */
export class DeleteInvoiceDto {
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
  invoiceNumber: string;

  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @IsEnum(SiiInvoiceType)
  invoiceType: SiiInvoiceType;
}
