import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ExemptionType, ExemptionStatus } from '@prisma/client';

/**
 * Create Exemption Certificate DTO
 */
export class CreateExemptionCertificateDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({ example: 'cust-12345' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'CERT-2024-001' })
  @IsString()
  certificateNumber: string;

  @ApiProperty({ enum: ExemptionType })
  exemptionType: ExemptionType;

  @ApiPropertyOptional({ example: 'Nonprofit organization' })
  @IsString()
  @IsOptional()
  exemptionReason?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ example: ['CA', 'NY', 'TX'], description: 'States where exemption applies' })
  @IsArray()
  @IsString({ each: true })
  states: string[];

  @ApiPropertyOptional({ example: 'https://example.com/cert.pdf' })
  @IsUrl()
  @IsOptional()
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'CA State Board of Equalization' })
  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsString()
  @IsOptional()
  issuingState?: string;

  @ApiPropertyOptional({ example: 'user-12345' })
  @IsString()
  @IsOptional()
  verifiedBy?: string;
}

/**
 * Update Exemption Certificate DTO
 */
export class UpdateExemptionCertificateDto {
  @ApiPropertyOptional({ enum: ExemptionStatus })
  @IsOptional()
  status?: ExemptionStatus;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({ example: ['CA', 'NY', 'TX'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  states?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/cert.pdf' })
  @IsUrl()
  @IsOptional()
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'user-12345' })
  @IsString()
  @IsOptional()
  verifiedBy?: string;
}

/**
 * Validate Exemption Certificate DTO
 */
export class ValidateExemptionCertificateDto {
  @ApiProperty({ example: 'cert-12345' })
  @IsString()
  certificateId: string;

  @ApiProperty({ example: 'user-67890' })
  @IsString()
  verifiedBy: string;
}

/**
 * Verify Resale Certificate DTO
 */
export class VerifyResaleCertificateDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 'CERT-2024-001' })
  @IsString()
  certificateNumber: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  state: string;
}
