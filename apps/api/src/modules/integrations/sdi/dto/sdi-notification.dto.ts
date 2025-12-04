import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SDINotificationType } from '../types/sdi.types';

/**
 * DTO for SDI notification webhook
 */
export class SDINotificationDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  identificativoSdI: string;

  @IsString()
  @IsNotEmpty()
  nomeFile: string;

  @IsEnum(SDINotificationType)
  notificationType: SDINotificationType;

  @IsString()
  @IsNotEmpty()
  xmlPayload: string; // Raw XML notification from SDI
}

/**
 * DTO for querying invoice status
 */
export class QueryInvoiceStatusDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsOptional()
  identificativoSdI?: string;

  @IsString()
  @IsOptional()
  invoiceId?: string;
}
