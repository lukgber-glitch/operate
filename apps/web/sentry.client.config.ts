import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `operate-web@${process.env.npm_package_version || '1.0.0'}`,

  // Performance monitoring
  // Lower sample rate to reduce overhead
  tracesSampleRate: 0.1,

  // Session replay - capture 10% of sessions, but 100% of error sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      // Block all media (images, videos) for privacy
      blockAllMedia: true,
    }),
  ],

  // Filter out common errors that aren't actionable
  beforeSend(event, hint) {
    // Filter out network errors from ad blockers
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message;

      // Common false positives
      if (
        message.includes('ResizeObserver loop') ||
        message.includes('Non-Error promise rejection') ||
        message.includes('cancelled') ||
        message.includes('aborted')
      ) {
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
    },
  },
});
