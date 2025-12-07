import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsArray,
  IsNumber,
  IsObject,
  Min,
  Max,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ClientStatus,
  ClientType,
  RiskLevel,
  AddressType,
} from '@prisma/client';

// ============================================================================
// CLIENT DTOs
// ============================================================================

export class CreateClientDto {
  @ApiProperty({ enum: ClientType, default: ClientType.COMPANY })
  type: ClientType;

  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Acme Corporation Ltd.' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ example: 'Acme Corporation' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'DE123456789' })
  @IsOptional()
  @IsString()
  vatId?: string;

  @ApiPropertyOptional({ example: 'TAX123456' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'REG123456' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+49 30 12345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+49 171 1234567' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'https://www.acme.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '50-200' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional({ example: 5, description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: 'Important client notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Internal team notes' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ example: ['vip', 'high-priority'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { customField1: 'value1' } })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ example: 'website', default: 'manual' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'CLT-001' })
  @IsOptional()
  @IsString()
  referredBy?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({ enum: ClientStatus })
  @IsOptional()
  status?: ClientStatus;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  riskScore?: number;
}

export class ClientFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 50;

  @ApiPropertyOptional({ example: 'acme' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ClientStatus })
  @IsOptional()
  status?: ClientStatus;

  @ApiPropertyOptional({ enum: ClientType })
  @IsOptional()
  type?: ClientType;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ example: ['vip', 'high-priority'], type: [String] })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVip?: boolean;

  @ApiPropertyOptional({ description: 'Cursor for cursor-based pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ example: 'name', default: 'name' })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'clientNumber', 'createdAt', 'totalRevenue', 'lastPaymentDate'])
  sortBy?: string = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeContacts?: boolean = false;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAddresses?: boolean = false;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeActivity?: boolean = false;
}

export class BulkUpdateDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  clientIds: string[];

  @ApiProperty({ type: () => UpdateClientDto })
  @ValidateNested()
  @Type(() => UpdateClientDto)
  updates: UpdateClientDto;
}

export class ClientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  clientNumber: string;

  @ApiProperty({ enum: ClientType })
  type: ClientType;

  @ApiProperty({ enum: ClientStatus })
  status: ClientStatus;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  legalName?: string;

  @ApiPropertyOptional()
  companyName?: string;

  @ApiPropertyOptional()
  vatId?: string;

  @ApiPropertyOptional()
  taxId?: string;

  @ApiPropertyOptional()
  registrationNumber?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  mobile?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  companySize?: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  paymentTerms: number;

  @ApiPropertyOptional()
  creditLimit?: number;

  @ApiPropertyOptional()
  discount?: number;

  @ApiProperty()
  isVip: boolean;

  @ApiProperty({ enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiPropertyOptional()
  riskScore?: number;

  @ApiPropertyOptional()
  lastRiskAssessment?: Date;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  outstandingBalance: number;

  @ApiProperty()
  totalInvoices: number;

  @ApiProperty()
  totalPaidInvoices: number;

  @ApiPropertyOptional()
  averagePaymentDays?: number;

  @ApiPropertyOptional()
  lastInvoiceDate?: Date;

  @ApiPropertyOptional()
  lastPaymentDate?: Date;

  @ApiPropertyOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional()
  metadata?: any;

  @ApiPropertyOptional()
  source?: string;

  @ApiPropertyOptional()
  referredBy?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================================================
// CONTACT DTOs
// ============================================================================

export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'john.doe@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+49 30 12345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+49 171 1234567' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Chief Executive Officer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Management' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isBilling?: boolean;

  @ApiPropertyOptional({ example: 'Prefers email communication' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ContactResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  mobile?: string;

  @ApiPropertyOptional()
  position?: string;

  @ApiPropertyOptional()
  jobTitle?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isBilling: boolean;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================================================
// ADDRESS DTOs
// ============================================================================

export class CreateAddressDto {
  @ApiProperty({ enum: AddressType, default: AddressType.BILLING })
  type: AddressType;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsOptional()
  @IsString()
  street2?: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10115' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'DE', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

export class AddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty({ enum: AddressType })
  type: AddressType;

  @ApiPropertyOptional()
  street?: string;

  @ApiPropertyOptional()
  street2?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================================================
// NOTE DTOs
// ============================================================================

export class CreateNoteDto {
  @ApiPropertyOptional({ example: 'Follow-up call' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Discussed pricing for Q1 2024' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'Pricing discussion' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: { priority: 'high' } })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
