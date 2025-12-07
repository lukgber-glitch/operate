import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IntegrationType {
  BANKING = 'BANKING',
  EMAIL = 'EMAIL',
  ACCOUNTING = 'ACCOUNTING',
  TAX = 'TAX',
  CRM = 'CRM',
  STORAGE = 'STORAGE',
  CALENDAR = 'CALENDAR',
  OTHER = 'OTHER',
}

export enum IntegrationProvider {
  // Banking
  GOCARDLESS = 'GOCARDLESS',
  TINK = 'TINK',
  PLAID = 'PLAID',
  FINAPI = 'FINAPI',
  // Email
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  IMAP = 'IMAP',
  // Accounting
  LEXOFFICE = 'LEXOFFICE',
  SEVDESK = 'SEVDESK',
  DATEV = 'DATEV',
  // Tax
  ELSTER = 'ELSTER',
  FINANZONLINE = 'FINANZONLINE',
  // Storage
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  DROPBOX = 'DROPBOX',
  ONEDRIVE = 'ONEDRIVE',
  // Other
  CUSTOM = 'CUSTOM',
}

export class CreateIntegrationDto {
  @ApiProperty({
    enum: IntegrationType,
    description: 'Type of integration',
    example: 'BANKING',
  })
  type: IntegrationType;

  @ApiProperty({
    enum: IntegrationProvider,
    description: 'Provider for the integration',
    example: 'GOCARDLESS',
  })
  provider: IntegrationProvider;

  @ApiProperty({
    description: 'User-friendly name for the integration',
    example: 'Company Bank Account',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Provider-specific configuration',
    example: { bankId: 'DEUTDEFF', countryCode: 'DE' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'onboarding', version: '1.0' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
