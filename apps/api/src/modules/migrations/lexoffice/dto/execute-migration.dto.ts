import { IsEnum, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LexofficeMigrationType } from '../lexoffice.types';

export class ExecuteMigrationDto {
  @ApiProperty({
    description: 'Type of data to migrate',
    enum: LexofficeMigrationType,
    example: 'INVOICES',
  })
  @IsNotEmpty()
  type: LexofficeMigrationType;

  @ApiProperty({
    description: 'Run in dry-run mode (preview only, no database changes)',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
