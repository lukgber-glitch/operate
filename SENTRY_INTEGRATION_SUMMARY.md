# Sentry Error Tracking Integration - Summary

## Overview

Sentry error tracking and performance monitoring has been successfully integrated into both the API (NestJS) and Web (Next.js) applications of the Operate platform.

## What Was Implemented

### 1. Dependencies Installed

**API (NestJS)**:
- `@sentry/node` - Core Sentry SDK for Node.js
- `@sentry/nestjs` - NestJS-specific Sentry integration
- `@sentry/profiling-node` - CPU profiling for performance insights

**Web (Next.js)**:
- `@sentry/nextjs` - Complete Next.js integration with automatic setup

### 2. API Integration

#### Files Created:
```
apps/api/src/
├── modules/sentry/
│   ├── sentry.module.ts              # Sentry initialization module
│   ├── README.md                      # Comprehensive usage guide
│   ├── SENTRY_ALERT_RULES.md         # Alert configuration guide
│   └── DEPLOYMENT.md                  # Deployment checklist
├── common/filters/
│   └── sentry-exception.filter.ts    # Global exception capturing
└── common/interceptors/
    └── sentry-tracing.interceptor.ts # Performance tracing
```

#### Files Modified:
- `apps/api/src/app.module.ts` - Added SentryModule import
- `apps/api/src/main.ts` - Registered Sentry filters and interceptors
- `apps/api/src/modules/health/health.controller.ts` - Added test endpoint
- `apps/api/.env.example` - Added Sentry environment variables

### 3. Web Integration

#### Files Created:
```
apps/web/
├── sentry.client.config.ts           # Browser-side Sentry config
├── sentry.server.config.ts           # Server-side Sentry config
├── sentry.edge.config.ts             # Edge runtime config
├── instrumentation.ts                # Next.js instrumentation
└── src/components/error-boundary.tsx # React error boundary
```

#### Files Modified:
- `apps/web/next.config.js` - Added Sentry webpack plugin
- `apps/web/.env.example` - Added Sentry environment variables

## Features

### Error Tracking
- ✅ Automatic capture of all unhandled exceptions
- ✅ Full stack traces with source maps
- ✅ Request context (URL, method, headers, body)
- ✅ User context (ID, email, organization)
- ✅ Custom tags and context
- ✅ Error filtering (4xx errors excluded)
- ✅ Privacy-safe (PII scrubbing)

### Performance Monitoring
- ✅ Request tracing with response times
- ✅ Database query monitoring
- ✅ External API call tracking
- ✅ Custom transaction tracking
- ✅ Configurable sample rates (10% production, 100% dev)

### Session Replay (Web Only)
- ✅ 10% of all user sessions
- ✅ 100% of sessions with errors
- ✅ Privacy-safe (text and media masked)

### User Experience
- ✅ Custom error boundary with fallback UI
- ✅ User feedback dialog for error reporting
- ✅ Graceful error handling

## Configuration

### Environment Variables Required

**API (.env)**:
```env
SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
SENTRY_ORG=operate
SENTRY_PROJECT_API=operate-api
SENTRY_AUTH_TOKEN=your-auth-token
```

**Web (.env)**:
```env
SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/project-id
SENTRY_ORG=operate
SENTRY_PROJECT_WEB=operate-web
SENTRY_AUTH_TOKEN=your-auth-token
```

## Testing

### Test Error Tracking

**API**:
```bash
curl http://localhost:3001/api/v1/health/sentry-test
```

This will throw a test error and you should see it appear in your Sentry dashboard within seconds.

**Web**:
Add a test button in any component:
```tsx
<button onClick={() => {
  throw new Error('Test Sentry Integration');
}}>
  Test Sentry
</button>
```

## Next Steps

