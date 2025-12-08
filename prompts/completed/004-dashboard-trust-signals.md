<objective>
Add trust signals and marketing-focused elements to the Operate dashboard UI to improve user confidence and highlight the app's automation capabilities.

**Why this matters**: Users need to trust an AI system handling their finances. Clear trust signals, compliance badges, and performance indicators build confidence and reduce churn.

**Critical constraint**: Only include badges and claims the app can LEGITIMATELY make. Do not fabricate statistics or certifications.
</objective>

<context>
**Project**: Operate - AI chatbot SaaS for company automation (taxes, invoices, client bills)
**Tech Stack**: Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui
**Location**: C:\Users\grube\op\operate-fresh
**Target**: Dashboard/app UI (authenticated experience)
**Content Source**: Dynamic from CMS/database

Read CLAUDE.md for project conventions.
</context>

<research>
Before implementing, examine:
- `./apps/web/src/app/(dashboard)/layout.tsx` - dashboard layout
- `./apps/web/src/app/(dashboard)/dashboard/page.tsx` - main dashboard
- `./apps/web/src/app/(dashboard)/chat/page.tsx` - chat interface
- `./packages/database/prisma/schema.prisma` - existing data models
- `./apps/web/src/styles/design-tokens.css` - design system
</research>

<requirements>

## Features to Implement

### 1. Autopilot Mode Indicator
Display automation status prominently in the dashboard:
- Show when Operate is running in "Autopilot" mode
- Indicate what's being automated (document processing, classification, etc.)
- Visual indicator (badge or status light)
- ONLY show if the feature is actually active for the user

### 2. Accuracy/Performance Stats (Dynamic)
Create a stats display component that shows REAL metrics:
- Transaction classification accuracy (calculate from actual user data)
- Documents processed count
- Time saved estimate
- **Important**: Only show stats if data exists, otherwise show "Getting started" state

```typescript
interface UserStats {
  transactionsClassified: number;
  accuracyRate: number | null; // null if not enough data
  documentsProcessed: number;
  timeSavedMinutes: number;
}
```

### 3. Compliance Badges
Display applicable compliance badges:
- DSGVO/GDPR compliant (if app handles EU data properly)
- Only show badges that are TRUTHFULLY applicable
- Create a compliance config that documents which badges are legitimate

```typescript
// Create config that documents WHY each badge is legitimate
const complianceBadges = [
  {
    id: 'gdpr',
    label: 'GDPR Compliant',
    icon: 'Shield',
    justification: 'Data stored in EU, user consent flows, deletion support'
  },
  // Add others ONLY if legitimate
];
```

### 4. Social Proof Section (CMS-Driven)
Create database model and UI for testimonials:
- Testimonials with time savings ("200 receipts in <1h")
- Only display verified/real testimonials
- Admin can add via CMS/database
- Show placeholder state if no testimonials exist yet

### 5. Feature Highlights
Highlight capabilities that ARE implemented:
- Document scanning (if implemented)
- Transaction classification (if implemented)
- Receipt processing (if implemented)
- Show "Coming Soon" for unimplemented features

</requirements>

<implementation>

## Database Schema
Add to `./packages/database/prisma/schema.prisma`:

```prisma
model Testimonial {
  id          String   @id @default(cuid())
  authorName  String
  authorRole  String?
  company     String?
  content     String
  timeSaved   String?  // e.g., "200 receipts: <1h vs 8h"
  isVerified  Boolean  @default(false)
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ComplianceBadge {
  id            String   @id @default(cuid())
  slug          String   @unique
  label         String
  description   String
  justification String   // Why this badge is legitimate
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

## Components to Create

### 1. TrustBadges Component
`./apps/web/src/components/dashboard/TrustBadges.tsx`
- Fetches active compliance badges from database
- Displays with Lucide icons
- Tooltip shows justification on hover
- Uses design tokens

### 2. UserStats Component
`./apps/web/src/components/dashboard/UserStats.tsx`
- Fetches user's actual stats from API
- Shows real accuracy rate (if available)
- Shows "Not enough data yet" if insufficient history
- Animates numbers with count-up effect

### 3. AutopilotIndicator Component
`./apps/web/src/components/dashboard/AutopilotIndicator.tsx`
- Shows if autopilot features are enabled
- Pulses gently when actively processing
- Links to settings to enable/disable

### 4. TestimonialsCarousel Component
`./apps/web/src/components/dashboard/TestimonialsCarousel.tsx`
- Fetches published testimonials
- Simple carousel/slider
- Shows empty state if none exist
- Time savings prominently displayed

## Integration
Update `./apps/web/src/app/(dashboard)/dashboard/page.tsx`:
- Add TrustBadges in header area
- Add UserStats card
- Add AutopilotIndicator near main actions
- Add TestimonialsCarousel in sidebar or footer area

</implementation>

<output>

**Database**:
- `./packages/database/prisma/schema.prisma` - add Testimonial and ComplianceBadge models

**Components**:
- `./apps/web/src/components/dashboard/TrustBadges.tsx`
- `./apps/web/src/components/dashboard/UserStats.tsx`
- `./apps/web/src/components/dashboard/AutopilotIndicator.tsx`
- `./apps/web/src/components/dashboard/TestimonialsCarousel.tsx`

**Pages**:
- `./apps/web/src/app/(dashboard)/dashboard/page.tsx` - integrate components

**Config** (optional):
- `./apps/web/src/config/compliance.ts` - document legitimate badges

</output>

<constraints>
- **TRUTHFULNESS REQUIRED**: Never claim statistics that aren't real
- **NO FAKE BADGES**: Only display compliance badges the app legitimately qualifies for
- **NO FAKE TESTIMONIALS**: Only show real testimonials from database
- **GRACEFUL EMPTY STATES**: Show appropriate UI when data doesn't exist yet
- Use design tokens from the existing design system
- Lucide icons only
- Keyboard accessible
</constraints>

<verification>
Before declaring complete, verify:

1. **Truthfulness Audit**:
   - [ ] No hardcoded fake statistics
   - [ ] Compliance badges have documented justifications
   - [ ] Testimonials come from database (not hardcoded)
   - [ ] Stats show "Not enough data" when appropriate

2. **Technical**:
   - [ ] Database migrations created and applied
   - [ ] Components use design tokens
   - [ ] Empty states handled gracefully
   - [ ] Accessible with keyboard navigation

3. **Integration**:
   - [ ] Dashboard page integrates all components
   - [ ] Build passes without errors
</verification>

<success_criteria>
- TrustBadges component shows ONLY legitimate compliance badges
- UserStats shows real user metrics OR appropriate empty state
- AutopilotIndicator reflects actual automation status
- TestimonialsCarousel displays database-driven testimonials
- All components follow design system
- No fabricated data anywhere
- Build passes
</success_criteria>
