import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SevDeskEntityType } from '../sevdesk.types';

/**
 * DTO for uploading sevDesk migration file
 */
export class UploadMigrationFileDto {
  @ApiProperty({
    description: 'Type of entity to migrate',
    enum: SevDeskEntityType,
    example: 'CONTACT',
  })
  entityType: SevDeskEntityType;

  @ApiPropertyOptional({
    description: 'Perform dry-run (preview only, no data changes)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = true;

  @ApiProperty({
    description: 'CSV or Excel file to upload',
    type: 'string',
    format: 'binary',
  })
  file: any; // Handled by multer middleware
}
