# Pricing Implementation Guide
## Step-by-Step Launch Checklist for Operate

---

## Overview

This guide provides actionable steps to implement the recommended pricing strategy for Operate's German market launch. Follow these phases sequentially for a successful rollout.

**Recommended Pricing:**
- Free Trial: 14 days (no credit card)
- Starter: €9/month | €99/year
- Professional: €19/month | €199/year ⭐ Most Popular
- Business: €39/month | €429/year

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Stripe Setup

**Tasks:**
- [ ] Create Stripe account (or use existing)
- [ ] Set up products in Stripe Dashboard
- [ ] Configure prices (monthly + annual for each tier)
- [ ] Enable EUR currency
- [ ] Set up tax rates (19% German VAT)
- [ ] Configure webhooks for subscription events
- [ ] Test mode verification

**Stripe Products Configuration:**

```javascript
// Starter Monthly
{
  name: "Operate Starter",
  description: "Perfect for solo freelancers",
  price: 9.00,
  currency: "EUR",
  interval: "month",
  trial_period_days: 14
}

// Starter Annual
{
  name: "Operate Starter (Annual)",
  description: "Save €9/year",
  price: 99.00,
  currency: "EUR",
  interval: "year",
  trial_period_days: 14
}

// Professional Monthly
{
  name: "Operate Professional",
  description: "Full AI automation - Most Popular",
  price: 19.00,
  currency: "EUR",
  interval: "month",
  trial_period_days: 14,
  metadata: {
    recommended: true,
    badge: "Most Popular"
  }
}

// Professional Annual
{
  name: "Operate Professional (Annual)",
  description: "Save €29/year - Best Value",
  price: 199.00,
  currency: "EUR",
  interval: "year",
  trial_period_days: 14,
  metadata: {
    recommended: true,
    badge: "Most Popular"
  }
}

// Business Monthly
{
  name: "Operate Business",
  description: "Team collaboration + advanced features",
  price: 39.00,
  currency: "EUR",
  interval: "month",
  trial_period_days: 14
}

// Business Annual
{
  name: "Operate Business (Annual)",
  description: "Save €39/year",
  price: 429.00,
  currency: "EUR",
  interval: "year",
  trial_period_days: 14
}
```

**Webhook Events to Handle:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end` (3 days before)

---

### 1.2 Database Schema Updates

**Add to User/Account table:**

```sql
-- Subscription tracking
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50); -- 'trial', 'starter', 'professional', 'business'
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50); -- 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP;
ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMP;
ALTER TABLE users ADD COLUMN billing_interval VARCHAR(20); -- 'monthly', 'annual'

-- Usage tracking for limits
ALTER TABLE users ADD COLUMN ai_messages_used_current_period INT DEFAULT 0;
ALTER TABLE users ADD COLUMN receipts_scanned_current_period INT DEFAULT 0;
ALTER TABLE users ADD COLUMN period_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN period_end_date TIMESTAMP;

-- Feature flags
ALTER TABLE users ADD COLUMN features_enabled JSONB; -- { "ai_chat": true, "proactive_suggestions": true, etc. }
```

**Example features_enabled JSON:**

```json
{
  "ai_chat_unlimited": true,
  "bank_connections_limit": 3,
  "receipt_scanning_limit": null,
  "proactive_suggestions": true,
  "bill_management": true,
  "tax_assistant": true,
  "cash_flow_predictions": false,
  "api_access": false,
  "team_members_limit": 1,
  "priority_support": true
}
```

---

### 1.3 Feature Gates Implementation

**Create middleware/helper function:**

```typescript
// apps/api/src/common/guards/feature-gate.guard.ts

export class FeatureGateGuard {
  canAccessFeature(user: User, feature: string): boolean {
    const tier = user.subscription_tier;

    const featureMatrix = {
      'ai_chat': ['trial', 'starter', 'professional', 'business'],
      'ai_chat_unlimited': ['professional', 'business'],
      'proactive_suggestions': ['professional', 'business'],
      'bill_management': ['professional', 'business'],
      'tax_assistant': ['professional', 'business'],
      'cash_flow_predictions': ['business'],
      'api_access': ['business'],
      'team_collaboration': ['business'],
    };

    return featureMatrix[feature]?.includes(tier) || false;
  }

  getUsageLimits(tier: string): UsageLimits {
    const limits = {
      'trial': {
        ai_messages: 50,
        bank_connections: 1,
        receipts_per_month: 10,
        team_members: 1
      },
      'starter': {
        ai_messages: 500,
        bank_connections: 1,
        receipts_per_month: 50,
        team_members: 1
      },
      'professional': {
        ai_messages: null, // unlimited
        bank_connections: 3,
        receipts_per_month: null, // unlimited
        team_members: 1
      },
      'business': {
        ai_messages: null,
        bank_connections: null,
        receipts_per_month: null,
        team_members: 5
      }
    };

    return limits[tier];
  }

