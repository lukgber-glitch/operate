# KYC Module Migration Guide

This guide explains how to integrate the KYC module into the Operate/CoachOS application.

## Prerequisites

- W23-T1 (Persona integration) must be completed
- Prisma schema changes applied
- Database migrations run

## Step 1: Apply Prisma Schema Changes

The schema has been updated with three new models:
- `KycVerification`
- `KycDecision`
- `KycRequirement`

### Run Migration

```bash
cd packages/database

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_kyc_tables

# Apply to production
npx prisma migrate deploy
```

## Step 2: Import KYC Module

In your main `app.module.ts`:

```typescript
import { KycModule } from './modules/kyc/kyc.module';

@Module({
  imports: [
    // ... other modules
    KycModule,
  ],
})
export class AppModule {}
```

## Step 3: Environment Configuration

Add Persona template IDs to your `.env`:

```bash
# Persona Templates (get from Persona dashboard)
PERSONA_TEMPLATE_BASIC=itmpl_xxxxx
PERSONA_TEMPLATE_ENHANCED=itmpl_yyyyy
PERSONA_TEMPLATE_FULL=itmpl_zzzzz
```

## Step 4: Seed Default Requirements (Optional)

Create a seed script to populate default KYC requirements:

```typescript
// packages/database/seeds/kyc-requirements.seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKycRequirements() {
  // Germany requirements
  await prisma.kycRequirement.createMany({
    data: [
      {
        countryCode: 'DE',
        customerType: 'individual',
        requirementType: 'government_id',
        isRequired: true,
        description: 'Government-issued ID (Passport, Personalausweis)',
        acceptedDocs: ['passport', 'national_id', 'drivers_license'],
      },
      {
        countryCode: 'DE',
        customerType: 'individual',
        requirementType: 'selfie',
        isRequired: true,
        description: 'Live selfie for identity verification',
        acceptedDocs: ['selfie'],
      },
      {
        countryCode: 'DE',
        customerType: 'individual',
        requirementType: 'proof_of_address',
        isRequired: true,
        description: 'Proof of address (Utility bill, Bank statement)',
        acceptedDocs: ['utility_bill', 'bank_statement', 'rental_agreement'],
      },
      // Business requirements
      {
        countryCode: 'DE',
        customerType: 'business',
        requirementType: 'business_registration',
        isRequired: true,
        description: 'Handelsregisterauszug',
        acceptedDocs: ['business_registration', 'handelsregister'],
      },
    ],
    skipDuplicates: true,
  });

  // Add more countries as needed
}

seedKycRequirements()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

Run the seed:

```bash
npx ts-node packages/database/seeds/kyc-requirements.seed.ts
```

## Step 5: Configure Webhooks

### Persona Webhook Setup

1. Go to Persona Dashboard > Settings > Webhooks
2. Add webhook endpoint: `https://your-domain.com/api/persona/webhook`
3. The PersonaModule (W23-T1) already handles webhooks
4. KYC module listens to Persona events via PersonaModule

### Webhook Flow

```
Persona → PersonaWebhookController → KycWorkflowService.processWebhookEvent()
```

## Step 6: Frontend Integration

### Start Verification

```typescript
// From your frontend
const response = await fetch('/api/kyc/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    organisationId: currentOrg.id,
    level: 'enhanced',
  }),
});

const { embeddedUrl } = await response.json();

// Open Persona verification flow
window.location.href = embeddedUrl;
```

### Check Status

```typescript
const response = await fetch(`/api/kyc/status/${userId}`);
const status = await response.json();

if (status.status === 'approved') {
  // User is verified
} else if (status.status === 'pending') {
  // Show verification link
  showVerificationButton(status.embeddedUrl);
}
```

## Step 7: Background Jobs (Optional)

Set up cron jobs for automated tasks:

### Mark Expired Verifications

```typescript
// In your scheduler module
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KycWorkflowService } from './modules/kyc/services/kyc-workflow.service';

@Injectable()
export class KycScheduler {
  constructor(private readonly kycWorkflow: KycWorkflowService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markExpiredVerifications() {
    const count = await this.kycWorkflow.markExpiredVerifications();
    console.log(`Marked ${count} verifications as expired`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendExpirationWarnings() {
    const expiring = await this.kycWorkflow.getExpiring(30);
    // Send emails to users with expiring verifications
    for (const verification of expiring) {
      // await emailService.sendExpirationWarning(verification);
    }
  }
}
```

## Step 8: Admin Dashboard Integration

### Pending Review Queue

```typescript
// Admin dashboard component
const PendingReviewQueue = () => {
  const { data: pending } = useQuery('pending-kyc', () =>
    fetch('/api/kyc/pending-review').then(r => r.json())
  );

  return (
    <div>
      <h2>KYC Pending Review</h2>
      {pending?.map(item => (
        <ReviewCard
          key={item.id}
          verification={item}
          onApprove={() => makeDecision(item.id, 'approve')}
          onReject={() => makeDecision(item.id, 'reject')}
        />
      ))}
    </div>
  );
};
```

### Statistics Dashboard

```typescript
const KycDashboard = () => {
  const { data: stats } = useQuery('kyc-stats', () =>
    fetch('/api/kyc/reports/statistics').then(r => r.json())
  );

  return (
    <div>
      <StatCard label="Total" value={stats?.total} />
      <StatCard label="Approved" value={stats?.byStatus.approved} />
      <StatCard label="Pending Review" value={stats?.pendingReview} />
      <StatCard label="Approval Rate" value={`${stats?.approvalRate}%`} />
    </div>
  );
};
```

## Step 9: Testing

### Unit Tests

```bash
npm run test kyc
```

### Integration Tests

```bash
npm run test:e2e kyc
```

### Manual Testing Flow

1. Start verification via API
2. Complete Persona flow in sandbox
3. Check webhook processing
4. Verify automated decision
5. Test manual review workflow
6. Check statistics reporting

## Step 10: Production Checklist

- [ ] Persona production API keys configured
- [ ] Webhook endpoint verified and secured
- [ ] Database migrations applied
- [ ] Default requirements seeded
- [ ] Background jobs scheduled
- [ ] Monitoring and logging configured
- [ ] Admin dashboard integrated
- [ ] User notification emails configured
- [ ] GDPR compliance reviewed
- [ ] Security audit completed

## Common Issues

### Issue: Webhook not receiving events

**Solution:**
1. Check Persona webhook configuration
2. Verify webhook secret matches
3. Check firewall/proxy settings
4. Test with Persona webhook test tool

### Issue: Automated decisions not working

**Solution:**
1. Check risk score calculation
2. Verify automation rules
3. Check that all verification checks are complete
4. Review logs for decision service

### Issue: Verifications stuck in pending

**Solution:**
1. Check Persona inquiry status
2. Verify sync is running
3. Check webhook events
4. Manual sync via admin tool

## Migration Rollback

If needed to rollback:

```bash
# Rollback migration
cd packages/database
npx prisma migrate resolve --rolled-back add_kyc_tables

# Drop tables manually if needed
psql $DATABASE_URL -c "DROP TABLE IF EXISTS kyc_verifications CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS kyc_decisions CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS kyc_requirements CASCADE;"
```

## Support

For questions or issues:
- Review module README.md
- Check Persona integration documentation
- Review audit logs in database
- Contact development team
