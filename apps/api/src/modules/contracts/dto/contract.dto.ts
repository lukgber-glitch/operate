import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
  IsBoolean,
  IsEmail,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContractStatus, TemplateCategory } from '@prisma/client';

// ============================================================================
// CONTRACT DTOs
// ============================================================================

export class CreateContractDto {
  @ApiProperty({ example: 'Service Agreement for Q1 2025' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Consulting services for project X' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'clxxx...' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ example: 'clxxx...' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ example: 'Full contract content here...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 5000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}

export class SendContractDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  signerEmail: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  signerName: string;
}

export class SignContractDto {
  @ApiProperty({ example: 'data:image/png;base64,...' })
  @IsString()
  signatureData: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  signerName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  signerEmail: string;
}

export class CreateFromTemplateDto {
  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  templateId: string;

  @ApiPropertyOptional({ example: 'clxxx...' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({
    example: {
      'client.name': 'Acme Corp',
      'client.company': 'Acme Corporation Ltd',
      'contract.value': '5000',
      'contract.startDate': '2025-01-01'
    }
  })
  @IsObject()
  variables: Record<string, string>;
}

export class ContractResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organisationId: string;

  @ApiPropertyOptional()
  clientId?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: ContractStatus })
  status: ContractStatus;

  @ApiPropertyOptional()
  value?: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  viewedAt?: Date;

  @ApiPropertyOptional()
  signedAt?: Date;

  @ApiPropertyOptional()
  signerName?: string;

  @ApiPropertyOptional()
  signerEmail?: string;

  @ApiPropertyOptional()
  signatureToken?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================================================
// TEMPLATE DTOs
// ============================================================================

export class CreateTemplateDto {
  @ApiProperty({ example: 'Standard NDA' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Non-disclosure agreement for clients' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TemplateCategory })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ example: 'Template content with {{variables}}' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: ['client.name', 'client.company', 'contract.value', 'contract.startDate']
  })
  @IsOptional()
  @IsObject()
  variables?: string[];
}

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}

export class TemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  organisationId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TemplateCategory })
  category: TemplateCategory;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  variables?: string[];

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
