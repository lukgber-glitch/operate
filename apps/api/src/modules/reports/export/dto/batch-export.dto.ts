import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchExportItemDto {
  @ApiProperty({ description: 'Report ID or identifier' })
  @IsString()
  reportId: string;

  @ApiProperty({
    description: 'Export format',
    enum: ['pdf', 'excel'],
  })
  @IsEnum(['pdf', 'excel'])
  format: 'pdf' | 'excel';

  @ApiPropertyOptional({
    description: 'Template to use',
  })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    description: 'Custom options for this export',
    type: 'object',
  })
  @IsOptional()
  options?: any;
}

export class BatchExportDto {
  @ApiProperty({
    description: 'List of reports to export',
    type: [BatchExportItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchExportItemDto)
  reports: BatchExportItemDto[];

  @ApiPropertyOptional({
    description: 'Combine all exports into single ZIP file',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  combineIntoZip?: boolean;

  @ApiPropertyOptional({
    description: 'ZIP file name',
  })
  @IsOptional()
  @IsString()
  zipFileName?: string;

  @ApiPropertyOptional({
    description: 'Send email with download link when complete',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Email addresses to notify',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailRecipients?: string[];

  @ApiPropertyOptional({
    description: 'Delete individual files after creating ZIP',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  deleteAfterZip?: boolean;
}
