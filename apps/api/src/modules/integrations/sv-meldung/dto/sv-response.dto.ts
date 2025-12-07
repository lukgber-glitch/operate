import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SvResponseStatus,
  ErrorSeverity,
  SvError,
} from '../interfaces/sv-response.interface';

/**
 * SV Error DTO
 */
export class SvErrorDto implements SvError {
  @ApiProperty({ description: 'Error code' })
  code!: string;

  @ApiProperty({ description: 'Error message' })
  message!: string;

  @ApiProperty({ description: 'Error severity', enum: ErrorSeverity })
  severity!: ErrorSeverity;

  @ApiPropertyOptional({ description: 'Field that caused the error' })
  field?: string;

  @ApiPropertyOptional({ description: 'Line number in DEÜV file' })
  line?: number;

  @ApiPropertyOptional({ description: 'Additional context' })
  context?: Record<string, any>;
}

/**
 * SV Response DTO
 */
export class SvResponseDto {
  @ApiProperty({
    description: 'Unique submission ID',
    example: 'sub_1234567890abcdef',
  })
  submissionId!: string;

  @ApiProperty({
    description: 'Response status',
    enum: SvResponseStatus,
    example: 'ACCEPTED',
  })
  status!: SvResponseStatus;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt!: Date;

  @ApiPropertyOptional({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:05Z',
  })
  respondedAt?: Date;

  @ApiProperty({
    description: 'Carrier ID',
    example: '108018347',
  })
  carrierId!: string;

  @ApiProperty({
    description: 'Message type',
    example: 'ANMELDUNG',
  })
  messageType!: string;

  @ApiProperty({
    description: 'Number of records submitted',
    example: 1,
  })
  recordsSubmitted!: number;

  @ApiProperty({
    description: 'Number of records accepted',
    example: 1,
  })
  recordsAccepted!: number;

  @ApiProperty({
    description: 'Number of records rejected',
    example: 0,
  })
  recordsRejected!: number;

  @ApiProperty({
    description: 'Errors and warnings',
    type: [SvErrorDto],
  })
  errors!: SvErrorDto[];

  @ApiPropertyOptional({
    description: 'Confirmation number from carrier',
    example: 'CONF-2024-001234',
  })
  confirmationNumber?: string;

  @ApiPropertyOptional({
    description: 'Raw response data (for debugging)',
  })
  rawResponse?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  metadata?: Record<string, any>;
}

/**
 * Batch submission response DTO
 */
export class BatchSvResponseDto {
  @ApiProperty({
    description: 'Batch ID',
    example: 'batch_1234567890',
  })
  batchId!: string;

  @ApiProperty({
    description: 'Total messages in batch',
    example: 10,
  })
  totalMessages!: number;

  @ApiProperty({
    description: 'Successfully submitted',
    example: 9,
  })
  successfulSubmissions!: number;

  @ApiProperty({
    description: 'Failed submissions',
    example: 1,
  })
  failedSubmissions!: number;

  @ApiProperty({
    description: 'Individual results',
    type: [SvResponseDto],
  })
  results!: SvResponseDto[];

  @ApiProperty({
    description: 'Batch submission timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt!: Date;

  @ApiProperty({
    description: 'Overall batch status',
    enum: SvResponseStatus,
    example: 'PARTIAL',
  })
  overallStatus!: SvResponseStatus;
}

/**
 * DEÜV message preview DTO
 */
export class DeuevPreviewDto {
  @ApiProperty({
    description: 'Message type',
    example: 'ANMELDUNG',
  })
  messageType!: string;

  @ApiProperty({
    description: 'Generated DEÜV message',
    example: 'VOSZ8.1...',
  })
  deuevMessage!: string;

  @ApiProperty({
    description: 'Message size in bytes',
    example: 1024,
  })
  messageSize!: number;

  @ApiProperty({
    description: 'Record count',
    example: 1,
  })
  recordCount!: number;

  @ApiProperty({
    description: 'Validation status',
    example: true,
  })
  isValid!: boolean;

  @ApiPropertyOptional({
    description: 'Validation errors',
    type: [SvErrorDto],
  })
  validationErrors?: SvErrorDto[];

  @ApiProperty({
    description: 'Preview timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt!: Date;
}

/**
 * Cached submission DTO
 */
export class CachedSubmissionDto {
  @ApiProperty({
    description: 'Submission ID',
    example: 'sub_1234567890abcdef',
  })
  submissionId!: string;

  @ApiProperty({
    description: 'Employee ID',
    example: 'emp_1234567890',
  })
  employeeId!: string;

  @ApiProperty({
    description: 'Message type',
    example: 'ANMELDUNG',
  })
  messageType!: string;

  @ApiProperty({
    description: 'Submission data hash',
    example: 'sha256:abc123...',
  })
  dataHash!: string;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt!: string;

  @ApiProperty({
    description: 'Response status',
    enum: SvResponseStatus,
    example: 'ACCEPTED',
  })
  status!: SvResponseStatus;

  @ApiProperty({
    description: 'Cache expiry',
    example: '2024-01-15T11:30:00Z',
  })
  expiresAt!: string;
}
