import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Global()
@Module({
  providers: [
    {
      provide: 'SENTRY',
      useFactory: (configService: ConfigService) => {
        const dsn = configService.get<string>('SENTRY_DSN');

        // Only initialize if DSN is provided
        if (!dsn) {
          return null;
        }

        Sentry.init({
          dsn,
          environment: configService.get<string>('nodeEnv', 'development'),
          release: `operate-api@${process.env.npm_package_version || '1.0.0'}`,

          integrations: [
            nodeProfilingIntegration(),
          ],

          // Performance monitoring
          // Lower sample rate in production to reduce overhead
          tracesSampleRate: configService.get<string>('nodeEnv') === 'production' ? 0.1 : 1.0,
          profilesSampleRate: 0.1,

          // Error filtering
          beforeSend(event, hint) {
            // Filter out expected errors (4xx HTTP errors)
            const error = hint.originalException;

            // Don't send client errors (4xx) to Sentry
            if (error && typeof error === 'object' && 'status' in error) {
              const status = (error as any).status;
              if (status && status >= 400 && status < 500) {
                return null;
              }
            }

            return event;
          },

          // Add application context
          initialScope: {
            tags: {
              app: 'operate-api',
              platform: 'nestjs',
            },
          },
        });

        return Sentry;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SENTRY'],
})
export class SentryModule {}
