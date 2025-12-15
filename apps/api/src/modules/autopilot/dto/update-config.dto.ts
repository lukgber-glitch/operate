import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAutopilotConfigDto {
  @ApiProperty({ required: false, description: 'Enable or disable autopilot' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false, description: 'Automatically categorize transactions' })
  @IsBoolean()
  @IsOptional()
  autoCategorizeTx?: boolean;

  @ApiProperty({ required: false, description: 'Automatically create invoices' })
  @IsBoolean()
  @IsOptional()
  autoCreateInvoices?: boolean;

  @ApiProperty({ required: false, description: 'Automatically send payment reminders' })
  @IsBoolean()
  @IsOptional()
  autoSendReminders?: boolean;

  @ApiProperty({ required: false, description: 'Automatically reconcile transactions' })
  @IsBoolean()
  @IsOptional()
  autoReconcile?: boolean;

  @ApiProperty({ required: false, description: 'Automatically extract receipts' })
  @IsBoolean()
  @IsOptional()
  autoExtractReceipts?: boolean;

  @ApiProperty({ required: false, description: 'Automatically pay bills' })
  @IsBoolean()
  @IsOptional()
  autoPayBills?: boolean;

  @ApiProperty({ required: false, description: 'Automatically file expenses' })
  @IsBoolean()
  @IsOptional()
  autoFileExpenses?: boolean;

  @ApiProperty({ required: false, description: 'Minimum confidence threshold (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  confidenceThreshold?: number;

  @ApiProperty({ required: false, description: 'Maximum amount for auto-payment' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxAutoAmount?: number;

  @ApiProperty({ required: false, description: 'Enable daily summary email' })
  @IsBoolean()
  @IsOptional()
  dailySummaryEnabled?: boolean;

  @ApiProperty({ required: false, description: 'Daily summary time (HH:mm format)', example: '09:00' })
  @IsString()
  @IsOptional()
  dailySummaryTime?: string;
}
