import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LexofficeMigrationType } from '../lexoffice.types';

export class PreviewMigrationDto {
  @ApiProperty({
    description: 'Type of data to preview',
    enum: LexofficeMigrationType,
    example: LexofficeMigrationType.CONTACTS,
  })
  @IsEnum(LexofficeMigrationType)
  @IsNotEmpty()
  type: LexofficeMigrationType;
}
