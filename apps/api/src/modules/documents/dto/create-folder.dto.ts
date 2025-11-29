import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO for creating a new document folder
 */
export class CreateFolderDto {
  @ApiProperty({
    description: 'Folder name',
    example: 'Financial Reports',
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    description: 'Folder description',
    example: 'All financial reports and statements',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent folder ID (null for root level)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
