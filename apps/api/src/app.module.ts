import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CountryContextModule } from './modules/country-context/country-context.module';
import { ViesModule } from './modules/integrations/vies/vies.module';
import { ElsterModule } from './modules/integrations/elster/elster.module';
import { FinanzOnlineModule } from './modules/integrations/finanzonline/finanzonline.module';
import { SvMeldungModule } from './modules/integrations/sv-meldung/sv-meldung.module';
import { OutlookModule } from './modules/integrations/outlook/outlook.module';
import { GmailModule } from './modules/integrations/gmail/gmail.module';
import { AvalaraModule } from './modules/avalara/avalara.module';
import { HrModule } from './modules/hr/hr.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AiModule } from './modules/ai/ai.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DeductionsModule } from './modules/tax/deductions/deductions.module';
import { FraudPreventionModule } from './modules/tax/fraud-prevention/fraud-prevention.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AutomationModule } from './modules/automation/automation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConnectionHubModule } from './modules/connection-hub/connection-hub.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { UserOnboardingModule } from './modules/user-onboarding/user-onboarding.module';
import { CostsModule } from './modules/costs/costs.module';
import { EventsModule } from './websocket/events.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Event emitter for domain events
    EventEmitterModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),

    // Global database module
    DatabaseModule,

    // Global cache module
    CacheModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    CountryContextModule,

    // Integration modules
    ViesModule,
    ElsterModule,
    FinanzOnlineModule,
    SvMeldungModule,
    OutlookModule,
    GmailModule,
    AvalaraModule,

    // HR module
    HrModule,

    // Finance module
    FinanceModule,

    // AI module
    AiModule,

    // Compliance modules (GoBD, SAF-T)
    ComplianceModule,

    // Tax modules
    DeductionsModule,
    FraudPreventionModule,

    // Documents module
    DocumentsModule,

    // Settings module
    SettingsModule,

    // Reports module
    ReportsModule,

    // Automation module
    AutomationModule,

    // Notifications module
    NotificationsModule,

    // Connection Hub module (integrations, OAuth, onboarding)
    ConnectionHubModule,

    // Onboarding modules
    OnboardingModule, // Organization onboarding
    UserOnboardingModule, // User onboarding

    // Chatbot module (AI assistant)
    ChatbotModule,

    // Costs module (cost tracking)
    // WebSocket module (real-time updates)
    EventsModule,
    CostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
