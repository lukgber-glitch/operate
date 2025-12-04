import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OutlookController } from './outlook.controller';
import { OutlookOAuthService } from './outlook-oauth.service';
import { OutlookService } from './outlook.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * Outlook Integration Module
 * Provides Microsoft Graph (Outlook/Office 365) email integration
 *
 * Features:
 * - OAuth2 with PKCE authentication
 * - Email reading and searching
 * - Attachment downloading
 * - Invoice/receipt detection
 * - Folder management
 * - AES-256-GCM token encryption
 * - Comprehensive audit logging
 *
 * Required Environment Variables:
 * - MICROSOFT_CLIENT_ID: Microsoft App Client ID
 * - MICROSOFT_CLIENT_SECRET: Microsoft App Client Secret
 * - MICROSOFT_REDIRECT_URI: OAuth redirect URI
 * - MICROSOFT_TENANT_ID: Tenant ID (default: 'common' for multi-tenant)
 * - OUTLOOK_ENCRYPTION_KEY: Encryption key for tokens (32+ chars)
 *   OR JWT_ACCESS_SECRET as fallback
 */
@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [OutlookController],
  providers: [OutlookOAuthService, OutlookService],
  exports: [OutlookOAuthService, OutlookService],
})
export class OutlookModule {}
