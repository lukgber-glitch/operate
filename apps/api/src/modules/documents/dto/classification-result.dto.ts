import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

/**
 * DTO for document classification result
 */
export class ClassificationResultDto {
  @ApiProperty({
    description: 'Classified document type',
    enum: DocumentType,
    example: DocumentType.INVOICE,
  })
  type: DocumentType;

  @ApiProperty({
    description: 'Classification confidence score (0.0 to 1.0)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  confidence: number;

  @ApiProperty({
    description: 'Extracted data fields from the document',
    example: {
      invoiceNumber: 'INV-2024-001',
      date: '2024-12-01',
      totalAmount: 1500.00,
      currency: 'EUR',
      vendor: 'Acme Corp',
    },
  })
  extractedData: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether confidence meets auto-categorization threshold (>= 0.8)',
    example: true,
  })
  autoCategorizationRecommended?: boolean;

  @ApiPropertyOptional({
    description: 'Raw AI response for debugging',
  })
  rawResponse?: string;
}
