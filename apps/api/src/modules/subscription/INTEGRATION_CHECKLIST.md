# Subscription Module - Integration Checklist

## Pre-Integration Setup

### Database
- [ ] Run migration: `add_subscription_tables.sql`
- [ ] Verify tables created:
  - [ ] `subscription_usage_tracking`
  - [ ] `subscription_usage_archive`
  - [ ] `subscription_change_log`
  - [ ] `subscription_notifications`
  - [ ] `subscription_audit_log`
- [ ] Verify indexes created
- [ ] Test query performance on large datasets

### Stripe Configuration
- [ ] Create FREE tier product (if needed for tracking)
- [ ] Create PRO tier product
  - [ ] Add metadata: `{ "tier": "PRO" }`
  - [ ] Create monthly price ($29.00)
  - [ ] Add metadata to price: `{ "tier": "PRO" }`
- [ ] Create ENTERPRISE tier product
  - [ ] Add metadata: `{ "tier": "ENTERPRISE" }`
  - [ ] Create monthly price ($99.00)
  - [ ] Add metadata to price: `{ "tier": "ENTERPRISE" }`
- [ ] Configure customer portal
  - [ ] Enable subscription management
  - [ ] Enable payment method updates
  - [ ] Set branding/logo
- [ ] Test webhook endpoint
- [ ] Verify webhook signing secret

### Environment Variables
- [ ] Add `STRIPE_API_KEY`
- [ ] Add `STRIPE_WEBHOOK_SECRET`
- [ ] Add `REDIS_URL`
- [ ] Add `SUBSCRIPTION_TRIAL_DAYS` (optional, defaults to 14)
- [ ] Verify all variables loaded

### Dependencies
- [ ] Install `@nestjs/bull` (if not already installed)
- [ ] Install `bull` (if not already installed)
- [ ] Verify Redis connection
- [ ] Test Bull queue connection

## Module Integration

### Import Module
- [ ] Add `SubscriptionModule` to `app.module.ts` imports
- [ ] Verify module loads without errors
- [ ] Check for circular dependencies

### Auth Integration
- [ ] Ensure JWT auth is set up
- [ ] Verify user object includes `orgId` or `organizationId`
- [ ] Update JWT payload if needed
- [ ] Test auth guard with subscription guard

### Database Connections
- [ ] Verify `PrismaService` is available
- [ ] Test database connection
- [ ] Run test queries on new tables

### Queue Setup
- [ ] Verify BullMQ queue registers
- [ ] Test job processing
- [ ] Configure queue UI (optional: Bull Board)

## Feature Integration

### Apply Feature Guards
- [ ] Identify protected routes
- [ ] Add `@UseGuards(JwtAuthGuard, SubscriptionFeatureGuard)`
- [ ] Add `@RequiresFeature()` decorators
- [ ] Test access control

### Add Usage Tracking
- [ ] Find invoice creation logic
- [ ] Add `trackInvoiceCreated()` call
- [ ] Find user addition logic
- [ ] Add `trackUserAdded()` call
- [ ] Test usage counting

### Implement Limit Checks
- [ ] Add `canCreateInvoice()` checks before invoice creation
- [ ] Add `canAddUser()` checks before user addition
- [ ] Handle `PaymentRequiredException` errors
- [ ] Test limit enforcement

## Background Jobs

### Configure Schedulers
- [ ] Set up cron job for monthly reset
  - Schedule: `0 0 1 * *` (1st of month at midnight)
- [ ] Test manual job trigger
- [ ] Verify job completion logs

### Test Job Processors
- [ ] Test invoice tracking job
- [ ] Test user addition job
- [ ] Test monthly reset job
- [ ] Test usage check job
- [ ] Verify job retries on failure

## API Endpoints

### Test Endpoints
- [ ] `GET /api/subscription/:orgId` - Get subscription
- [ ] `POST /api/subscription/start-trial` - Start trial
- [ ] `POST /api/subscription/upgrade` - Upgrade
- [ ] `POST /api/subscription/downgrade` - Downgrade
- [ ] `POST /api/subscription/cancel` - Cancel
- [ ] `GET /api/subscription/:orgId/usage` - Usage stats
- [ ] `POST /api/subscription/:orgId/portal` - Portal session

### Test Error Handling
- [ ] 402 for missing feature
- [ ] 402 for exceeded limit
- [ ] 404 for missing subscription
- [ ] 400 for invalid tier transition

## Frontend Integration

### UI Components Needed
- [ ] Subscription status display
- [ ] Usage meters (invoices, users)
- [ ] Upgrade/downgrade buttons
- [ ] Trial countdown timer
- [ ] Payment method form
- [ ] Cancel confirmation modal
- [ ] Feature upsell prompts

### API Integration
- [ ] Create subscription service/hooks
- [ ] Handle 402 errors gracefully
- [ ] Display upgrade prompts
- [ ] Implement portal redirect
- [ ] Show usage warnings

