import { VendorStatus, TaxIdType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Vendor entity representing suppliers and service providers
 * Used for Accounts Payable (AP) management
 */
export class Vendor {
  @ApiProperty({ description: 'Unique vendor identifier' })
  id: string;

  @ApiProperty({ description: 'Organisation ID this vendor belongs to' })
  organisationId: string;

  @ApiProperty({ description: 'Vendor name' })
  name: string;

  @ApiPropertyOptional({ description: 'Display name (if different from legal name)' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @ApiPropertyOptional({ description: 'Address line 1' })
  addressLine1?: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province/Region' })
  state?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country (ISO 3166-1 alpha-2)' })
  country?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  taxId?: string;

  @ApiProperty({
    enum: TaxIdType,
    description: 'Type of tax ID',
    default: TaxIdType.OTHER,
  })
  taxIdType: TaxIdType;

  @ApiProperty({
    description: 'Payment terms in days',
    default: 30,
    example: 30,
  })
  paymentTerms: number;

  @ApiPropertyOptional({ description: 'Preferred payment method (e.g., bank_transfer, credit_card)' })
  preferredPaymentMethod?: string;

  @ApiPropertyOptional({ description: 'Bank account holder name' })
  bankAccountName?: string;

  @ApiPropertyOptional({ description: 'Bank IBAN' })
  bankIban?: string;

  @ApiPropertyOptional({ description: 'Bank BIC/SWIFT code' })
  bankBic?: string;

  @ApiPropertyOptional({ description: 'Default category ID for auto-categorization' })
  defaultCategoryId?: string;

  @ApiProperty({
    description: 'Default tax deductible flag for expenses',
    default: true,
  })
  defaultTaxDeductible: boolean;

  @ApiProperty({
    enum: VendorStatus,
    description: 'Vendor status',
    default: VendorStatus.ACTIVE,
  })
  status: VendorStatus;

  @ApiPropertyOptional({ description: 'Internal notes about the vendor' })
  notes?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
