import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDecimal,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ClientStatus,
  ClientType,
  RiskLevel,
  CommunicationType,
  CommunicationDirection,
} from '@prisma/client';

// ============================================================================
// CLIENT DTOs
// ============================================================================

export class CreateClientDto {
  type: ClientType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  vatId?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  billingStreet?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @IsOptional()
  @IsString()
  billingState?: string;

  @IsOptional()
  @IsString()
  billingCountryCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateClientDto {
  @IsOptional()
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  vatId?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  billingStreet?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @IsOptional()
  @IsString()
  billingState?: string;

  @IsOptional()
  @IsString()
  billingCountryCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  metadata?: any;
}

export class ClientFiltersDto {
  @IsOptional()
  status?: ClientStatus;

  @IsOptional()
  type?: ClientType;

  @IsOptional()
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;
}

export class ClientResponseDto {
  id: string;
  orgId: string;
  type: ClientType;
  status: ClientStatus;
  name: string;
  displayName?: string;
  companyName?: string;
  vatId?: string;
  taxId?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  countryCode?: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingState?: string;
  billingCountryCode?: string;
  currency: string;
  paymentTerms: number;
  creditLimit?: number;
  riskLevel: RiskLevel;
  riskScore?: number;
  lastRiskAssessment?: Date;
  totalRevenue: number;
  totalInvoices: number;
  totalPaidInvoices: number;
  averagePaymentDays?: number;
  lastInvoiceDate?: Date;
  lastPaymentDate?: Date;
  notes?: string;
  internalNotes?: string;
  tags: string[];
  metadata?: any;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  contacts?: ContactResponseDto[];
  communications?: CommunicationResponseDto[];
  payments?: any[];
}

// ============================================================================
// CONTACT DTOs
// ============================================================================

export class CreateContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isBilling?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isBilling?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ContactResponseDto {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
  isBilling: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// COMMUNICATION DTOs
// ============================================================================

export class LogCommunicationDto {
  type: CommunicationType;

  direction: CommunicationDirection;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  emailMessageId?: string;

  @IsOptional()
  @IsString()
  emailThreadId?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  metadata?: any;
}

export class UpdateCommunicationDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  metadata?: any;
}

export class CommunicationResponseDto {
  id: string;
  clientId: string;
  userId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  summary?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  emailMessageId?: string;
  emailThreadId?: string;
  metadata?: any;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CommunicationFiltersDto {
  @IsOptional()
  type?: CommunicationType;

  @IsOptional()
  direction?: CommunicationDirection;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;
}

// ============================================================================
// INSIGHTS DTOs - Re-export from client-insights.dto
// ============================================================================

export * from './client-insights.dto';
