import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InsuranceType,
  PolicyStatus,
  PaymentFrequency,
} from '@prisma/client';

export class InsuranceDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  fileUrl: string;

  @ApiPropertyOptional()
  fileType?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiProperty()
  uploadedAt: Date;
}

export class InsurancePaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  dueDate: Date;

  @ApiPropertyOptional()
  paidDate?: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class PolicyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: InsuranceType })
  type: InsuranceType;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional()
  policyNumber?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  coverageAmount?: number;

  @ApiPropertyOptional()
  deductible?: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  premiumAmount: number;

  @ApiProperty({ enum: PaymentFrequency })
  premiumFrequency: PaymentFrequency;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiPropertyOptional()
  renewalDate?: Date;

  @ApiProperty()
  autoRenew: boolean;

  @ApiProperty({ enum: PolicyStatus })
  status: PolicyStatus;

  @ApiPropertyOptional()
  contactName?: string;

  @ApiPropertyOptional()
  contactPhone?: string;

  @ApiPropertyOptional()
  contactEmail?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  reminderDays: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [InsuranceDocumentDto] })
  documents?: InsuranceDocumentDto[];

  @ApiPropertyOptional({ type: [InsurancePaymentDto] })
  payments?: InsurancePaymentDto[];
}
