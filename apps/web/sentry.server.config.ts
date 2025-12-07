import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `operate-web@${process.env.npm_package_version || '1.0.0'}`,

  // Performance monitoring
  // Lower sample rate in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Error filtering
  beforeSend(event, hint) {
    // Filter out expected errors
    const error = hint.originalException;

    // Don't send 4xx errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if (statusCode >= 400 && statusCode < 500) {
        return null;
      }
    }

    return event;
  },

  // Add custom tags
  initialScope: {
    tags: {
      app: 'operate-web',
      platform: 'nextjs',
      runtime: 'server',
    },
  },
});
