import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Auth URL Request DTO
 */
export class HmrcAuthUrlRequestDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;
}

/**
 * Auth URL Response DTO
 */
export class HmrcAuthUrlResponseDto {
  @ApiProperty({
    description: 'HMRC OAuth2 authorization URL',
    example: 'https://api.service.hmrc.gov.uk/oauth/authorize?...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'OAuth state parameter for CSRF protection',
    example: 'abc123xyz789',
  })
  state: string;
}

/**
 * OAuth Callback Query DTO
 */
export class HmrcCallbackQueryDto {
  @ApiPropertyOptional({
    description: 'Authorization code from HMRC',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF validation',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'OAuth error code',
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({
    description: 'OAuth error description',
  })
  @IsOptional()
  @IsString()
  error_description?: string;
}

/**
 * Connection Info Response DTO
 */
export class HmrcConnectionInfoDto {
  @ApiProperty({
    description: 'Connection ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  orgId: string;

  @ApiProperty({
    description: 'VAT Registration Number',
    example: 'GB123456789',
  })
  vrn: string;

  @ApiProperty({
    description: 'Connection status',
    enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR'],
  })
  status: string;

  @ApiProperty({
    description: 'Is currently connected',
    example: true,
  })
  isConnected: boolean;

  @ApiPropertyOptional({
    description: 'Last sync timestamp',
    example: '2025-12-02T12:00:00Z',
  })
  lastSyncAt?: Date;

  @ApiPropertyOptional({
    description: 'Last error message',
  })
  lastError?: string;

  @ApiProperty({
    description: 'Access token expiry',
    example: '2025-12-02T16:00:00Z',
  })
  tokenExpiresAt: Date;

  @ApiProperty({
    description: 'Refresh token expiry',
    example: '2025-12-16T12:00:00Z',
  })
  refreshTokenExpiresAt: Date;

  @ApiProperty({
    description: 'Environment',
    example: 'sandbox',
  })
  environment: string;

  @ApiProperty({
    description: 'Connection timestamp',
    example: '2025-12-02T12:00:00Z',
  })
  connectedAt: Date;

  @ApiPropertyOptional({
    description: 'Disconnection timestamp',
  })
  disconnectedAt?: Date;
}

/**
 * VAT Obligations Query DTO
 */
export class VATObligationsQueryDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsDateString()
  to: string;

  @ApiPropertyOptional({
    description: 'Obligation status filter',
    enum: ['O', 'F'],
  })
  @IsOptional()
  @IsEnum(['O', 'F'])
  status?: 'O' | 'F';
}

/**
 * VAT Return Submission DTO
 */
export class VATReturnDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'VAT period key from obligations',
    example: '#001',
  })
  @IsString()
  @IsNotEmpty()
  periodKey: string;

  @ApiProperty({
    description: 'VAT due on sales (Box 1)',
    example: 1000.50,
  })
  @IsNumber()
  @Min(0)
  vatDueSales: number;

  @ApiProperty({
    description: 'VAT due on acquisitions (Box 2)',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  vatDueAcquisitions: number;

  @ApiProperty({
    description: 'Total VAT due (Box 3)',
    example: 1000.50,
  })
  @IsNumber()
  @Min(0)
  totalVatDue: number;

  @ApiProperty({
    description: 'VAT reclaimed on purchases (Box 4)',
    example: 500.25,
  })
  @IsNumber()
  @Min(0)
  vatReclaimedCurrPeriod: number;

  @ApiProperty({
    description: 'Net VAT to pay/reclaim (Box 5)',
    example: 500.25,
  })
  @IsNumber()
  netVatDue: number;

  @ApiProperty({
    description: 'Total value of sales excluding VAT (Box 6)',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  totalValueSalesExVAT: number;

  @ApiProperty({
    description: 'Total value of purchases excluding VAT (Box 7)',
    example: 2500,
  })
  @IsNumber()
  @Min(0)
  totalValuePurchasesExVAT: number;

  @ApiProperty({
    description: 'Total value of goods supplied excluding VAT (Box 8)',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  totalValueGoodsSuppliedExVAT: number;

  @ApiProperty({
    description: 'Total acquisitions excluding VAT (Box 9)',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  totalAcquisitionsExVAT: number;

  @ApiProperty({
    description: 'Declaration that return is finalised',
    example: true,
  })
  @IsBoolean()
  finalised: boolean;
}

/**
 * VAT Return Response DTO
 */
export class VATReturnResponseDto {
  @ApiProperty({
    description: 'HMRC processing date',
    example: '2025-12-02T12:00:00Z',
  })
  processingDate: string;

  @ApiProperty({
    description: 'Payment indicator',
    example: 'BANK',
  })
  paymentIndicator: string;

  @ApiProperty({
    description: 'Form bundle number',
    example: '256660290587',
  })
  formBundleNumber: string;

  @ApiPropertyOptional({
    description: 'Charge reference number',
  })
  chargeRefNumber?: string;
}

/**
 * VAT Liabilities Query DTO
 */
export class VATLiabilitiesQueryDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsDateString()
  to: string;
}

/**
 * VAT Payments Query DTO
 */
export class VATPaymentsQueryDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsDateString()
  to: string;
}

/**
 * Disconnect Request DTO
 */
export class HmrcDisconnectDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;
}

/**
 * Disconnect Response DTO
 */
export class HmrcDisconnectResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'HMRC connection disconnected successfully',
  })
  message: string;
}
