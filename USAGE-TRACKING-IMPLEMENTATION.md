# Usage Tracking System Implementation

**FORGE Agent Implementation**
**Date**: 2025-12-07
**Status**: ✅ COMPLETED

## Overview

Implemented a comprehensive usage tracking system for Operate that tracks AI messages and other key metrics per user/organization based on subscription tiers.

## 🎯 Implementation Summary

### 1. Database Schema Changes

#### New Usage Features Added to Enum
- `AI_MESSAGES` - AI chat messages per month
- `INVOICES` - Invoices created per month
- `EMAIL_SYNCS` - Email inbox syncs per month
- `TAX_FILINGS` - Tax filings submitted per month
- `BANK_CONNECTIONS` - Number of connected bank accounts

**File**: `packages/database/prisma/schema.prisma`

#### New SubscriptionTier Model
```prisma
model SubscriptionTier {
  id          String   @id @default(cuid())
  name        String   @unique // 'free' | 'starter' | 'pro' | 'business'
  displayName String
  description String?
  priceMonthly Int
  priceAnnual  Int
  limits      Json     // Usage limits per feature
  features    Json     // Enabled features
  isActive    Boolean
  isVisible   Boolean
  stripePriceIdMonthly String?
  stripePriceIdAnnual  String?
  stripeProductId      String?
}
```

#### Organisation Model Enhancement
Added `subscriptionTier` field to Organisation model with default value 'free'.

### 2. Subscription Tier Configuration

**File**: `packages/database/prisma/seeds/subscription-tiers.seed.ts`

#### Tier Limits:

| Tier | AI Messages | Bank Connections | Invoices | Email Syncs | Tax Filings | Price/Month |
|------|-------------|------------------|----------|-------------|-------------|-------------|
| **Free** | 50 | 1 | 5 | 10 | 1 | $0 |
| **Starter** | 500 | 3 | 50 | 100 | 5 | $29 |
| **Pro** | Unlimited | 10 | Unlimited | Unlimited | Unlimited | $79 |
| **Business** | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited | $149 |

*Note: -1 in limits JSON = unlimited*

### 3. Backend Services

#### UsageLimitService
**File**: `apps/api/src/modules/subscription/usage/services/usage-limit.service.ts`

**Methods**:
- `checkLimit(orgId, feature)` - Check if org can use a feature
  - Returns: `{ allowed, current, limit, percentage }`
  - Throws `ForbiddenException` if limit exceeded

- `enforceLimit(orgId, feature)` - Enforce limit (throws if exceeded)

- `getLimits(orgId)` - Get all limits for an organization
  - Returns tier info and all feature limits with current usage

**Special Handling**:
- `BANK_CONNECTIONS` - Cumulative (counts current active connections)
- Other features - Periodic (counts events in current billing month)

#### UsageMeteringService (Enhanced)
Existing service now tracks the new usage features:
- `trackUsage()` - Track individual usage events
- `getCurrentUsage()` - Get current period usage
- `checkQuota()` - Check quota status

### 4. API Endpoints

**Base URL**: `/api/v1/usage`

#### New Endpoints:

1. **GET /api/v1/usage/:orgId/limits**
   - Get all usage limits based on subscription tier
   - Response:
   ```json
   {
     "tier": "free",
     "limits": [
       {
         "feature": "AI_MESSAGES",
         "featureName": "AI Chat Messages",
         "current": 23,
         "limit": 50,
         "percentage": 46,
         "allowed": true
       },
       // ... more features
     ]
   }
   ```

2. **GET /api/v1/usage/:orgId/check/:feature**
   - Check if organization can use a specific feature
   - Response:
   ```json
   {
     "allowed": true,
     "current": 23,
     "limit": 50,
     "percentage": 46
   }
   ```

#### Existing Endpoints (Still Available):
- `POST /usage/track` - Track usage event
- `GET /usage/:orgId` - Get current usage summary
- `GET /usage/:orgId/history` - Get usage history
- `GET /usage/:orgId/estimate` - Get cost estimates
- `POST /usage/:orgId/quota` - Configure usage quota

### 5. Automatic AI Message Tracking

#### ChatService Integration
**File**: `apps/api/src/modules/chatbot/chat.service.ts`

**Implementation**:
- Injected `UsageMeteringService` into `ChatService`
- Added `trackAiMessageUsage()` method
- Automatically tracks AI_MESSAGES usage after each chat response
- Tracking happens in background (non-blocking)
- Failures logged but don't break chat functionality

**Code**:
```typescript
private async trackAiMessageUsage(orgId: string, userId: string): Promise<void> {
  await this.usageMeteringService.trackUsage({
    organizationId: orgId,
    feature: UsageFeature.AI_MESSAGES,
    quantity: 1,
    userId,
    metadata: { source: 'chat' },
  });
}
```

### 6. Usage Feature Configurations

**File**: `apps/api/src/modules/subscription/usage/types/usage.types.ts`

Added configurations for new features:
```typescript
[UsageFeature.AI_MESSAGES]: {
  displayName: 'AI Chat Messages',
  unit: 'message',
  defaultIncludedQuantity: 50,
  defaultPricePerUnit: 2, // $0.02 per message
}
```

### 7. Module Integration

