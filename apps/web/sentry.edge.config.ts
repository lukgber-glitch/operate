import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `operate-web@${process.env.npm_package_version || '1.0.0'}`,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Add custom tags
  initialScope: {
    tags: {
      app: 'operate-web',
      platform: 'nextjs',
      runtime: 'edge',
    },
  },
});
