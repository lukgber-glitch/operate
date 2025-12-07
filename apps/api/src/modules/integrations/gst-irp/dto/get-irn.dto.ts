/**
 * Get IRN DTO
 *
 * Data Transfer Objects for retrieving IRN details
 */

import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { GstInvoiceType } from '../gst-irp.types';

export class GetIrnByIrnDto {
  @IsNotEmpty()
  @IsString()
  irn: string;
}

export class GetIrnByDocumentDto {
  @IsNotEmpty()
  docType: GstInvoiceType;

  @IsNotEmpty()
  @IsString()
  docNo: string;

  @IsNotEmpty()
  @IsString()
  docDate: string; // DD/MM/YYYY format
}
