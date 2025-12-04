import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { GmailController } from './gmail.controller';
import { GmailOAuthService } from './gmail-oauth.service';
import { GmailService } from './gmail.service';

/**
 * Gmail Integration Module
 *
 * Provides Gmail OAuth2 authentication and API operations for email integration.
 *
 * Features:
 * - Secure OAuth2 with PKCE flow
 * - AES-256-GCM encrypted token storage
 * - Automatic token refresh
 * - Email and attachment retrieval
 * - Invoice/receipt email search
 * - Comprehensive audit logging
 *
 * Environment Variables Required:
 * - GMAIL_CLIENT_ID: Google OAuth2 client ID
 * - GMAIL_CLIENT_SECRET: Google OAuth2 client secret
 * - GMAIL_REDIRECT_URI: OAuth2 redirect URI
 * - GMAIL_ENCRYPTION_KEY: Encryption key for tokens (min 32 chars)
 *
 * @module GmailModule
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [GmailController],
  providers: [
    GmailOAuthService,
    GmailService,
  ],
  exports: [
    GmailOAuthService,
    GmailService,
  ],
})
export class GmailModule {}
