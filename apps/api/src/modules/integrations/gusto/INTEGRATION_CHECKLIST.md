# Gusto Integration - Integration Checklist

Quick checklist for integrating the Gusto module into Operate/CoachOS.

## Prerequisites

- [ ] Gusto Developer account created
- [ ] Application registered in Gusto Developer Portal
- [ ] Client ID and Client Secret obtained
- [ ] Node.js 18+ and pnpm installed
- [ ] PostgreSQL database available

## Step 1: Environment Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `GUSTO_CLIENT_ID` from Gusto dashboard
- [ ] Set `GUSTO_CLIENT_SECRET` from Gusto dashboard
- [ ] Set `GUSTO_REDIRECT_URI` (match Gusto dashboard)
- [ ] Set `GUSTO_WEBHOOK_SECRET` from Gusto webhook config
- [ ] Generate encryption key: `openssl rand -base64 32`
- [ ] Set `GUSTO_ENCRYPTION_KEY` with generated key
- [ ] Set `GUSTO_ENVIRONMENT` (sandbox or production)

## Step 2: Database Setup

- [ ] Open `packages/database/prisma/schema.prisma`
- [ ] Copy enums from `prisma-schema.prisma`:
  - [ ] `GustoConnectionStatus` enum
- [ ] Copy models from `prisma-schema.prisma`:
  - [ ] `GustoConnection` model
  - [ ] `GustoWebhookEvent` model
  - [ ] `GustoAuditLog` model
  - [ ] `GustoEmployeeMapping` model
- [ ] Add relations to existing models:
  - [ ] `Organisation.gustoConnections` (GustoConnection[])
  - [ ] `Organisation.gustoEmployeeMappings` (GustoEmployeeMapping[])
  - [ ] `User.gustoConnections` (GustoConnection[])
  - [ ] `User.gustoAuditLogs` (GustoAuditLog[])
  - [ ] `Employee.gustoMapping` (GustoEmployeeMapping?)
- [ ] Run migration: `pnpm prisma migrate dev --name add-gusto-integration`
- [ ] Generate Prisma client: `pnpm prisma generate`

## Step 3: Module Registration

- [ ] Open `apps/api/src/app.module.ts`
- [ ] Import GustoModule:
  ```typescript
  import { GustoModule } from './modules/integrations/gusto';
  ```
- [ ] Add to imports array:
  ```typescript
  @Module({
    imports: [
      // ... existing modules
      GustoModule,
    ],
  })
  ```
- [ ] Verify module loads without errors

## Step 4: Gusto Dashboard Configuration

- [ ] Log in to Gusto Developer Portal
- [ ] Navigate to your application
- [ ] Configure OAuth:
  - [ ] Add redirect URI: `https://your-domain.com/api/integrations/gusto/callback`
  - [ ] Add localhost URI for dev: `http://localhost:3000/api/integrations/gusto/callback`
  - [ ] Enable required scopes (company, employee, payroll)
- [ ] Configure Webhooks:
  - [ ] Add webhook URL: `https://your-domain.com/api/integrations/gusto/webhooks`
  - [ ] Enable all event types
  - [ ] Copy webhook secret
  - [ ] Save configuration

## Step 5: Database Integration (TODO in Code)

Files with TODO markers to implement:

- [ ] `gusto.controller.ts`
  - [ ] Implement `getAccessToken()` method
  - [ ] Implement `saveConnection()` in OAuth callback
  - [ ] Implement `updateConnectionStatus()` in disconnect
  - [ ] Implement `getConnection()` in status endpoint
  - [ ] Implement `getCompaniesFromToken()` helper

- [ ] `gusto-webhook.controller.ts`
  - [ ] Implement `logWebhookEvent()`
  - [ ] Implement `getAccessToken()` helper
  - [ ] Implement database updates in webhook handlers

- [ ] `services/gusto-employee.service.ts`
  - [ ] Implement `findEmployeeByGustoUuid()`
  - [ ] Implement `updateEmployeeFromGusto()`
  - [ ] Implement `createEmployeeFromGusto()`

## Step 6: Testing (Sandbox)

### OAuth Flow Test
- [ ] Start application: `pnpm dev`
- [ ] Call initiate endpoint with organisation ID
- [ ] Open returned authorization URL in browser
- [ ] Log in with test Gusto account
- [ ] Authorize application
- [ ] Verify callback succeeds
- [ ] Check database for connection record

