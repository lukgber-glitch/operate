import { Module } from '@nestjs/common';
import { ConnectionHubController } from './connection-hub.controller';
import { OAuthCallbackController } from './oauth-callback.controller';
import { ConnectionHubService } from './connection-hub.service';
import { ConnectionHubRepository } from './connection-hub.repository';
import { RbacModule } from '../auth/rbac/rbac.module';
import { GoCardlessService } from './providers/gocardless.service';
import { GmailService } from './providers/gmail.service';
import { OutlookService } from './providers/outlook.service';
import { LexOfficeService } from './providers/lexoffice.service';
import { DATEVService } from './providers/datev.service';

/**
 * Connection Hub Module
 * Manages integrations, OAuth flows, and onboarding progress
 *
 * Features:
 * - Integration management (create, update, delete, connect, disconnect)
 * - OAuth 2.0 flow support for various providers
 * - Onboarding wizard progress tracking
 * - Provider-specific services (GoCardless, Gmail, Outlook, etc.)
 *
 * Endpoints:
 * - GET /connection-hub/integrations - List all integrations
 * - GET /connection-hub/integrations/providers - List available providers
 * - POST /connection-hub/integrations - Create integration
 * - PUT /connection-hub/integrations/:id - Update integration
 * - DELETE /connection-hub/integrations/:id - Delete integration
 * - POST /connection-hub/integrations/:id/disconnect - Disconnect
 * - POST /connection-hub/integrations/:id/reconnect - Reconnect
 * - POST /connection-hub/integrations/:id/sync - Trigger sync
 * - GET /connection-hub/onboarding - Get onboarding progress
 * - PUT /connection-hub/onboarding/step - Update step
 * - POST /connection-hub/onboarding/skip - Skip step
 * - POST /connection-hub/onboarding/complete - Complete onboarding
 * - GET /oauth/callback/:provider - OAuth callback handler
 */
@Module({
  imports: [RbacModule],
  controllers: [ConnectionHubController, OAuthCallbackController],
  providers: [
    ConnectionHubService,
    ConnectionHubRepository,
    GoCardlessService,
    GmailService,
    OutlookService,
    LexOfficeService,
    DATEVService,
  ],
  exports: [
    ConnectionHubService,
    ConnectionHubRepository,
    GoCardlessService,
    GmailService,
    OutlookService,
    LexOfficeService,
    DATEVService,
  ],
})
export class ConnectionHubModule {}
