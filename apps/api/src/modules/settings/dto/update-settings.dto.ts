import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Organisation Profile Settings
 */
export class OrganisationProfileDto {
  @ApiPropertyOptional({
    description: 'Organisation name',
    example: 'Acme Corporation GmbH',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'DE',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Timezone (IANA format)',
    example: 'Europe/Berlin',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

/**
 * Tax Settings
 */
export class TaxSettingsDto {
  @ApiPropertyOptional({
    description: 'VAT identification number',
    example: 'DE123456789',
  })
  @IsOptional()
  @IsString()
  vatId?: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: '12/345/67890',
  })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional({
    description: 'Tax office code',
    example: '2893',
  })
  @IsOptional()
  @IsString()
  taxOfficeCode?: string;

  @ApiPropertyOptional({
    description: 'Fiscal year start (MM-DD format)',
    example: '01-01',
  })
  @IsOptional()
  @IsString()
  fiscalYearStart?: string;
}

/**
 * Invoice Settings
 */
export class InvoiceSettingsDto {
  @ApiPropertyOptional({
    description: 'Invoice number prefix',
    example: 'INV',
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  invoicePrefix?: string;

  @ApiPropertyOptional({
    description: 'Next invoice number',
    example: 1001,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  nextInvoiceNumber?: number;

  @ApiPropertyOptional({
    description: 'Invoice footer text',
    example: 'Thank you for your business!',
  })
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiPropertyOptional({
    description: 'Default payment terms (in days)',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  defaultPaymentTerms?: number;

  @ApiPropertyOptional({
    description: 'Default VAT rate (percentage)',
    example: 19,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultVatRate?: number;

  @ApiPropertyOptional({
    description: 'Enable late payment fees',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableLateFees?: boolean;
}

/**
 * Notification Preferences
 */
export class NotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Email notifications for new expenses',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailExpenseNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Email notifications for pending approvals',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailApprovalNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Email notifications for invoices',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailInvoiceNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Email notifications for payroll',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailPayrollNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Email weekly digest',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailWeeklyDigest?: boolean;

  @ApiPropertyOptional({
    description: 'In-app notifications enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;
}

/**
 * Integrations Configuration
 */
export class IntegrationsConfigDto {
  @ApiPropertyOptional({
    description: 'ELSTER integration enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  elsterEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'VIES validation enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  viesEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Automatic bank sync enabled',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  bankSyncEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'AI classification enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  aiClassificationEnabled?: boolean;
}

/**
 * DTO for updating organisation settings
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Organisation profile settings',
    type: OrganisationProfileDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OrganisationProfileDto)
  profile?: OrganisationProfileDto;

  @ApiPropertyOptional({
    description: 'Tax settings',
    type: TaxSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TaxSettingsDto)
  tax?: TaxSettingsDto;

  @ApiPropertyOptional({
    description: 'Invoice settings',
    type: InvoiceSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InvoiceSettingsDto)
  invoice?: InvoiceSettingsDto;

  @ApiPropertyOptional({
    description: 'Notification preferences',
    type: NotificationPreferencesDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;

  @ApiPropertyOptional({
    description: 'Integrations configuration',
    type: IntegrationsConfigDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => IntegrationsConfigDto)
  integrations?: IntegrationsConfigDto;
}
