# Sentry Integration for Operate

This directory contains the Sentry error tracking and performance monitoring integration for the Operate application.

## Overview

Sentry is integrated into both the API (NestJS) and Web (Next.js) applications to provide:
- **Error Tracking**: Automatic capture of unhandled exceptions
- **Performance Monitoring**: Request tracing and performance metrics
- **User Context**: Link errors to specific users and organizations
- **Release Tracking**: Track errors across deployments
- **Alerting**: Proactive notifications for critical issues

## Setup

### 1. Install Dependencies

Dependencies are already installed via:
```bash
# API
pnpm add @sentry/node @sentry/nestjs @sentry/profiling-node

# Web
pnpm add @sentry/nextjs
```

### 2. Environment Variables

Add to `apps/api/.env`:
```env
SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
SENTRY_ORG=operate
SENTRY_PROJECT_API=operate-api
SENTRY_AUTH_TOKEN=your-auth-token
```

Add to `apps/web/.env`:
```env
SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
SENTRY_ORG=operate
SENTRY_PROJECT_WEB=operate-web
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. Create Sentry Projects

1. Go to [sentry.io](https://sentry.io)
2. Create organization: `operate`
3. Create projects:
   - `operate-api` (Platform: Node.js)
   - `operate-web` (Platform: Next.js)
4. Get DSN from Settings → Client Keys
5. Create auth token from Settings → Auth Tokens

## Architecture

### API (NestJS)

```
apps/api/src/modules/sentry/
├── sentry.module.ts              # Sentry initialization module
├── SENTRY_ALERT_RULES.md         # Alert configuration guide
└── README.md                      # This file

apps/api/src/common/
├── filters/
│   └── sentry-exception.filter.ts  # Exception capturing
└── interceptors/
    └── sentry-tracing.interceptor.ts  # Performance tracing
```

### Web (Next.js)

```
apps/web/
├── sentry.client.config.ts       # Browser Sentry config
├── sentry.server.config.ts       # Server Sentry config
├── sentry.edge.config.ts         # Edge runtime config
└── src/components/
    └── error-boundary.tsx        # React error boundary
```

## Features

### Automatic Error Capture

All unhandled exceptions are automatically captured with:
- Full stack trace
- Request context (URL, method, headers, body)
- User context (id, email, organization)
- Custom tags (route, HTTP status, organization ID)

### Performance Monitoring

Every API request is traced with:
- Response time
- Database queries
- External API calls
- Memory usage

Sample rate: 10% in production, 100% in development

### Session Replay (Web Only)

Records user sessions when errors occur:
- 10% of all sessions
- 100% of sessions with errors
- Privacy-safe (text/media masked)

### User Context

Errors are automatically linked to:
```typescript
{
  id: user.id,
  email: user.email,
  organizationId: user.organizationId,
  username: user.email
}
```

### Error Filtering

Automatically filters out:
- Client errors (4xx) - not actionable server-side
- Network timeouts from ad blockers
- ResizeObserver loop errors
- Cancelled requests

### Custom Context

Add custom context to errors:
```typescript
import * as Sentry from '@sentry/nestjs';

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'payment',
  message: 'Processing Stripe payment',
  level: 'info',
  data: { amount: 100, currency: 'EUR' }
});

// Set custom tag
Sentry.setTag('feature', 'tax-filing');

// Set custom context
Sentry.setContext('invoice', {
  id: invoice.id,
  amount: invoice.total,
  status: invoice.status
});

// Capture custom error
try {
  await processPayment();
} catch (error) {
  Sentry.captureException(error, {
    tags: { payment_method: 'stripe' },
    extra: { metadata: paymentMetadata }
  });
  throw error;
}
```

## Usage Examples

### API: Manual Error Capture

```typescript
import { Injectable, Inject } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('SENTRY') private readonly sentry: typeof Sentry,
  ) {}

  async processPayment(payment: PaymentDto) {
    try {
      // Add breadcrumb
      this.sentry.addBreadcrumb({
        category: 'payment',
        message: 'Starting payment processing',
        data: { paymentId: payment.id }
      });

      const result = await this.stripeClient.charge(payment);

      return result;
    } catch (error) {
      // Capture with context
      this.sentry.captureException(error, {
        tags: {
          payment_method: payment.method,
          amount: payment.amount.toString(),
        },
        extra: {
          paymentDetails: payment,
          timestamp: new Date().toISOString(),
        }
      });

      throw error;
    }
  }
}
```

### Web: Error Boundary Usage

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// Or with custom fallback
<ErrorBoundary
  fallback={
    <div className="error-page">
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  }
>
  {children}
</ErrorBoundary>
```

