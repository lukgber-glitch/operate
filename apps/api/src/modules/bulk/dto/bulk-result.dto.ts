import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Error detail for a failed bulk operation on a single item
 */
export class BulkOperationError {
  @ApiProperty({
    description: 'The ID that failed',
    example: 'id1',
  })
  id: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Invoice not found',
  })
  error: string;

  @ApiPropertyOptional({
    description: 'Additional error details',
    example: { statusCode: 404 },
  })
  details?: Record<string, any>;
}

/**
 * Result of a bulk operation
 */
export class BulkOperationResult {
  @ApiProperty({
    description: 'Total number of items in the request',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Number of successfully processed items',
    example: 8,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of failed items',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: 'List of errors for failed items',
    type: [BulkOperationError],
  })
  errors: BulkOperationError[];

  @ApiPropertyOptional({
    description: 'IDs of successfully processed items',
    type: [String],
    example: ['id1', 'id2', 'id3'],
  })
  successfulIds?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata about the operation',
    example: { duration: 150, operation: 'approve' },
  })
  metadata?: Record<string, any>;
}

/**
 * Helper class to build bulk operation results
 */
export class BulkResultBuilder {
  private total = 0;
  private successful = 0;
  private failed = 0;
  private errors: BulkOperationError[] = [];
  private successfulIds: string[] = [];
  private metadata?: Record<string, unknown> = {};

  setTotal(total: number): this {
    this.total = total;
    return this;
  }

  addSuccess(id: string): this {
    this.successful++;
    this.successfulIds.push(id);
    return this;
  }

  addError(id: string, error: string, details?: Record<string, any>): this {
    this.failed++;
    this.errors.push({ id, error, details });
    return this;
  }

  setMetadata(metadata?: Record<string, unknown>): this {
    this.metadata = metadata;
    return this;
  }

  build(): BulkOperationResult {
    return {
      total: this.total,
      successful: this.successful,
      failed: this.failed,
      errors: this.errors,
      successfulIds: this.successfulIds,
      metadata: this.metadata,
    };
  }
}
