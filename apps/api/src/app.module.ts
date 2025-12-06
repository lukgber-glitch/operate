import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { BullModule as BullMQModule } from '@nestjs/bullmq';
import Redis from 'ioredis';
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
import { TinkModule } from './modules/integrations/tink/tink.module';
import { StripeModule } from './modules/integrations/stripe/stripe.module';
import { PlaidModule } from './modules/integrations/plaid/plaid.module';
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

    // Bull queue module for background jobs
    // Requires specific Redis options per https://github.com/OptimalBits/bull/issues/1873
    // Note: Bull requires enableReadyCheck: false and maxRetriesPerRequest: null for bclient/subscriber
    // Note: Cloudways Redis ACL requires keys to be prefixed with the username
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Get Redis key prefix (required for Cloudways ACL compliance)
        const redisUsername = configService.get<string>('redis.username');
        const redisPrefix = redisUsername ? `${redisUsername}:` : '';

        // Create Redis client factory with correct options for Bull
        const createClient = (type: 'client' | 'subscriber' | 'bclient') => {
          const redisOptions = {
            host: configService.get<string>('redis.host') || 'localhost',
            port: configService.get<number>('redis.port') || 6379,
            username: redisUsername || undefined,
            password: configService.get<string>('redis.password') || undefined,
            db: configService.get<number>('redis.db') || 0,
            // Add key prefix for Cloudways ACL compliance
            keyPrefix: redisPrefix,
            // CRITICAL: Required for Bull's subscriber/bclient
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
          };
          return new Redis(redisOptions);
        };
        return {
          createClient,
          prefix: `${redisPrefix}bull`,
          settings: {
            stalledInterval: 30000,
            maxStalledCount: 1,
          },
        };
      },
      inject: [ConfigService],
    }),

    // BullMQ module for background jobs (newer API, used by some integrations)
    // Note: Cloudways Redis ACL requires keys to be prefixed with the username
    BullMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUsername = configService.get<string>('redis.username');
        const redisPrefix = redisUsername ? `${redisUsername}:` : '';

        return {
          connection: {
            host: configService.get<string>('redis.host') || 'localhost',
            port: configService.get<number>('redis.port') || 6379,
            username: redisUsername || undefined,
            password: configService.get<string>('redis.password') || undefined,
            db: configService.get<number>('redis.db') || 0,
            // Add key prefix for Cloudways ACL compliance
            keyPrefix: redisPrefix,
          },
          prefix: `${redisPrefix}bull`,
        };
      },
      inject: [ConfigService],
    }),

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
    TinkModule,
    StripeModule,
    PlaidModule,
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
