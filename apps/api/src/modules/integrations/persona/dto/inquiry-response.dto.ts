import { ApiProperty } from '@nestjs/swagger';
import { PersonaInquiryStatus } from '../types/persona.types';

/**
 * Response DTO for inquiry creation
 */
export class InquiryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the inquiry',
    example: 'inq_XXXXXXXXXXXXXXXXXX',
  })
  inquiryId: string;

  @ApiProperty({
    description: 'Session token for client-side inquiry flow',
    example: 'sess_XXXXXXXXXXXXXXXXXX',
  })
  sessionToken: string;

  @ApiProperty({
    description: 'Current status of the inquiry',
    enum: PersonaInquiryStatus,
    example: 'PENDING',
  })
  status: PersonaInquiryStatus;

  @ApiProperty({
    description: 'Internal reference ID',
    example: 'user_12345_verification',
    required: false,
  })
  referenceId?: string;

  @ApiProperty({
    description: 'Template ID used for the inquiry',
    example: 'itmpl_XXXXXXXXXXXXXXXXXX',
  })
  templateId: string;

  @ApiProperty({
    description: 'Timestamp when the inquiry was created',
    example: '2025-12-03T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the inquiry expires',
    example: '2025-12-10T10:30:00Z',
    required: false,
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Embedded URL for client-side integration',
    example: 'https://withpersona.com/verify?inquiry-id=inq_XXX&session-token=sess_XXX',
    required: false,
  })
  embeddedUrl?: string;
}