### Company Provisioning Test
- [ ] Call provision endpoint with test company data
- [ ] Verify company created in Gusto
- [ ] Check access token returned
- [ ] Verify connection stored in database

### Employee Operations Test
- [ ] Create test employee via API
- [ ] List employees
- [ ] Get employee details
- [ ] Sync employees from Gusto
- [ ] Verify employee mapping in database

### Webhook Test
- [ ] Set up ngrok: `ngrok http 3000`
- [ ] Update Gusto webhook URL to ngrok URL
- [ ] Trigger event in Gusto (e.g., update employee)
- [ ] Verify webhook received
- [ ] Check webhook logged in database
- [ ] Verify event processed correctly

## Step 7: Security Verification

- [ ] Verify tokens encrypted in database
- [ ] Test webhook signature verification
- [ ] Verify state parameter in OAuth flow
- [ ] Check PKCE code verifier/challenge
- [ ] Test token refresh mechanism
- [ ] Verify no sensitive data in logs
- [ ] Test rate limiting handling

## Step 8: Error Handling Test

- [ ] Test with invalid OAuth code
- [ ] Test with expired state
- [ ] Test with invalid webhook signature
- [ ] Test with invalid employee data
- [ ] Test with rate limit exceeded
- [ ] Test with network errors
- [ ] Verify all errors logged properly

## Step 9: Production Preparation

- [ ] Review all environment variables
- [ ] Set `GUSTO_ENVIRONMENT=production`
- [ ] Update redirect URI to production domain
- [ ] Update webhook URL to production domain
- [ ] Test full OAuth flow in production
- [ ] Verify webhook signature with production secret
- [ ] Set up monitoring and alerts
- [ ] Configure error tracking
- [ ] Document incident response procedures
- [ ] Train support team

## Step 10: Monitoring Setup

- [ ] Set up logging aggregation
- [ ] Configure alerts for:
  - [ ] OAuth failures
  - [ ] Token refresh failures
  - [ ] Webhook signature failures
  - [ ] Rate limit warnings
  - [ ] API errors
- [ ] Set up dashboards for:
  - [ ] API request rates
  - [ ] Error rates
  - [ ] Token refresh success rate
  - [ ] Webhook processing time

## Step 11: Documentation

- [ ] Update API documentation
- [ ] Create user guides
- [ ] Document troubleshooting steps
- [ ] Create runbooks for common issues
- [ ] Document data retention policies
- [ ] Create backup and recovery procedures

## Step 12: Load Testing (Optional)

- [ ] Test with 100+ employees
- [ ] Test bulk employee sync
- [ ] Test webhook burst handling
- [ ] Test rate limit handling
- [ ] Test database performance
- [ ] Optimize slow queries

## Verification Checklist

After integration, verify:

- [ ] OAuth flow completes successfully
- [ ] Tokens are encrypted in database
- [ ] Token refresh works automatically
- [ ] Company provisioning creates records
- [ ] Employee sync works correctly
- [ ] Webhooks are received and processed
- [ ] Webhook signatures verified
- [ ] All endpoints return expected data
- [ ] Error handling works as expected
- [ ] Logging captures all operations
- [ ] No sensitive data in logs
- [ ] Rate limiting tracked correctly
- [ ] Database indexes performing well

## Common Issues and Solutions

### Issue: "Invalid OAuth state"
**Solution**: State expires after 10 minutes. Generate new authorization URL.

### Issue: "Webhook signature verification failed"
**Solution**: Verify `GUSTO_WEBHOOK_SECRET` matches Gusto dashboard exactly.

### Issue: "Token expired"
**Solution**: Implement automatic token refresh in `getAccessToken()` method.

### Issue: "Company not found"
**Solution**: Verify connection exists in database and status is ACTIVE.

### Issue: "Employee sync failed"
**Solution**: Check Gusto API credentials and connection status.

## Next Steps After Integration

1. Implement remaining TODO markers
2. Write unit tests
3. Write integration tests
4. Perform security audit
5. Set up monitoring
6. Document procedures
7. Train team
8. Go live!

## Support Resources

- 📚 [Gusto API Documentation](https://docs.gusto.com/embedded-payroll/)
- 📖 [Integration README](./README.md)
- 🚀 [Quick Start Guide](./QUICKSTART.md)
- 📋 [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

**Status Tracking**

- Setup Progress: _____ / 12 steps complete
- Testing Progress: _____ / 8 tests complete
- Production Ready: _____ / 11 items complete

**Last Updated**: 2024-12-02
**Integration Version**: 1.0.0
