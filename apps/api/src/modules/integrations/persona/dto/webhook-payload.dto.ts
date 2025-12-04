import { IsString, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Persona webhook payload
 */
export class PersonaWebhookPayloadDto {
  @ApiProperty({
    description: 'Webhook event data',
    example: {
      type: 'inquiry',
      id: 'inq_XXXXXXXXXXXXXXXXXX',
      attributes: {
        status: 'approved',
        'reference-id': 'user_12345_verification',
      },
    },
  })
  @IsNotEmpty()
  @IsObject()
  data: {
    type: string;
    id: string;
    attributes: Record<string, any>;
    relationships?: Record<string, any>;
  };

  @ApiProperty({
    description: 'Included related resources',
    example: [],
    required: false,
  })
  @IsObject()
  included?: any[];

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @IsObject()
  meta?: Record<string, any>;
}

/**
 * DTO for webhook verification request
 */
export class VerifyWebhookDto {
  @ApiProperty({
    description: 'Webhook signature from Persona-Signature header',
    example: 't=1234567890,v1=abc123...',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Raw webhook payload (JSON string)',
  })
  @IsString()
  @IsNotEmpty()
  payload: string;
}
