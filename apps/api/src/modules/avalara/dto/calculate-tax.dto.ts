import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductTaxability } from '../types/us-tax-jurisdiction.types';

/**
 * Address DTO for tax calculation
 */
export class AddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty({ example: 'Seattle' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'WA', description: '2-letter state code' })
  @IsString()
  state: string;

  @ApiProperty({ example: '98101', description: 'ZIP or ZIP+4' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  country: string;
}

/**
 * Line item for tax calculation
 */
export class LineItemDto {
  @ApiProperty({ example: 'ITEM-001' })
  @IsString()
  itemCode: string;

  @ApiPropertyOptional({ example: 'Software Subscription' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 99.99, description: 'Unit price' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: 'SAAS',
    enum: ProductTaxability,
    description: 'AvaTax product taxability code',
  })
  @IsOptional()
  taxCode?: ProductTaxability;

  @ApiPropertyOptional({ example: 'EXEMPT-123' })
  @IsString()
  @IsOptional()
  exemptionCode?: string;

  @ApiPropertyOptional({ example: '123 Main St, Seattle, WA 98101' })
  @IsString()
  @IsOptional()
  destinationAddress?: string;

  @ApiPropertyOptional({ example: '456 Oak Ave, Portland, OR 97201' })
  @IsString()
  @IsOptional()
  originAddress?: string;
}

/**
 * Calculate Tax Request DTO
 */
export class CalculateTaxDto {
  @ApiProperty({ example: 'CUST-12345' })
  @IsString()
  customerCode: string;

  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  originAddress?: AddressDto;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  destinationAddress: AddressDto;

  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lines: LineItemDto[];

  @ApiPropertyOptional({ example: '2024-12-02' })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiPropertyOptional({ example: 'SalesInvoice' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'PO-12345' })
  @IsString()
  @IsOptional()
  purchaseOrderNo?: string;

  @ApiPropertyOptional({ example: 'CERT-123' })
  @IsString()
  @IsOptional()
  exemptionNo?: string;

  @ApiPropertyOptional({ example: 'REF-001' })
  @IsString()
  @IsOptional()
  referenceCode?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  commit?: boolean;
}

/**
 * Tax Calculation Response DTO
 */
export class TaxCalculationResponseDto {
  @ApiProperty({ example: 8.99 })
  totalTax: number;

  @ApiProperty({ example: 0.089 })
  rate: number;

  @ApiProperty({ example: 100.00 })
  totalAmount: number;

  @ApiProperty({ example: 100.00 })
  taxableAmount: number;

  @ApiProperty({ example: 0.00 })
  exemptAmount: number;

  @ApiProperty()
  lines: Array<{
    lineNumber: string;
    tax: number;
    rate: number;
    exemptAmount: number;
    taxableAmount: number;
    details: Array<{
      jurisdictionType: string;
      jurisdictionName: string;
      rate: number;
      tax: number;
      taxName: string;
      stateAssignedNo?: string;
    }>;
  }>;

  @ApiProperty()
  summary: Array<{
    country: string;
    region: string;
    jurisType: string;
    jurisName: string;
    taxAuthorityType: number;
    rate: number;
    tax: number;
    taxable: number;
    exemption: number;
  }>;

  @ApiPropertyOptional()
  messages?: Array<{
    severity: string;
    summary: string;
    details?: string;
  }>;

  @ApiProperty()
  taxDate: string;

  @ApiPropertyOptional()
  code?: string;
}
