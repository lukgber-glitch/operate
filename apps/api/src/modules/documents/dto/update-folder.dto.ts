import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO for updating a document folder
 */
export class UpdateFolderDto {
  @ApiPropertyOptional({
    description: 'Folder name',
    example: 'Financial Reports (Updated)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Folder description',
    example: 'Updated description for financial reports',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent folder ID (move folder)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