### 1. Create Sentry Account (Required)
1. Go to [sentry.io](https://sentry.io)
2. Create organization: `operate`
3. Create two projects:
   - `operate-api` (Platform: Node.js)
   - `operate-web` (Platform: Next.js)
4. Get DSN from Settings → Client Keys for each project
5. Create auth token from Settings → Auth Tokens

### 2. Configure Environment Variables
Add the Sentry credentials to your environment files:
- Development: `apps/api/.env.local` and `apps/web/.env.local`
- Production: Cloudways server environment variables

### 3. Set Up Alerts
Follow the guide in `apps/api/src/modules/sentry/SENTRY_ALERT_RULES.md` to configure:
- Critical alerts (payment errors, database failures)
- High priority alerts (high error rate, queue failures)
- Warning alerts (new error types, performance degradation)

### 4. Deploy to Production
Follow the deployment checklist in `apps/api/src/modules/sentry/DEPLOYMENT.md`:
- Build applications with Sentry enabled
- Deploy to Cloudways server
- Verify integration with test endpoints
- Create release tags
- Set up alert notifications

### 5. Integrate Communication Tools
- **Slack**: Connect for team notifications
- **PagerDuty**: (Optional) For on-call alerts
- **Email**: Configure email notifications

## Alert Recommendations

### Critical (Immediate Action)
- Payment processing errors
- Database connection failures
- ELSTER tax filing errors
- Authentication system failures

### High Priority (Slack Alert)
- Error rate > 5%
- Queue processing failures
- Banking integration errors
- AI service errors
- Response time > 5s

### Warning (Email)
- New error types
- Memory usage > 80%
- Cache performance degradation

## Cost Optimization

Sentry pricing is based on:
- Number of errors captured
- Number of performance transactions
- Number of session replays

Current configuration optimizes costs:
- **Production**: 10% transaction sampling
- **Error filtering**: 4xx errors excluded
- **Session replay**: 10% of sessions, 100% of errors only

Estimated monthly cost for moderate traffic:
- **Free tier**: Up to 5,000 errors/month, 10,000 transactions/month
- **Team tier ($26/month)**: 50,000 errors/month, 100,000 transactions/month

## Documentation

Comprehensive documentation available:
- **Usage Guide**: `apps/api/src/modules/sentry/README.md`
- **Alert Configuration**: `apps/api/src/modules/sentry/SENTRY_ALERT_RULES.md`
- **Deployment Guide**: `apps/api/src/modules/sentry/DEPLOYMENT.md`

## Success Metrics

Track these metrics to measure Sentry's value:
1. **MTTR** (Mean Time To Resolution): How quickly errors are fixed
2. **Error Rate**: Percentage of requests that error
3. **User Impact**: Number of users affected by errors
4. **Performance**: P95 response time trends
5. **Alert Accuracy**: Percentage of actionable alerts

## Security & Privacy

Data protection features:
- ✅ Automatic PII scrubbing (passwords, credit cards, SSN)
- ✅ Custom sanitization (API keys, tokens)
- ✅ Source map security (hidden from public)
- ✅ User opt-out capability
- ✅ GDPR compliant

## Support

For issues or questions:
- **Sentry Docs**: https://docs.sentry.io
- **NestJS Integration**: https://docs.sentry.io/platforms/javascript/guides/nestjs/
- **Next.js Integration**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Internal**: See README files in sentry module directory

## Important Notes

1. **Sentry is disabled by default** - Requires `SENTRY_DSN` environment variable to activate
2. **Test thoroughly** - Use test endpoints before relying on production
3. **Monitor costs** - Review usage regularly in Sentry dashboard
4. **Tune alerts** - Start conservative, adjust based on actual patterns
5. **Privacy first** - Review PII scrubbing rules for compliance

## Quick Reference

```bash
# Test API integration
curl http://localhost:3001/api/v1/health/sentry-test

# View Sentry dashboard
https://sentry.io/organizations/operate/

# Check environment
echo $SENTRY_DSN

# Restart API with Sentry
pm2 restart operate-api --update-env
```

---

**Status**: ✅ Ready for deployment (pending Sentry account setup)

**Estimated Setup Time**: 30 minutes (account creation + configuration)

**Integration Complexity**: Low (automatic capture, minimal configuration)

**Maintenance Overhead**: Low (review alerts weekly, tune thresholds monthly)
