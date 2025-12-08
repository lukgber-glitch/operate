import { IsArray, IsNotEmpty, IsString, IsOptional, IsObject, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Generic Bulk Operation DTO
 * Used for operations that affect multiple entities
 */
export class BulkOperationDto {
  @ApiProperty({
    description: 'Array of entity IDs to operate on',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 items per bulk operation' })
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'The operation to perform',
    example: 'approve',
  })
  @IsString()
  @IsNotEmpty()
  operation: string;

  @ApiPropertyOptional({
    description: 'Additional parameters for the operation',
    example: { reason: 'Approved by manager' },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

/**
 * Bulk Invoice Send DTO
 */
export class BulkInvoiceSendDto {
  @ApiProperty({
    description: 'Array of invoice IDs to send',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];
}

/**
 * Bulk Invoice Approve DTO
 */
export class BulkInvoiceApproveDto {
  @ApiProperty({
    description: 'Array of invoice IDs to approve',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];
}

/**
 * Bulk Invoice Mark Paid DTO
 */
export class BulkInvoiceMarkPaidDto {
  @ApiProperty({
    description: 'Array of invoice IDs to mark as paid',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiPropertyOptional({
    description: 'Payment date (defaults to now)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsString()
  paymentDate?: string;
}

/**
 * Bulk Bill Approve DTO
 */
export class BulkBillApproveDto {
  @ApiProperty({
    description: 'Array of bill IDs to approve',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'User ID of the approver',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

/**
 * Bulk Bill Schedule Payment DTO
 */
export class BulkBillSchedulePaymentDto {
  @ApiProperty({
    description: 'Array of bill IDs to schedule payment for',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'Scheduled payment date',
    example: '2024-01-30',
  })
  @IsString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'BANK_TRANSFER',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

/**
 * Bulk Transaction Categorize DTO
 */
export class BulkTransactionCategorizeDto {
  @ApiProperty({
    description: 'Array of transaction IDs to categorize',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'Category to assign',
    example: 'OFFICE_SUPPLIES',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Subcategory to assign',
    example: 'Stationery',
  })
  @IsOptional()
  @IsString()
  subcategory?: string;
}

/**
 * Bulk Transaction Reconcile DTO
 */
export class BulkTransactionReconcileDto {
  @ApiProperty({
    description: 'Array of transaction IDs to reconcile',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiPropertyOptional({
    description: 'Reconciliation notes',
    example: 'Reconciled against bank statement',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Bulk Expense Approve DTO
 */
export class BulkExpenseApproveDto {
  @ApiProperty({
    description: 'Array of expense IDs to approve',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'User ID of the approver',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  approvedBy: string;
}

/**
 * Bulk Expense Reject DTO
 */
export class BulkExpenseRejectDto {
  @ApiProperty({
    description: 'Array of expense IDs to reject',
    example: ['id1', 'id2', 'id3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Missing receipts',
  })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
