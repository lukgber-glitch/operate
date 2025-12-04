import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LexofficeMigrationType } from '../lexoffice.types';

export class UploadMigrationDto {
  @ApiProperty({
    description: 'Type of data to migrate',
    enum: LexofficeMigrationType,
    example: LexofficeMigrationType.INVOICES,
  })
  @IsEnum(LexofficeMigrationType)
  @IsNotEmpty()
  type: LexofficeMigrationType;
}
