# Billing Settings - Implementation Guide

## Page Structure

The billing settings page is organized into these sections:

### 1. Header
```
Billing & Subscription
Manage your subscription, payment methods, and billing history
```

### 2. Current Plan Card
Shows:
- Plan name with colored badge
- Billing cycle (Monthly/Annual)
- Next billing date
- Current usage summary (4 metrics)
- Trial/cancellation notices if applicable

### 3. Usage Overview
Visual progress bars for:
- AI Messages (500/2000)
- Bank Connections (3/10)
- Invoices This Month (12/200)
- Team Members (2/5)
- Storage (8.5/50 GB)

Color coding:
- Green: < 75% used
- Amber: 75-90% used
- Red: > 90% used

### 4. Payment Methods
- List of saved cards
- Add new card button
- Set default / Remove actions
- Card brand icons and last 4 digits

### 5. Billing History
Table with columns:
- Invoice number & period
- Date & due date
- Status badge
- Amount
- Download PDF button

Pagination: 10 invoices per page

### 6. Subscription Actions

**Switch Billing Cycle**
- Blue info box
- Switch to Annual (save 17%) or Monthly

**Resume Subscription** (if cancelled)
- Green success box
- Resume button to reactivate

**Cancel Subscription** (if active)
- Red warning box
- Opens confirmation modal

## Animations

GSAP timeline with cascading entrance:
1. Header fades in from top (-20px)
2. Current Plan Card slides up (30px)
3. Usage Overview slides up (30px)
4. Payment Methods slides up (30px)
5. Billing History slides up (30px)
6. Actions slide up (30px)

Each with 0.6s duration and power3.out easing.

## Plan Tiers

| Tier | Price/mo | Price/yr | AI Msgs | Banks | Invoices | Team | Storage |
|------|----------|----------|---------|-------|----------|------|---------|
| Free | $0 | $0 | 50 | 1 | 10 | 1 | 1 GB |
| Starter | $29 | $290 | 500 | 3 | 50 | 1 | 10 GB |
| Pro | $79 | $790 | 2,000 | 10 | 200 | 5 | 50 GB |
| Business | $199 | $1,990 | ∞ | ∞ | ∞ | ∞ | 500 GB |

Annual saves 17% (2 months free).

## User Flows

### Upgrade Flow
1. Click "Change Plan" button
2. Dialog opens with plan comparison
3. Toggle Monthly/Annual
4. Click "Upgrade" on desired plan
5. Confirmation toast
6. Page updates with new plan

### Cancel Flow
1. Click "Cancel Subscription" in red box
2. Modal opens with:
   - What happens explanation
   - Reason selection (optional)
   - Feedback textarea (optional)
   - Alternative offer (pause)
3. Click "Cancel Subscription"
4. Subscription marked for cancellation
5. Green "Resume" box appears

### Add Payment Method Flow
1. Click "Add Card"
2. Dialog with Stripe Elements placeholder
3. Enter card details (in production)
4. Click "Add Card"
5. Card added to list
6. Auto-set as default if first card

## Error Handling

All actions show toast notifications:
- Success: Green toast
- Error: Red toast with error message

Loading states:
- Buttons show "Processing..." or "Loading..."
- Disabled during operations

## Responsive Design

- Desktop: 4-column plan grid
- Tablet: 2-column plan grid
- Mobile: 1-column stacked layout

All cards stack on mobile with full width.

## Dark Mode

Fully supports dark mode with:
- Muted backgrounds
- Adjusted contrast
- Color-coded badges remain readable

## Accessibility

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- High contrast mode support

## Next Steps for Backend Integration

1. **Create API Endpoints**
   - Implement all `/api/v1/billing/*` endpoints
   - Connect to Stripe API
   - Store subscription data in database

2. **Add Stripe Integration**
   - Install `@stripe/stripe-js` and `@stripe/react-stripe-js`
   - Create Stripe customer on signup
   - Generate payment intents
   - Handle webhooks

3. **Invoice Generation**
   - Generate PDF invoices
   - Store in S3 or similar
   - Email receipts

4. **Usage Tracking**
   - Implement counters for AI messages, invoices, etc.
   - Reset monthly
   - Enforce limits

5. **Plan Enforcement**
   - Check limits before operations
   - Block actions when at limit
   - Show upgrade prompts

## File Locations

```
apps/web/src/
├── hooks/
│   └── use-subscription.ts          # Main subscription hook
├── components/
│   └── billing/
│       ├── index.ts                 # Exports
│       ├── CurrentPlanCard.tsx      # Plan display
│       ├── UsageOverview.tsx        # Usage metrics
│       ├── PlanComparison.tsx       # Plan grid
│       ├── PaymentMethods.tsx       # Card management
│       ├── BillingHistory.tsx       # Invoice table
│       └── CancelSubscriptionModal.tsx  # Cancel flow
└── app/
    └── (dashboard)/
        └── settings/
            └── billing/
                └── page.tsx         # Main page
```

## Testing Checklist

- [ ] Page loads without errors
- [ ] Subscription data displays correctly
- [ ] Usage metrics show with progress bars
- [ ] Plan comparison shows all tiers
- [ ] Payment methods list works
- [ ] Add payment method opens dialog
- [ ] Billing history shows invoices
- [ ] Pagination works correctly
- [ ] Cancel subscription opens modal
- [ ] Resume subscription works
- [ ] Switch billing cycle works
- [ ] Change plan updates subscription
- [ ] All animations play smoothly
- [ ] Responsive on mobile
- [ ] Dark mode looks good
- [ ] Error states handled
- [ ] Loading states show
