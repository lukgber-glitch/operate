import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  Min,
  Max,
  Matches,
  ValidateNested,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GstHstReturnType } from '../interfaces/cra.interface';

/**
 * Connect to CRA DTO
 */
export class ConnectCraDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({
    description: 'Business Number (9 digits + 2 letters + 4 digits)',
    example: '123456789RT0001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{9}[A-Z]{2}\d{4}$/, {
    message: 'Invalid Business Number format',
  })
  businessNumber: string;

  @ApiPropertyOptional({ description: 'CRA Web Access Code' })
  @IsOptional()
  @IsString()
  webAccessCode?: string;
}

/**
 * GST/HST Reporting Period DTO
 */
export class GstHstPeriodDto {
  @ApiProperty({ description: 'Reporting period start date' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'Reporting period end date' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: 'Filing frequency',
    enum: ['monthly', 'quarterly', 'annual'],
  })
  @IsEnum(['monthly', 'quarterly', 'annual'])
  frequency: 'monthly' | 'quarterly' | 'annual';

  @ApiProperty({ description: 'Filing due date' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;
}

/**
 * Schedule A Adjustments DTO
 */
export class ScheduleADto {
  @ApiPropertyOptional({ description: 'Bad debt recoveries' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  badDebtRecoveries?: number;

  @ApiPropertyOptional({ description: 'Provincial rebates' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  provincialRebates?: number;

  @ApiPropertyOptional({ description: 'Other adjustments' })
  @IsOptional()
  otherAdjustments?: Array<{
    description: string;
    amount: number;
  }>;
}

/**
 * GST/HST Return DTO
 */
export class GstHstReturnDto {
  @ApiProperty({
    description: 'Business Number',
    example: '123456789RT0001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{9}[A-Z]{2}\d{4}$/)
  businessNumber: string;

  @ApiProperty({ description: 'Reporting period' })
  @ValidateNested()
  @Type(() => GstHstPeriodDto)
  reportingPeriod: GstHstPeriodDto;

  @ApiProperty({
    description: 'Return type',
    enum: GstHstReturnType,
  })
  @IsEnum(GstHstReturnType)
  returnType: GstHstReturnType;

  // Line items
  @ApiProperty({ description: 'Line 101: Sales and other revenue' })
  @IsNumber()
  @Min(0)
  line101_salesRevenue: number;

  @ApiProperty({ description: 'Line 103: GST/HST collected or collectible' })
  @IsNumber()
  @Min(0)
  line103_taxCollected: number;

  @ApiPropertyOptional({ description: 'Line 104: Adjustments' })
  @IsOptional()
  @IsNumber()
  line104_adjustments?: number;

  @ApiProperty({ description: 'Line 105: Total GST/HST to remit' })
  @IsNumber()
  @Min(0)
  line105_totalTaxToRemit: number;

  @ApiProperty({ description: 'Line 106: ITCs for current period' })
  @IsNumber()
  @Min(0)
  line106_currentITCs: number;

  @ApiPropertyOptional({ description: 'Line 107: ITC adjustments' })
  @IsOptional()
  @IsNumber()
  line107_itcAdjustments?: number;

  @ApiProperty({ description: 'Line 108: Total ITCs' })
  @IsNumber()
  @Min(0)
  line108_totalITCs: number;

  @ApiProperty({ description: 'Line 109: Net tax (remittance or refund)' })
  @IsNumber()
  line109_netTax: number;

  @ApiPropertyOptional({ description: 'Line 110: Installment refund claimed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  line110_installmentRefund?: number;

  @ApiPropertyOptional({ description: 'Line 111: Other credits' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  line111_otherCredits?: number;

  @ApiPropertyOptional({ description: 'Line 112: Total credits' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  line112_totalCredits?: number;

  @ApiPropertyOptional({ description: 'Line 113A: Amount owing' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  line113A_amountOwing?: number;

  @ApiPropertyOptional({ description: 'Line 113B: Refund claimed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  line113B_refundClaimed?: number;

  @ApiPropertyOptional({ description: 'Line 114: Rebate claimed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  line114_rebateClaimed?: number;

  @ApiPropertyOptional({ description: 'Schedule A adjustments' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleADto)
  scheduleA?: ScheduleADto;

  @ApiProperty({ description: 'Certifier name' })
  @IsString()
  @IsNotEmpty()
  certifierName: string;

  @ApiProperty({ description: 'Certifier capacity' })
  @IsString()
  @IsNotEmpty()
  certifierCapacity: string;

  @ApiProperty({ description: 'Declaration date' })
  @IsDate()
  @Type(() => Date)
  declarationDate: Date;
}

/**
 * Transmitter Information DTO
 */
export class TransmitterInfoDto {
  @ApiProperty({ description: 'Transmitter name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'EFILE number' })
  @IsString()
  @IsNotEmpty()
  efileNumber: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsPhoneNumber('CA')
  contactPhone: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  contactEmail: string;
}

/**
 * Submit GST/HST Return DTO
 */
export class SubmitGstHstReturnDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: 'GST/HST return data' })
  @ValidateNested()
  @Type(() => GstHstReturnDto)
  gstHstReturn: GstHstReturnDto;

  @ApiProperty({ description: 'Transmitter information' })
  @ValidateNested()
  @Type(() => TransmitterInfoDto)
  transmitterInfo: TransmitterInfoDto;
}

/**
 * Validate Return DTO
 */
export class ValidateReturnDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: 'GST/HST return data' })
  @ValidateNested()
  @Type(() => GstHstReturnDto)
  returnData: GstHstReturnDto;
}

/**
 * Check Filing Status DTO
 */
export class CheckFilingStatusDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: 'CRA confirmation number' })
  @IsString()
  @IsNotEmpty()
  confirmationNumber: string;
}

/**
 * Get Filing History DTO
 */
export class GetFilingHistoryDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Start date for history' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for history' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;
}
