import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto, LineItemDto } from './calculate-tax.dto';

/**
 * Calculate Invoice Tax DTO
 */
export class CalculateInvoiceTaxDto {
  @ApiProperty({ example: 'inv-12345' })
  @IsString()
  invoiceId: string;

  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  commit?: boolean;
}

/**
 * Calculate Cart Tax DTO
 */
export class CalculateCartTaxDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 'CUST-12345' })
  @IsString()
  customerCode: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  destinationAddress: AddressDto;

  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  originAddress?: AddressDto;

  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  items: LineItemDto[];
}

/**
 * Manage Nexus DTO
 */
export class ManageNexusDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 'CA', description: '2-letter state code' })
  @IsString()
  state: string;

  @ApiProperty({ enum: ['create', 'update', 'deactivate'] })
  @IsString()
  action: 'create' | 'update' | 'deactivate';

  @ApiPropertyOptional()
  @IsOptional()
  data?: {
    effectiveDate?: Date;
    nexusTypeId?: string;
    salesThreshold?: number;
    transactionThreshold?: number;
    taxRegistrationId?: string;
  };
}

/**
 * Track Nexus Sales DTO
 */
export class TrackNexusSalesDto {
  @ApiProperty({ example: 'org-67890' })
  @IsString()
  orgId: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  state: string;

  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  @Min(0)
  amount: number;
}