**Files Modified**:
- `apps/api/src/modules/subscription/usage/usage.module.ts` - Export UsageLimitService
- `apps/api/src/modules/chatbot/chatbot.module.ts` - Import UsageModule
- `packages/database/prisma/seed.ts` - Import and run subscription tier seeding

## 🚀 Usage Examples

### Check Limits Before Action
```typescript
import { UsageLimitService } from '@/modules/subscription/usage';

// Check if user can send AI message
const check = await usageLimitService.checkLimit(orgId, UsageFeature.AI_MESSAGES);

if (!check.allowed) {
  throw new ForbiddenException(
    `You've reached your limit of ${check.limit} AI messages. Please upgrade.`
  );
}

// Proceed with action...
```

### Enforce Limits
```typescript
// Throws exception if limit exceeded
await usageLimitService.enforceLimit(orgId, UsageFeature.BANK_CONNECTIONS);

// If we get here, limit is OK
await connectBankAccount(orgId, bankDetails);
```

### Get All Limits for Dashboard
```typescript
const limits = await usageLimitService.getLimits(orgId);

console.log(`Tier: ${limits.tier}`);
limits.limits.forEach(limit => {
  console.log(`${limit.featureName}: ${limit.current}/${limit.limit} (${limit.percentage}%)`);
});
```

### Track Invoice Creation
```typescript
await usageMeteringService.trackUsage({
  organizationId: orgId,
  feature: UsageFeature.INVOICES,
  quantity: 1,
  userId,
  metadata: {
    invoiceId: invoice.id,
    amount: invoice.total,
  },
});
```

## 📊 Billing Period

- **Current Implementation**: Monthly billing cycles
- **Period Start**: 1st of month, 00:00:00
- **Period End**: Last day of month, 23:59:59
- **Reset**: Usage resets on 1st of each month (via cron job)

## 🔄 Next Steps (Future Enhancements)

1. **Add Usage Guards**
   - Create NestJS guards to check limits before endpoint execution
   - Example: `@UseGuards(UsageLimitGuard(UsageFeature.AI_MESSAGES))`

2. **Frontend Integration**
   - Add usage bars to dashboard
   - Show warnings at 80% and 90% usage
   - Upgrade prompts when limits reached

3. **Proactive Notifications**
   - Email alerts at 75%, 90%, 100% usage
   - Slack/webhook notifications for admins

4. **Usage Analytics**
   - Track usage trends over time
   - Predict when users will hit limits
   - Recommend tier upgrades

5. **Graceful Degradation**
   - Instead of hard blocking, offer reduced functionality
   - Example: Slower AI responses or basic features only

## 🧪 Testing

### To Seed Subscription Tiers
```bash
cd packages/database
npx prisma db seed
```

### To Apply Migration
```bash
cd packages/database
npx prisma migrate dev --name add_usage_tracking_features
```

### Test API Endpoints
```bash
# Get limits
GET http://localhost:3000/api/v1/usage/{orgId}/limits

# Check specific feature
GET http://localhost:3000/api/v1/usage/{orgId}/check/AI_MESSAGES

# Track usage manually
POST http://localhost:3000/api/v1/usage/track
{
  "organizationId": "...",
  "feature": "AI_MESSAGES",
  "quantity": 1,
  "userId": "..."
}
```

## 📝 Files Created/Modified

### Created Files:
1. `packages/database/prisma/seeds/subscription-tiers.seed.ts` - Tier configurations
2. `apps/api/src/modules/subscription/usage/services/usage-limit.service.ts` - Limit checking logic
3. `USAGE-TRACKING-IMPLEMENTATION.md` - This documentation

### Modified Files:
1. `packages/database/prisma/schema.prisma` - Added UsageFeature enum values, SubscriptionTier model, Organisation.subscriptionTier field
2. `packages/database/prisma/seed.ts` - Added subscription tier seeding
3. `apps/api/src/modules/subscription/usage/usage.module.ts` - Export UsageLimitService
4. `apps/api/src/modules/subscription/usage/usage.controller.ts` - Added /limits and /check endpoints
5. `apps/api/src/modules/subscription/usage/types/usage.types.ts` - Added feature configurations
6. `apps/api/src/modules/chatbot/chat.service.ts` - Added AI message tracking
7. `apps/api/src/modules/chatbot/chatbot.module.ts` - Import UsageModule

## ✅ Completion Checklist

- [x] Add new usage features to Prisma schema
- [x] Create SubscriptionTier model with limits
- [x] Create subscription tier seed data
- [x] Implement UsageLimitService
- [x] Add /limits and /check API endpoints
- [x] Wire AI message tracking to ChatService
- [x] Update usage type configurations
- [x] Format and validate Prisma schema
- [x] Document implementation

## 🎓 Key Design Decisions

1. **Tier-Based Limits**: Limits are defined per tier (not per org) for easier management
2. **JSON Storage**: Limits stored as JSON for flexibility (can add new features without schema changes)
3. **Cumulative vs Periodic**: BANK_CONNECTIONS is cumulative (current count), others are monthly
4. **Non-Blocking Tracking**: Usage tracking failures don't break user requests
5. **Default to Free**: New organizations default to 'free' tier
6. **-1 = Unlimited**: Using -1 in limits JSON to represent unlimited usage

---

**Implementation completed successfully by FORGE (Backend Agent)**
Ready for migration and production deployment.
