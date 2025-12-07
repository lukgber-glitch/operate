/**
 * Next.js Instrumentation
 *
 * This file is used to initialize monitoring and instrumentation
 * tools like Sentry. It runs once when the server starts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize server-side Sentry
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialize edge runtime Sentry
    await import('./sentry.edge.config');
  }
}
