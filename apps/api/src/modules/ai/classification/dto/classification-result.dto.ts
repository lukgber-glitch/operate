/**
 * Classification Result DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassificationMetadataDto {
  @ApiPropertyOptional()
  processingTime?: number;

  @ApiPropertyOptional()
  modelUsed?: string;

  @ApiPropertyOptional()
  tokensUsed?: number;
}

export class ClassificationResultDto {
  @ApiProperty({ example: 'software_subscriptions' })
  category!: string;

  @ApiProperty({ example: 0.95 })
  confidence!: number;

  @ApiProperty({ example: 'Cloud service subscription from AWS' })
  reasoning!: string;

  @ApiProperty({ example: true })
  taxRelevant!: boolean;

  @ApiPropertyOptional({ example: 'software_and_licenses' })
  suggestedDeductionCategory?: string;

  @ApiPropertyOptional({ example: ['needs_receipt', 'recurring'] })
  flags?: string[];

  @ApiPropertyOptional()
  metadata?: ClassificationMetadataDto;
}

export class ClassificationResultWithActionDto extends ClassificationResultDto {
  @ApiProperty({
    description: 'Whether the transaction was automatically approved',
    example: true,
  })
  autoApproved!: boolean;

  @ApiProperty({
    description: 'Whether the transaction was added to the review queue',
    example: false,
  })
  addedToReviewQueue!: boolean;
}

export class ClassificationResultWithIdDto extends ClassificationResultDto {
  @ApiProperty()
  transactionId!: string;
}

export class BatchClassificationResultDto {
  @ApiProperty({ type: [ClassificationResultWithIdDto] })
  results!: ClassificationResultWithIdDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  successful!: number;

  @ApiProperty()
  needsReview!: number;
}
