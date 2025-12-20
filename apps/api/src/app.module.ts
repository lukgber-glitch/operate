import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { BullModule as BullMQModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { CsrfTokenMiddleware } from './common/middleware/csrf-token.middleware';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { SentryModule } from './modules/sentry/sentry.module';
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
import { TrueLayerModule } from './modules/integrations/truelayer/truelayer.module';
import { AvalaraModule } from './modules/avalara/avalara.module';
import { QuickBooksModule } from './modules/quickbooks/quickbooks.module';
import { XeroModule } from './modules/integrations/xero/xero.module';
import { GoCardlessModule } from './modules/integrations/gocardless/gocardless.module';
// EmailSyncModule removed - has broken dependencies (@aws-sdk/client-s3)
import { HrModule } from './modules/hr/hr.module';
import { FinanceModule } from './modules/finance/finance.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { AiModule } from './modules/ai/ai.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DeductionsModule } from './modules/tax/deductions/deductions.module';
import { FraudPreventionModule } from './modules/tax/fraud-prevention/fraud-prevention.module';
import { TaxAssistantModule } from './modules/tax-assistant/tax-assistant.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AutomationModule } from './modules/automation/automation.module';
import { AutopilotModule } from './modules/autopilot/autopilot.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConnectionHubModule } from './modules/connection-hub/connection-hub.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { UserOnboardingModule } from './modules/user-onboarding/user-onboarding.module';
import { CostsModule } from './modules/costs/costs.module';
import { EventsModule } from './websocket/events.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { BulkModule } from './modules/bulk/bulk.module';
import { FinancialAuditModule } from './modules/audit/financial-audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthScoreModule } from './modules/health-score/health-score.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { MileageModule } from './modules/mileage/mileage.module';
import { TimeTrackingModule } from './modules/time-tracking/time-tracking.module';
import { PaymentSuggestionModule } from './modules/ai/payment-suggestion/payment-suggestion.module';
import { BillingModule } from './modules/billing/billing.module';
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

    // SEC-008: Expanded rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'auth', // Authentication endpoints (most restrictive)
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute
      },
      {
        name: 'sensitive', // Sensitive operations (password change, MFA, etc.)
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: 'file-upload', // File uploads
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute
      },
      {
        name: 'default', // General API endpoints
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
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
    // Required for feature modules that use BullModule.registerQueue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUsername = configService.get<string>('redis.username');
        const redisPassword = configService.get<string>('redis.password');
        const redisHost = configService.get<string>('redis.host') || 'localhost';
        const redisPort = configService.get<number>('redis.port') || 6379;
        const redisDb = configService.get<number>('redis.db') || 0;
        const redisPrefix = redisUsername ? `${redisUsername}:` : '';

        // Build Redis URL with authentication for Redis ACL
        // Format: redis://username:password@host:port/db
        let redisUrl = 'redis://';
        if (redisUsername && redisPassword) {
          redisUrl += `${encodeURIComponent(redisUsername)}:${encodeURIComponent(redisPassword)}@`;
        } else if (redisPassword) {
          redisUrl += `:${encodeURIComponent(redisPassword)}@`;
        }
        redisUrl += `${redisHost}:${redisPort}/${redisDb}`;

        console.log(`[Bull] Redis URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);

        return {
          redis: redisUrl,
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
            // Required for BullMQ connections
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
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

    // Global error tracking module
    SentryModule,

    // Global audit module for financial data access logging
    FinancialAuditModule,
    // Analytics module (cash flow forecasting, financial insights)
    AnalyticsModule,
    // Health Score module (business health metrics)
    HealthScoreModule,


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
    TrueLayerModule,
    AvalaraModule,
    QuickBooksModule,
    XeroModule,
    GoCardlessModule,
    // EmailSyncModule removed - has broken dependencies

    // HR module
    HrModule,

    // Finance module
    FinanceModule,

    // Quotes module
    QuotesModule,

    // AI module
    AiModule,

    // AI Payment Suggestion module
    PaymentSuggestionModule,

    // Compliance modules (GoBD, SAF-T)
    ComplianceModule,

    // Tax modules
    DeductionsModule,
    FraudPreventionModule,
    TaxAssistantModule,

    // Documents module
    DocumentsModule,

    // Settings module
    SettingsModule,

    // Reports module
    ReportsModule,

    // Automation module
    AutomationModule,

    // AI Autopilot module
    AutopilotModule,

    // Notifications module
    NotificationsModule,

    // Billing module (subscription management)
    BillingModule,

    // Connection Hub module (integrations, OAuth, onboarding)
    ConnectionHubModule,

    // Onboarding modules
    OnboardingModule, // Organization onboarding
    UserOnboardingModule, // User onboarding

    // Chatbot module (AI assistant)
    ChatbotModule,

    // Costs module (cost tracking)
    CostsModule,

    // Mileage tracking module
    MileageModule,

    // Time tracking module
    TimeTrackingModule,

    // WebSocket module (real-time updates)
    EventsModule,
    PerformanceModule,

    // Bulk operations module
    BulkModule,

    // Contracts module
    ContractsModule,

    // QueueModule and JobsModule temporarily disabled
    // They cause startup hang due to Bull Board Redis connection issues
  ],
  controllers: [],
  providers: [
    // Global guards
    // Note: Guards run in order of registration
    // 1. CsrfGuard: CSRF protection for state-changing requests
    // 2. JwtAuthGuard: JWT validation and populates request.user
    // 3. TenantGuard: Tenant isolation enforcement (requires request.user)
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF token middleware to all routes EXCEPT OAuth callbacks
    // OAuth callbacks need clean cookie handling without CSRF interference
    consumer
      .apply(CsrfTokenMiddleware)
      .exclude(
        { path: 'auth/google/callback', method: RequestMethod.GET },
        { path: 'auth/microsoft/callback', method: RequestMethod.GET },
        { path: 'api/v1/auth/google/callback', method: RequestMethod.GET },
        { path: 'api/v1/auth/microsoft/callback', method: RequestMethod.GET },
      )
      .forRoutes('*');

    // Queue board temporarily disabled
  }
}
