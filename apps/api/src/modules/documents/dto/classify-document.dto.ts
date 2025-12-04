import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for manually triggering document classification
 */
export class ClassifyDocumentDto {
  @ApiProperty({
    description: 'Document ID to classify',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  documentId: string;

  @ApiPropertyOptional({
    description: 'Use vision API for classification (auto-detected based on file type if not specified)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  useVision?: boolean;

  @ApiPropertyOptional({
    description: 'Claude model to use (default: claude-3-5-sonnet-20241022)',
    example: 'claude-3-5-sonnet-20241022',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Temperature for AI model (0.0 to 1.0, default: 0.1)',
    example: 0.1,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Apply classification to document if confidence is high enough (>= 0.8)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  applyClassification?: boolean;
}