  hasReachedLimit(user: User, limitType: string): boolean {
    const limits = this.getUsageLimits(user.subscription_tier);
    const limit = limits[limitType];

    if (limit === null) return false; // unlimited

    const usage = user[`${limitType}_used_current_period`];
    return usage >= limit;
  }
}
```

**Usage in controllers:**

```typescript
// Example: AI chat endpoint
@Post('/chat')
@UseGuards(AuthGuard, FeatureGateGuard)
async sendMessage(@User() user, @Body() message: string) {
  // Check if user can access AI chat
  if (!this.featureGate.canAccessFeature(user, 'ai_chat')) {
    throw new ForbiddenException('Upgrade to access AI chat');
  }

  // Check if user has reached message limit
  if (this.featureGate.hasReachedLimit(user, 'ai_messages')) {
    throw new ForbiddenException('Monthly AI message limit reached. Upgrade to Professional for unlimited messages.');
  }

  // Increment usage
  await this.usageService.incrementUsage(user.id, 'ai_messages');

  // Process message
  return this.chatService.sendMessage(user, message);
}
```

---

## Phase 2: Frontend - Pricing Page (Week 2-3)

### 2.1 Page Structure

**File:** `apps/web/src/app/(marketing)/pricing/page.tsx`

**Sections:**
1. Hero section with headline
2. Monthly/Annual toggle
3. Pricing cards (3 columns)
4. Feature comparison table
5. FAQ section
6. CTA section
7. Social proof (when available)

**Key Components:**

```tsx
// apps/web/src/components/pricing/PricingToggle.tsx
export function PricingToggle({ interval, setInterval }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={interval === 'monthly' ? 'font-bold' : 'text-gray-600'}>
        Monthly
      </span>
      <Switch
        checked={interval === 'annual'}
        onCheckedChange={(checked) => setInterval(checked ? 'annual' : 'monthly')}
      />
      <span className={interval === 'annual' ? 'font-bold' : 'text-gray-600'}>
        Annual
        <Badge className="ml-2 bg-green-100 text-green-800">Save up to 13%</Badge>
      </span>
    </div>
  );
}