## Testing

### Unit Tests
- [ ] `SubscriptionManagerService`
  - [ ] Start trial
  - [ ] Upgrade subscription
  - [ ] Downgrade subscription
  - [ ] Cancel subscription
- [ ] `SubscriptionFeaturesService`
  - [ ] Feature checking
  - [ ] Usage limit calculation
  - [ ] Usage tracking
- [ ] `SubscriptionFeatureGuard`
  - [ ] Allow access with feature
  - [ ] Block access without feature
  - [ ] Return correct error message
- [ ] `UsageTrackingProcessor`
  - [ ] Process invoice tracking
  - [ ] Process user tracking
  - [ ] Monthly reset

### Integration Tests
- [ ] End-to-end subscription lifecycle
- [ ] Feature guard with real auth
- [ ] Usage tracking with database
- [ ] Background job processing
- [ ] Stripe webhook handling

### Manual Testing
- [ ] Create FREE tier organization
- [ ] Start PRO trial
- [ ] Create invoices up to limit
- [ ] Verify limit enforcement
- [ ] Upgrade to ENTERPRISE
- [ ] Verify unlimited access
- [ ] Downgrade to PRO
- [ ] Cancel subscription
- [ ] Verify access after cancellation

## Monitoring & Observability

### Logging
- [ ] Verify subscription change logs
- [ ] Check usage tracking logs
- [ ] Monitor error logs
- [ ] Set up log aggregation

### Metrics
- [ ] Track subscription conversions
- [ ] Track churn rate
- [ ] Track revenue metrics
- [ ] Track feature adoption
- [ ] Track usage patterns

### Alerts
- [ ] High error rate
- [ ] Failed payments
- [ ] Webhook failures
- [ ] Job processing delays
- [ ] Database performance issues

## Security

### Access Control
- [ ] Verify organization ownership checks
- [ ] Test unauthorized access attempts
- [ ] Verify payment method security
- [ ] Test subscription data isolation

### Data Privacy
- [ ] Audit logged data
- [ ] Ensure no PII in logs
- [ ] Verify GDPR compliance
- [ ] Test data deletion on org delete

## Performance

### Database Optimization
- [ ] Run EXPLAIN on usage queries
- [ ] Verify indexes are used
- [ ] Test with large datasets
- [ ] Monitor query performance

### Caching
- [ ] Consider caching tier configs
- [ ] Cache subscription status in JWT
- [ ] Implement Redis caching if needed

### Load Testing
- [ ] Test concurrent invoice creation
- [ ] Test concurrent upgrades
- [ ] Test usage tracking under load
- [ ] Test job queue performance

## Documentation

### Update Docs
- [ ] Add subscription section to API docs
- [ ] Update Swagger/OpenAPI specs
- [ ] Document feature flags
- [ ] Create user guide
- [ ] Update onboarding docs

### Internal Docs
- [ ] Document tier definitions
- [ ] Document feature mapping
- [ ] Document usage limits
- [ ] Document upgrade paths
- [ ] Document troubleshooting

## Deployment

### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Database migration tested
- [ ] Rollback plan documented

### Deployment Steps
1. [ ] Deploy database migration
2. [ ] Deploy API changes
3. [ ] Verify health checks
4. [ ] Test critical paths
5. [ ] Monitor error rates
6. [ ] Enable feature flags (if used)

### Post-Deployment
- [ ] Smoke test all endpoints
- [ ] Verify Stripe integration
- [ ] Check background jobs running
- [ ] Monitor logs for errors
- [ ] Verify usage tracking

### Rollback Triggers
- [ ] Error rate > 5%
- [ ] Failed payment rate > 10%
- [ ] Webhook failures > 5%
- [ ] Database performance degradation
- [ ] Critical bug discovered

## Production Readiness

### Final Checks
- [ ] All integration tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] On-call process defined
- [ ] Support team trained

### Go-Live Checklist
- [ ] Database migration applied
- [ ] Stripe products created
- [ ] Environment variables set
- [ ] Feature flags enabled
- [ ] Monitoring enabled
- [ ] Alerts enabled
- [ ] Support team ready
- [ ] Product team notified

## Post-Launch

### Monitor for 24 Hours
- [ ] Error rates normal
- [ ] Conversion rates tracked
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] User feedback collected

### First Week
- [ ] Analyze usage patterns
- [ ] Collect user feedback
- [ ] Fix any bugs discovered
- [ ] Optimize performance if needed
- [ ] Plan feature improvements

### First Month
- [ ] Analyze conversion metrics
- [ ] Calculate churn rate
- [ ] Review feature adoption
- [ ] Assess revenue impact
- [ ] Plan pricing adjustments if needed

---

## Contact & Support

**Module Owner**: FORGE Agent
**Task**: W22-T2
**Created**: 2025-12-02

For questions or issues:
- Check [README.md](./README.md)
- Review [QUICKSTART.md](./QUICKSTART.md)
- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
