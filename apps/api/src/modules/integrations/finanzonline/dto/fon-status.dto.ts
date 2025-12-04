import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FonSubmissionStatus } from '../interfaces/fon-response.interface';

/**
 * Processing message DTO
 */
export class FonProcessingMessageDto {
  @ApiProperty({
    description: 'Message type',
    enum: ['INFO', 'WARNING', 'ERROR'],
    example: 'INFO',
  })
  @IsEnum(['INFO', 'WARNING', 'ERROR'])
  type: 'INFO' | 'WARNING' | 'ERROR';

  @ApiProperty({
    description: 'Message code',
    example: 'VAT_001',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Message text',
    example: 'VAT return successfully submitted',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Field reference if applicable',
    required: false,
    example: 'taxAmount',
  })
  @IsString()
  @IsOptional()
  field?: string;
}

/**
 * Document DTO
 */
export class FonDocumentDto {
  @ApiProperty({
    description: 'Document type',
    enum: ['PDF', 'XML'],
    example: 'PDF',
  })
  @IsEnum(['PDF', 'XML'])
  type: 'PDF' | 'XML';

  @ApiProperty({
    description: 'Document description',
    example: 'VAT Return Confirmation',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Download URL',
    example: 'https://finanzonline.bmf.gv.at/download/doc123',
  })
  @IsString()
  downloadUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    required: false,
    example: 12345,
  })
  @IsOptional()
  size?: number;

  @ApiProperty({
    description: 'Document date',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;
}

/**
 * FinanzOnline status response DTO
 */
export class FonStatusResponseDto {
  @ApiProperty({
    description: 'Success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response timestamp',
    type: Date,
  })
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({
    description: 'Reference ID for tracking',
    required: false,
    example: 'FON-2025-11-29-ABCD1234',
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({
    description: 'Current submission status',
    enum: FonSubmissionStatus,
    required: false,
    example: FonSubmissionStatus.COMPLETED,
  })
  @IsEnum(FonSubmissionStatus)
  @IsOptional()
  status?: FonSubmissionStatus;

  @ApiProperty({
    description: 'Status description',
    required: false,
    example: 'Submission successfully processed',
  })
  @IsString()
  @IsOptional()
  statusDescription?: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastUpdated?: Date;

  @ApiProperty({
    description: 'Processing messages',
    required: false,
    type: [FonProcessingMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FonProcessingMessageDto)
  @IsOptional()
  messages?: FonProcessingMessageDto[];

  @ApiProperty({
    description: 'Downloadable documents',
    required: false,
    type: [FonDocumentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FonDocumentDto)
  @IsOptional()
  documents?: FonDocumentDto[];

  @ApiProperty({
    description: 'Error message',
    required: false,
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({
    description: 'Warning messages',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  warnings?: string[];
}