// apps/web/src/components/pricing/PricingCard.tsx
export function PricingCard({
  name,
  price,
  interval,
  savings,
  features,
  isPopular,
  ctaText
}) {
  return (
    <Card className={isPopular ? 'border-2 border-blue-500 shadow-lg' : ''}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
          Most Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">€{price}</span>
          <span className="text-gray-600">/{interval === 'monthly' ? 'mo' : 'year'}</span>
        </div>
        {interval === 'annual' && savings && (
          <p className="text-sm text-green-600 mt-2">Save €{savings}/year</p>
        )}
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {features.map(feature => (
            <li key={feature.name} className="flex items-start gap-2">
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <X className="h-5 w-5 text-gray-300 shrink-0" />
              )}
              <span className={!feature.included ? 'text-gray-400' : ''}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          onClick={() => router.push('/signup?plan=' + name.toLowerCase())}
        >
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Pricing Data:**

```typescript
// apps/web/src/data/pricing.ts
export const pricingTiers = {
  starter: {
    name: 'Starter',
    tagline: 'Perfect for solo freelancers',
    monthly: {
      price: 9,
      priceId: 'price_starter_monthly', // from Stripe
    },
    annual: {
      price: 99,
      savings: 9,
      priceId: 'price_starter_annual',
    },
    features: [
      { name: '500 AI chat messages/month', included: true },
      { name: 'Unlimited invoices & quotes', included: true },
      { name: '1 bank account connection', included: true },
      { name: '50 receipt scans/month', included: true },
      { name: 'Basic expense categorization', included: true },
      { name: 'VAT reporting (UStVA)', included: true },
      { name: 'DATEV export', included: true },
      { name: 'Email support', included: true },
      { name: 'Proactive AI suggestions', included: false },
      { name: 'Bill/AP management', included: false },
      { name: 'Tax filing assistant', included: false },
    ],
  },
  professional: {
    name: 'Professional',
    tagline: 'Full AI automation - Most Popular',
    isPopular: true,
    monthly: {
      price: 19,
      priceId: 'price_professional_monthly',
    },
    annual: {
      price: 199,
      savings: 29,
      priceId: 'price_professional_annual',
    },
    features: [
      { name: 'Unlimited AI chat messages', included: true },
      { name: 'Unlimited invoices & quotes', included: true },
      { name: '3 bank account connections', included: true },
      { name: 'Unlimited receipt scanning', included: true },
      { name: 'AI transaction classification', included: true },
      { name: 'Proactive daily suggestions', included: true },
      { name: 'Bill/AP management', included: true },
      { name: 'Natural language document search', included: true },
      { name: 'Tax filing assistant (ELSTER)', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Multi-currency support', included: true },
      { name: 'Payment reminders (automated)', included: true },
      { name: 'Cash flow predictions', included: false },
      { name: 'API access', included: false },
    ],
  },
  business: {
    name: 'Business',
    tagline: 'Team collaboration + advanced features',
    monthly: {
      price: 39,
      priceId: 'price_business_monthly',
    },
    annual: {
      price: 429,
      savings: 39,
      priceId: 'price_business_annual',
    },
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Unlimited bank accounts', included: true },
      { name: '5 team members included', included: true },
      { name: 'Advanced cash flow predictions', included: true },
      { name: 'Custom financial reports', included: true },
      { name: 'REST API access', included: true },
      { name: 'Webhooks for integrations', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Phone + email support', included: true },
    ],
  },
};
```

---

### 2.2 Pricing Page Copy

**Hero Section:**

```
Headline: AI-Powered Accounting for German Freelancers
Subheadline: Let Operate handle your bookkeeping while you focus on your business
CTA: Start Free 14-Day Trial
Caption: No credit card required • Cancel anytime
```

**Section Headlines:**

```
Simple, Transparent Pricing
Choose the plan that fits your business. Start with a 14-day free trial on any tier.
```

**FAQ Questions:**

1. **Can I change plans later?**
   Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate any differences.

2. **What happens after my trial ends?**
   You'll be prompted to choose a paid plan. If you don't select one, your account switches to view-only mode (you can see your data but can't add new transactions).

3. **Do you offer refunds?**
   Yes! We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.

4. **Is my data secure?**
   Absolutely. We use bank-level encryption (256-bit SSL), are GDPR compliant, and store all data on German servers.

5. **What payment methods do you accept?**
   We accept all major credit cards (Visa, Mastercard, Amex) and SEPA direct debit via Stripe.

6. **Can I cancel anytime?**
   Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.

7. **Do I need a credit card for the free trial?**
   No! Start your 14-day trial without entering any payment information.

8. **What's included in the AI features?**
   Our AI assistant (powered by Claude) can categorize transactions, answer accounting questions, suggest tax optimizations, and proactively remind you about deadlines.

---

## Phase 3: Signup Flow (Week 3-4)

### 3.1 Signup Page Updates

**File:** `apps/web/src/app/(auth)/signup/page.tsx`

**Flow:**
1. User lands on signup page (optionally with `?plan=professional` query param)
2. Enter email + password OR Google OAuth
3. Account created → auto-start 14-day trial
4. Redirect to onboarding flow
5. Skip payment for trial (no credit card required)

**Changes needed:**

```typescript
// apps/web/src/app/(auth)/signup/page.tsx

export default function SignupPage() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'professional'; // default to Professional

  return (
    <div>
      <h1>Start Your Free 14-Day Trial</h1>
      <p>No credit card required • Access all {selectedPlan} features</p>

      {/* Plan selector (optional) */}
      <PlanSelector selected={selectedPlan} onChange={setPlan} />

      {/* Signup form */}
      <SignupForm initialPlan={selectedPlan} />
    </div>
  );
}

// On successful signup:
async function handleSignup(email, password, plan) {
  const user = await createUser({ email, password });

  // Auto-start trial
  await updateUser(user.id, {
    subscription_tier: plan,
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    features_enabled: getFeaturesByTier(plan),
  });

  // Send welcome email
  await sendEmail({
    to: email,
    template: 'trial-started',
    data: { plan, trialEndsAt: user.trial_ends_at },
  });

  // Redirect to onboarding
  router.push('/onboarding');
}
```

---

### 3.2 Payment Flow (After Trial)

**File:** `apps/web/src/app/(dashboard)/billing/page.tsx`

**Scenarios:**
1. **During trial:** Show "X days left in trial" + option to upgrade early
2. **Trial expired:** Block access, show "Choose a plan to continue"
3. **Active subscription:** Show current plan, usage stats, upgrade/downgrade options

**Stripe Checkout Integration:**

```typescript
// apps/web/src/app/(dashboard)/billing/subscribe/route.ts

export async function POST(request: Request) {
  const { priceId } = await request.json();
  const session = await getSession(request);
  const user = await getUser(session.userId);

  // Create or retrieve Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await updateUser(user.id, { stripe_customer_id: customerId });
  }

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card', 'sepa_debit'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

// Frontend component
export function UpgradeButton({ priceId, planName }) {
  async function handleUpgrade() {
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    window.location.href = url; // Redirect to Stripe Checkout
  }

  return <Button onClick={handleUpgrade}>Upgrade to {planName}</Button>;
}
```

---

### 3.3 Trial Expiration Handling

**Email Sequence:**

**Day 1 (Welcome):**
```
Subject: Welcome to Operate! Your 14-day trial has started 🎉

Hi [Name],

Welcome to Operate! Your 14-day trial of the [Plan] plan is now active.

Here's what you can do next:
✓ Connect your bank account
✓ Upload your first receipt
✓ Ask the AI assistant a question
✓ Create your first invoice

Need help? Just reply to this email or chat with our AI assistant.

Happy bookkeeping!
The Operate Team

P.S. Your trial expires on [Date]. No credit card required until then.
```

**Day 7 (Midpoint):**
```
Subject: You're halfway through your Operate trial

Hi [Name],

You have 7 days left in your Operate trial. Here's what you've accomplished:
• [X] receipts scanned
• [X] AI chat messages
• [X] invoices created

Not using a feature? Our AI can help! Just ask:
"How do I categorize this expense?"
"Show me my VAT summary"
"Remind me about upcoming deadlines"

Upgrade now to lock in your data and unlock unlimited features:
[Upgrade to Professional - €19/month] (Most Popular)

Questions? We're here to help.
The Operate Team
```

**Day 11 (3 Days Left):**
```
Subject: Only 3 days left in your Operate trial

Hi [Name],

Your Operate trial expires in 3 days (on [Date]).

To keep using Operate and all your data, choose a plan:

✓ Starter - €9/month (perfect for solo freelancers)
✓ Professional - €19/month (⭐ Most Popular - full AI automation)
✓ Business - €39/month (team collaboration + advanced features)

[Choose Your Plan]

Save up to 13% with annual billing!

Still have questions? Reply to this email and we'll help you choose the right plan.

The Operate Team
```

**Day 14 (Trial Expired):**
```
Subject: Your Operate trial has expired

Hi [Name],

Your 14-day trial of Operate has ended.

Your data is safe and secure, but you'll need to choose a plan to continue using Operate.

[Choose a Plan] ← Takes 2 minutes

Plans start at just €9/month, and you can cancel anytime.

Not ready yet? No problem - your data will be waiting when you return.

The Operate Team

P.S. Need more time to decide? Reply to this email and we'll extend your trial.
```

---

## Phase 4: Analytics & Tracking (Week 4-5)

### 4.1 Key Metrics to Track

**Acquisition Metrics:**
- [ ] Pricing page views
- [ ] Trial signups (total + by plan)
- [ ] Signup source (pricing page, homepage, ads, etc.)
- [ ] Time from page view to signup

**Activation Metrics:**
- [ ] Trial users who complete onboarding
- [ ] Trial users who connect bank account
- [ ] Trial users who create first invoice
- [ ] Trial users who use AI chat

**Conversion Metrics:**
- [ ] Trial-to-paid conversion rate (overall)
- [ ] Trial-to-paid by plan (Starter, Professional, Business)
- [ ] Trial-to-paid by signup source
- [ ] Time to conversion (days in trial before upgrade)

**Revenue Metrics:**
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Annual Recurring Revenue (ARR)
- [ ] Average Revenue Per User (ARPU)
- [ ] MRR by plan
- [ ] Annual vs monthly billing split

**Retention Metrics:**
- [ ] Churn rate (monthly)
- [ ] Churn rate (annual)
- [ ] Churn reasons (survey)
- [ ] Upgrade rate (Starter → Professional)
- [ ] Downgrade rate (Professional → Starter)

**Usage Metrics:**
- [ ] AI messages per user (by plan)
- [ ] Receipt scans per user (by plan)
- [ ] Users hitting limits (Starter AI messages, receipts)
- [ ] Feature adoption (proactive suggestions, tax assistant, etc.)

---

### 4.2 Analytics Implementation

**Tool Recommendations:**
- **Stripe Dashboard:** Revenue, MRR, churn (built-in)
- **PostHog / Mixpanel:** Product analytics, funnels
- **Google Analytics 4:** Traffic, page views, sources
- **Custom Dashboard:** Real-time metrics in Operate admin panel

**Event Tracking:**

```typescript
// apps/web/src/lib/analytics.ts

export const trackEvent = (eventName: string, properties?: object) => {
  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties);
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
};

// Key events to track
export const events = {
  // Pricing page
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  PRICING_TOGGLE_ANNUAL: 'pricing_toggle_annual',
  PRICING_PLAN_CLICKED: 'pricing_plan_clicked', // { plan: 'professional' }

  // Signup
  SIGNUP_STARTED: 'signup_started', // { plan: 'professional' }
  SIGNUP_COMPLETED: 'signup_completed', // { plan: 'professional', method: 'google' }
  TRIAL_STARTED: 'trial_started', // { plan: 'professional' }

  // Activation
  ONBOARDING_COMPLETED: 'onboarding_completed',
  BANK_CONNECTED: 'bank_connected',
  FIRST_INVOICE_CREATED: 'first_invoice_created',
  FIRST_RECEIPT_SCANNED: 'first_receipt_scanned',
  FIRST_AI_MESSAGE: 'first_ai_message',

  // Conversion
  UPGRADE_CLICKED: 'upgrade_clicked', // { from: 'trial', to: 'professional' }
  CHECKOUT_STARTED: 'checkout_started', // { plan: 'professional', interval: 'annual' }
  SUBSCRIPTION_CREATED: 'subscription_created', // { plan: 'professional', interval: 'annual', price: 199 }

  // Limits
  LIMIT_HIT: 'limit_hit', // { limit: 'ai_messages', plan: 'starter' }
  LIMIT_WARNING: 'limit_warning', // { limit: 'ai_messages', usage: 450, limit: 500 }
};
```

**Usage:**

```typescript
// On pricing page
useEffect(() => {
  trackEvent(events.PRICING_PAGE_VIEWED, {
    source: searchParams.get('ref'),
  });
}, []);

// When user clicks plan
function handlePlanClick(plan: string) {
  trackEvent(events.PRICING_PLAN_CLICKED, { plan });
  router.push(`/signup?plan=${plan}`);
}

// After successful signup
trackEvent(events.SIGNUP_COMPLETED, {
  plan: selectedPlan,
  method: 'google', // or 'email'
});
trackEvent(events.TRIAL_STARTED, { plan: selectedPlan });

// When user hits limit
if (aiMessagesUsed >= 450 && aiMessagesUsed < 500) {
  trackEvent(events.LIMIT_WARNING, {
    limit: 'ai_messages',
    usage: aiMessagesUsed,
    limit: 500,
    plan: 'starter',
  });
}
```

---

### 4.3 Admin Dashboard

**File:** `apps/web/src/app/admin/metrics/page.tsx`

**Sections:**
1. Revenue overview (MRR, ARR, growth)
2. Subscription breakdown (by plan)
3. Trial funnel (signups → activations → conversions)
4. Churn analysis
5. Usage stats (AI messages, receipts, by plan)

**Example queries:**

```typescript
// Get MRR by plan
const mrrByPlan = await prisma.user.groupBy({
  by: ['subscription_tier'],
  where: {
    subscription_status: 'active',
    billing_interval: 'monthly',
  },
  _count: true,
});

// Calculate MRR
const mrr = mrrByPlan.map(tier => ({
  plan: tier.subscription_tier,
  count: tier._count,
  mrr: tier._count * PLAN_PRICES[tier.subscription_tier],
}));

// Trial conversion rate
const trialUsers = await prisma.user.count({
  where: { subscription_status: 'trialing' },
});

const convertedUsers = await prisma.user.count({
  where: {
    subscription_status: 'active',
    createdAt: { gte: thirtyDaysAgo },
  },
});

const conversionRate = (convertedUsers / (trialUsers + convertedUsers)) * 100;
```

---

## Phase 5: Email Automation (Week 5-6)

### 5.1 Email Templates

**Tool:** Resend, SendGrid, or Mailgun

**Templates to create:**
1. ✅ Welcome email (trial started)
2. ✅ Onboarding tips (Day 2-3)
3. ✅ Midpoint check-in (Day 7)
4. ✅ Trial ending soon (Day 11)
5. ✅ Trial expired (Day 14)
6. ✅ Subscription confirmed (after payment)
7. ✅ Payment failed
8. ✅ Subscription canceled
9. ✅ Upgrade confirmation
10. ✅ Usage limit warning (80% of AI messages used)

**Example: Trial Ending Soon (Day 11)**

```html
<!-- apps/api/src/templates/emails/trial-ending-soon.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    .plan-card { border: 1px solid #ddd; padding: 16px; margin: 12px 0; border-radius: 8px; }
    .popular { border-color: #0066cc; border-width: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Only 3 days left in your Operate trial</h1>

    <p>Hi {{firstName}},</p>

    <p>Your Operate trial expires in <strong>3 days</strong> (on {{trialEndsAt}}).</p>

    <p>Here's what you've accomplished so far:</p>
    <ul>
      <li>{{receiptsScanned}} receipts scanned</li>
      <li>{{aiMessagesUsed}} AI chat messages</li>
      <li>{{invoicesCreated}} invoices created</li>
    </ul>

    <p>To keep using Operate and all your data, choose a plan below:</p>

    <div class="plan-card">
      <h3>Starter - €9/month</h3>
      <p>Perfect for solo freelancers with simple needs</p>
      <a href="{{appUrl}}/billing?plan=starter" class="button">Choose Starter</a>
    </div>

    <div class="plan-card popular">
      <h3>Professional - €19/month ⭐ Most Popular</h3>
      <p>Full AI automation - let Operate handle everything</p>
      <a href="{{appUrl}}/billing?plan=professional" class="button">Choose Professional</a>
      <p><small>💰 Save €29/year with annual billing (€199/year)</small></p>
    </div>

    <div class="plan-card">
      <h3>Business - €39/month</h3>
      <p>Team collaboration + advanced features</p>
      <a href="{{appUrl}}/billing?plan=business" class="button">Choose Business</a>
    </div>

    <p>Still have questions? Reply to this email and we'll help you choose the right plan.</p>

    <p>Happy bookkeeping!<br>The Operate Team</p>

    <hr>
    <p style="font-size: 12px; color: #666;">
      You're receiving this email because you started a trial of Operate on {{trialStartedAt}}.
      <a href="{{unsubscribeUrl}}">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
```

---

### 5.2 Email Automation Cron Jobs

**File:** `apps/api/src/cron/trial-emails.service.ts`

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TrialEmailsService {

  // Run daily at 9 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendTrialEmails() {
    const today = new Date();

    // Day 7 emails (midpoint)
    const day7Users = await this.prisma.user.findMany({
      where: {
        subscription_status: 'trialing',
        trial_ends_at: {
          gte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          lt: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const user of day7Users) {
      await this.emailService.send({
        to: user.email,
        template: 'trial-midpoint',
        data: {
          firstName: user.firstName,
          trialEndsAt: user.trial_ends_at,
          receiptsScanned: await this.getReceiptsScanned(user.id),
          aiMessagesUsed: user.ai_messages_used_current_period,
          invoicesCreated: await this.getInvoicesCreated(user.id),
        },
      });
    }

    // Day 11 emails (3 days left)
    const day11Users = await this.prisma.user.findMany({
      where: {
        subscription_status: 'trialing',
        trial_ends_at: {
          gte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          lt: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const user of day11Users) {
      await this.emailService.send({
        to: user.email,
        template: 'trial-ending-soon',
        data: {
          firstName: user.firstName,
          trialEndsAt: user.trial_ends_at,
          receiptsScanned: await this.getReceiptsScanned(user.id),
          aiMessagesUsed: user.ai_messages_used_current_period,
          invoicesCreated: await this.getInvoicesCreated(user.id),
          appUrl: process.env.APP_URL,
        },
      });
    }

    // Day 14 emails (trial expired)
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        subscription_status: 'trialing',
        trial_ends_at: {
          lt: today,
        },
      },
    });

    for (const user of expiredUsers) {
      // Update status to expired
      await this.prisma.user.update({
        where: { id: user.id },
        data: { subscription_status: 'trial_expired' },
      });

      // Send email
      await this.emailService.send({
        to: user.email,
        template: 'trial-expired',
        data: {
          firstName: user.firstName,
          appUrl: process.env.APP_URL,
        },
      });
    }
  }

  // Run daily at 10 AM
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendUsageLimitWarnings() {
    // Find Starter users at 80% of AI message limit
    const starterUsers = await this.prisma.user.findMany({
      where: {
        subscription_tier: 'starter',
        subscription_status: 'active',
        ai_messages_used_current_period: { gte: 400, lt: 450 }, // 80% of 500
      },
    });

    for (const user of starterUsers) {
      await this.emailService.send({
        to: user.email,
        template: 'usage-limit-warning',
        data: {
          firstName: user.firstName,
          limitType: 'AI messages',
          usage: user.ai_messages_used_current_period,
          limit: 500,
          upgradeUrl: `${process.env.APP_URL}/billing?upgrade=professional`,
        },
      });
    }
  }
}
```

---

## Phase 6: In-App Upgrade Prompts (Week 6-7)

### 6.1 Strategic Placement

**Where to show upgrade prompts:**
1. **AI chat** - When Starter user hits 80% of 500 messages
2. **Receipt scanning** - When Starter user hits 80% of 50 receipts
3. **Bank connections** - When user tries to add 2nd bank (Starter) or 4th bank (Professional)
4. **Proactive suggestions** - When Starter/trial user accesses locked feature
5. **Tax assistant** - When Starter/trial user clicks tax filing
6. **Dashboard banner** - During trial, show "X days left" with upgrade CTA

**Example components:**

```typescript
// apps/web/src/components/upsell/LimitWarning.tsx
export function LimitWarning({ limitType, usage, limit, tier }) {
  const percentage = (usage / limit) * 100;

  if (percentage < 80) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTitle>You've used {usage} of {limit} {limitType} this month</AlertTitle>
      <AlertDescription>
        Upgrade to Professional for unlimited {limitType}.
        <Button variant="link" onClick={() => router.push('/billing?upgrade=professional')}>
          Upgrade Now →
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// apps/web/src/components/upsell/FeatureLockedModal.tsx
export function FeatureLockedModal({ feature, requiredTier }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock {feature}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {feature} is available on the {requiredTier} plan.
          <ul className="mt-4 space-y-2">
            <li>✓ Unlimited AI chat messages</li>
            <li>✓ Proactive daily suggestions</li>
            <li>✓ Tax filing assistant</li>
            <li>✓ And more...</li>
          </ul>
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Maybe Later
          </Button>
          <Button onClick={() => router.push('/billing?upgrade=professional')}>
            Upgrade to {requiredTier} - €19/month
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// apps/web/src/components/upsell/TrialBanner.tsx
export function TrialBanner({ trialEndsAt }) {
  const daysLeft = Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 p-3 text-center">
      <p className="text-sm">
        You have <strong>{daysLeft} days</strong> left in your trial.
        <Button variant="link" onClick={() => router.push('/billing')}>
          Choose a plan →
        </Button>
      </p>
    </div>
  );
}
```

---

### 6.2 A/B Testing Upgrade Messages

**Variants to test:**

**Variant A (Value-focused):**
```
"Upgrade to Professional and save 10 hours/month on bookkeeping"
```

**Variant B (Price-focused):**
```
"Unlock unlimited AI for just €10 more per month"
```

**Variant C (Urgency-focused):**
```
"You've used 450 of 500 AI messages. Upgrade now to avoid hitting the limit."
```

**Variant D (Social proof):**
```
"Join 500+ freelancers using Professional to automate their bookkeeping"
```

**Implementation:**

```typescript
// apps/web/src/lib/ab-tests.ts

export function getUpgradeMessage(variant: 'A' | 'B' | 'C' | 'D') {
  const messages = {
    A: {
      title: "Save 10 hours/month on bookkeeping",
      description: "Upgrade to Professional and let AI handle categorization, reminders, and tax filing.",
      cta: "Upgrade to Professional",
    },
    B: {
      title: "Unlock unlimited AI for just €10/month",
      description: "Professional plan includes unlimited AI messages, 3 bank connections, and tax assistant.",
      cta: "Upgrade for €10/month",
    },
    C: {
      title: "You've used 450 of 500 AI messages",
      description: "Upgrade now to avoid hitting your monthly limit.",
      cta: "Upgrade to Unlimited",
    },
    D: {
      title: "Join 500+ freelancers using Professional",
      description: "Automate your bookkeeping with unlimited AI assistance.",
      cta: "Upgrade to Professional",
    },
  };

  return messages[variant];
}

// Randomly assign on first session
const assignedVariant = sessionStorage.getItem('upgrade_message_variant') ||
  ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
sessionStorage.setItem('upgrade_message_variant', assignedVariant);

// Track which variant converts better
trackEvent('upgrade_message_shown', { variant: assignedVariant });
```

---

## Phase 7: Launch Checklist (Week 7-8)

### 7.1 Pre-Launch QA

**Testing checklist:**

- [ ] **Stripe Integration**
  - [ ] Test mode: Create subscription (monthly + annual)
  - [ ] Test mode: Cancel subscription
  - [ ] Test mode: Upgrade from Starter to Professional
  - [ ] Test mode: Downgrade from Professional to Starter
  - [ ] Test mode: Failed payment handling
  - [ ] Webhooks firing correctly
  - [ ] Production mode: Repeat all tests

- [ ] **Trial Flow**
  - [ ] Signup without credit card works
  - [ ] Trial auto-expires after 14 days
  - [ ] Access blocked after trial expires
  - [ ] Data preserved after trial (view-only mode)

- [ ] **Feature Gates**
  - [ ] Starter: AI messages limited to 500/month
  - [ ] Starter: Receipt scanning limited to 50/month
  - [ ] Starter: Bank connections limited to 1
  - [ ] Professional: All limits removed
  - [ ] Business: API access enabled
  - [ ] Locked features show upgrade prompt

- [ ] **Email Automation**
  - [ ] Welcome email sends immediately
  - [ ] Day 7 email sends correctly
  - [ ] Day 11 email sends correctly
  - [ ] Day 14 email sends correctly
  - [ ] Unsubscribe links work
  - [ ] Email tracking (open/click rates)

- [ ] **Pricing Page**
  - [ ] Mobile responsive
  - [ ] Monthly/annual toggle works
  - [ ] Savings badges display correctly
  - [ ] CTA buttons link to signup with correct plan
  - [ ] FAQ accordion works
  - [ ] Page loads fast (<2s)

- [ ] **Analytics**
  - [ ] Events tracking in PostHog/Mixpanel
  - [ ] Google Analytics 4 events firing
  - [ ] Stripe webhook events logged
  - [ ] Admin dashboard shows correct MRR

- [ ] **Legal/Compliance**
  - [ ] Terms of Service updated with subscription terms
  - [ ] Privacy Policy includes Stripe/payment processing
  - [ ] Cookie consent banner (GDPR)
  - [ ] VAT calculation correct (19% German VAT)
  - [ ] GDPR data export includes subscription info

---

### 7.2 Soft Launch (Internal Testing)

**Week 7:**
- [ ] Deploy pricing page to staging
- [ ] Test with 5-10 beta users (friends/family)
- [ ] Collect feedback on pricing clarity
- [ ] Check for bugs in payment flow
- [ ] Verify email delivery (not landing in spam)
- [ ] Monitor Stripe test mode logs

**Success criteria:**
- [ ] 100% of beta users successfully complete trial signup
- [ ] 80%+ of beta users understand pricing tiers
- [ ] 0 critical bugs found
- [ ] All emails delivered (<5% bounce rate)

---

### 7.3 Public Launch

**Week 8:**
- [ ] Deploy to production
- [ ] Announce on website homepage
- [ ] Send email to waitlist (if applicable)
- [ ] Post on social media (LinkedIn, Twitter)
- [ ] Submit to directories (Capterra, G2, OMR Reviews)
- [ ] Enable Google/Facebook ads (if budget available)

**Launch Day Checklist:**
- [ ] Switch Stripe to live mode
- [ ] Enable real email sending (disable test mode)
- [ ] Monitor error logs (Sentry, LogRocket)
- [ ] Watch Stripe dashboard for first subscriptions
- [ ] Respond to support emails within 2 hours
- [ ] Track analytics in real-time

**Monitoring (First 48 Hours):**
- [ ] Check Stripe for failed payments
- [ ] Check email delivery rates
- [ ] Monitor server performance (CPU, memory)
- [ ] Check error rates in Sentry
- [ ] Review user feedback/support tickets
- [ ] Track conversion funnel (pricing page → signup → trial → paid)

---

## Success Metrics (First 30 Days)

### Target Goals

| Metric | Target | Stretch Goal |
|--------|--------|--------------|
| **Trial Signups** | 50 | 100 |
| **Trial Activation Rate** | 60% | 75% |
| **Trial-to-Paid Conversion** | 15% | 25% |
| **MRR** | €500 | €1,000 |
| **Average Plan** | Professional (€19) | Professional (€19) |
| **Annual Billing %** | 20% | 35% |
| **Support Tickets** | <10/week | <5/week |
| **Churn Rate** | <5% | <3% |

**Calculation examples:**
- 50 trial signups × 60% activation × 15% conversion = ~5 paid users
- 5 paid users × €19 avg = €95 MRR (conservative)
- 100 trial signups × 75% activation × 25% conversion = ~19 paid users
- 19 paid users × €19 avg = €361 MRR (stretch goal)

---

## Iteration Plan (Months 2-3)

### Month 2: Optimize Conversion

**Focus:** Improve trial-to-paid conversion rate

**Actions:**
- [ ] Analyze drop-off points in funnel
- [ ] A/B test upgrade messages
- [ ] Add in-app upgrade prompts at strategic moments
- [ ] Improve trial onboarding (reduce time to first value)
- [ ] Add testimonials/social proof to pricing page
- [ ] Offer limited-time discount (e.g., "20% off first 3 months")

**Success:** Increase trial-to-paid from 15% → 20%

---

### Month 3: Expand Revenue

**Focus:** Increase ARPU and add upsells

**Actions:**
- [ ] Launch Business tier (€39/month)
- [ ] Add team member add-ons (€5/user)
- [ ] Introduce professional tax consultation (€49/hour)
- [ ] Create upgrade path (Starter → Professional campaign)
- [ ] Test annual billing discount increase (13% → 20% for limited time)
- [ ] Add usage-based overage fees (e.g., extra AI messages for Starter)

**Success:** Increase ARPU from €17 → €20

---

## Summary

This implementation guide covers:

✅ **Phase 1:** Stripe setup + database + feature gates
✅ **Phase 2:** Pricing page frontend
✅ **Phase 3:** Signup flow + payment integration
✅ **Phase 4:** Analytics tracking
✅ **Phase 5:** Email automation
✅ **Phase 6:** In-app upgrade prompts
✅ **Phase 7:** Launch checklist + QA

**Timeline:** 7-8 weeks from start to public launch

**Next Steps:**
1. Review this guide with development team
2. Assign tasks to developers (backend, frontend, DevOps)
3. Create tickets in project management tool (Linear, Jira, etc.)
4. Start with Phase 1 (Stripe + database) immediately
5. Parallel work on Phase 2 (pricing page) while backend builds

**Questions?**
- Stripe integration details? See [Stripe Billing docs](https://stripe.com/docs/billing)
- Email automation? See [Resend](https://resend.com) or [SendGrid](https://sendgrid.com)
- Analytics? See [PostHog](https://posthog.com) or [Mixpanel](https://mixpanel.com)

---

*Implementation guide created: December 7, 2025*
*Based on pricing strategy recommendation and competitive analysis*
