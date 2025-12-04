import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateIntegrationDto } from './create-integration.dto';

export class UpdateIntegrationDto extends PartialType(
  OmitType(CreateIntegrationDto, ['type', 'provider'] as const),
) {}