### Web: Manual Error Capture

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';

export function MyComponent() {
  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'MyComponent',
          action: 'riskyOperation'
        }
      });

      // Show user-friendly error
      toast.error('Something went wrong');
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

## Performance Monitoring

### API Transaction Example

```typescript
import * as Sentry from '@sentry/nestjs';

async function processInvoice(invoice: Invoice) {
  // Start transaction
  const transaction = Sentry.startTransaction({
    name: 'Process Invoice',
    op: 'invoice.process',
  });

  try {
    // Create span for OCR
    const ocrSpan = transaction.startChild({
      op: 'ai.ocr',
      description: 'Extract invoice data',
    });
    const extractedData = await ocrService.extract(invoice.file);
    ocrSpan.finish();

    // Create span for classification
    const classifySpan = transaction.startChild({
      op: 'ai.classify',
      description: 'Classify transactions',
    });
    const classified = await classifyService.classify(extractedData);
    classifySpan.finish();

    // Create span for database save
    const dbSpan = transaction.startChild({
      op: 'db.save',
      description: 'Save to database',
    });
    await this.invoiceRepository.save(classified);
    dbSpan.finish();

    transaction.setStatus('ok');
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
```

## Alert Configuration

See [SENTRY_ALERT_RULES.md](./SENTRY_ALERT_RULES.md) for recommended alert configurations.

Key alerts:
- Payment processing errors (Critical)
- Database connection failures (Critical)
- High error rate > 5% (High)
- Slow response times > 5s (High)
- New error types (Warning)

## Source Maps

Source maps are automatically uploaded to Sentry during production builds:

### API
Source maps are generated by NestJS build and uploaded via Sentry CLI if configured.

### Web
Source maps are automatically handled by `@sentry/nextjs` wrapper:
```javascript
// next.config.js
module.exports = withSentryConfig(
  nextConfig,
  {
    widenClientFileUpload: true,
    hideSourceMaps: true,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }
);
```

## Release Tracking

Releases are automatically tracked with version from `package.json`:
```typescript
release: `operate-api@${process.env.npm_package_version}`
```

To create release and associate commits:
```bash
# During deployment
sentry-cli releases new -p operate-api operate-api@1.2.3
sentry-cli releases set-commits --auto operate-api@1.2.3
sentry-cli releases finalize operate-api@1.2.3
```

## Privacy & Compliance

### Data Scrubbing

Sentry automatically scrubs:
- Passwords
- Credit card numbers
- Authorization headers
- Cookies

Additional scrubbing in `sentry-exception.filter.ts`:
- API keys
- Tokens
- SSN/Tax IDs
- Access/Refresh tokens

### User Privacy

To respect user privacy:
```typescript
// Don't send error if user opted out
if (user.optOutErrorTracking) {
  return;
}

// Anonymize PII before sending
Sentry.setUser({
  id: hashUserId(user.id),
  // Don't include email if user opted out
});
```

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is configured: `console.log(process.env.SENTRY_DSN)`
2. Check network: Sentry sends to `*.ingest.sentry.io`
3. Check before send filter: May be filtering out errors
4. Check environment: May be disabled in development

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check auth token has `project:write` permission
3. Run build with `--debug` flag to see upload logs
4. Verify release version matches

### High Event Volume

1. Review sampling rates in config
2. Add filters for common errors
3. Use fingerprinting to group similar errors
4. Set rate limits in Sentry project settings

## Testing

Test Sentry integration:

### API
```bash
# Test endpoint
curl http://localhost:3001/api/v1/test/sentry-error

# Or in code
throw new Error('Test Sentry Integration');
```

### Web
```tsx
// Add test button
<button onClick={() => {
  throw new Error('Test Sentry Integration');
}}>
  Test Sentry
</button>
```

## Cost Optimization

Sentry pricing is based on:
- Number of errors
- Number of transactions (performance)
- Number of replays

To optimize costs:
1. **Adjust sample rates**:
   - Production: `tracesSampleRate: 0.1` (10%)
   - Staging: `tracesSampleRate: 0.5` (50%)
   - Development: Disabled

2. **Filter common errors**:
   - Client-side network errors
   - Known third-party script errors
   - Bot traffic

3. **Use quotas**:
   - Set per-project quotas
   - Rate limit by error fingerprint
   - Spike protection

4. **Session replay**:
   - Only on errors: `replaysOnErrorSampleRate: 1.0`
   - Low regular rate: `replaysSessionSampleRate: 0.1`

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [NestJS Integration](https://docs.sentry.io/platforms/javascript/guides/nestjs/)
- [Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Alert Rules](https://docs.sentry.io/product/alerts/)
