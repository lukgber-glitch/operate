# Phase 1: Connection Hub Specification

## Overview

Build a unified connection management system that allows users to connect all external services (banking, email, tax software) through a seamless first-time setup wizard and ongoing connection management page.

---

## Database Schema Additions

### New Models (Prisma)

```prisma
// packages/database/prisma/schema.prisma

model Integration {
  id              String            @id @default(cuid())
  organisationId  String
  organisation    Organisation      @relation(fields: [organisationId], references: [id])

  provider        IntegrationProvider
  type            IntegrationType
  status          IntegrationStatus @default(DISCONNECTED)

  // OAuth tokens (encrypted)
  accessToken     String?           @db.Text
  refreshToken    String?           @db.Text
  tokenExpiresAt  DateTime?

  // Provider-specific data
  externalId      String?           // Provider's account/user ID
  metadata        Json?             // Additional provider data

  // Sync tracking
  lastSyncAt      DateTime?
  lastSyncStatus  SyncStatus?
  lastSyncError   String?

  // Audit
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  createdBy       String

  @@unique([organisationId, provider])
  @@index([organisationId])
  @@index([status])
}

model IntegrationAccount {
  id              String      @id @default(cuid())
  integrationId   String
  integration     Integration @relation(fields: [integrationId], references: [id])

  // Account details
  externalId      String      // Provider's account ID
  name            String
  type            String?     // checking, savings, etc.
  currency        String?
  balance         Decimal?    @db.Decimal(15, 2)
  balanceUpdatedAt DateTime?

  isPrimary       Boolean     @default(false)
  isActive        Boolean     @default(true)

  metadata        Json?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([integrationId, externalId])
  @@index([integrationId])
}

model OnboardingProgress {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id])

  // Steps completed
  companyProfile  Boolean     @default(false)
  bankingConnected Boolean    @default(false)
  emailConnected  Boolean     @default(false)
  taxConnected    Boolean     @default(false)
  preferencesSet  Boolean     @default(false)
  tourCompleted   Boolean     @default(false)

  // Skip tracking
  skippedSteps    String[]    @default([])

  // Timestamps
  startedAt       DateTime    @default(now())
  completedAt     DateTime?

  @@index([userId])
}

enum IntegrationProvider {
  // Banking
  GOCARDLESS
  TINK
  PLAID

  // Email
  GMAIL
  MICROSOFT_OUTLOOK
  IMAP_CUSTOM

  // Tax/Accounting
  LEXOFFICE
  SEVDESK
  DATEV
  ELSTER
  FINANZONLINE

  // Payment
  STRIPE
  PAYPAL

  // E-commerce
  SHOPIFY
  WOOCOMMERCE
}

enum IntegrationType {
  BANKING
  EMAIL
  ACCOUNTING
  TAX_AUTHORITY
  PAYMENT
  ECOMMERCE
}

enum IntegrationStatus {
  DISCONNECTED
  PENDING
  CONNECTED
  ERROR
  EXPIRED
}

enum SyncStatus {
  SUCCESS
  PARTIAL
  FAILED
}
```

---

## API Endpoints

### CONNECT Agent Endpoints

```typescript
// apps/api/src/integrations/integrations.controller.ts

@Controller('integrations')
export class IntegrationsController {

  // List all integrations for organization
  @Get()
  @Roles(Role.MEMBER)
  async listIntegrations(@CurrentOrg() orgId: string): Promise<Integration[]>

  // Get single integration status
  @Get(':provider')
  @Roles(Role.MEMBER)
  async getIntegration(
    @CurrentOrg() orgId: string,
    @Param('provider') provider: IntegrationProvider
  ): Promise<Integration>

  // Initiate OAuth flow
  @Post(':provider/connect')
  @Roles(Role.ADMIN)
  async initiateConnection(
    @CurrentOrg() orgId: string,
    @Param('provider') provider: IntegrationProvider,
    @Body() dto: InitiateConnectionDto
  ): Promise<{ redirectUrl: string }>

  // OAuth callback (no auth - receives from provider)
  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: IntegrationProvider,
    @Query() query: OAuthCallbackQuery
  ): Promise<void> // Redirects to frontend

  // Disconnect integration
  @Delete(':provider')
  @Roles(Role.ADMIN)
  async disconnect(
    @CurrentOrg() orgId: string,
    @Param('provider') provider: IntegrationProvider
  ): Promise<void>

  // Manual sync trigger
  @Post(':provider/sync')
  @Roles(Role.ADMIN)
  async triggerSync(
    @CurrentOrg() orgId: string,
    @Param('provider') provider: IntegrationProvider
  ): Promise<{ syncId: string }>

  // Get sync status
  @Get(':provider/sync/:syncId')
  @Roles(Role.MEMBER)
  async getSyncStatus(
    @CurrentOrg() orgId: string,
    @Param('provider') provider: IntegrationProvider,
    @Param('syncId') syncId: string
  ): Promise<SyncStatus>
}
```

### Onboarding Endpoints

```typescript
// apps/api/src/onboarding/onboarding.controller.ts

@Controller('onboarding')
export class OnboardingController {

  // Get onboarding progress
  @Get('progress')
  async getProgress(@CurrentUser() userId: string): Promise<OnboardingProgress>

  // Update step completion
  @Patch('progress/:step')
  async completeStep(
    @CurrentUser() userId: string,
    @Param('step') step: OnboardingStep,
    @Body() data?: any
  ): Promise<OnboardingProgress>

  // Skip step
  @Post('progress/:step/skip')
  async skipStep(
    @CurrentUser() userId: string,
    @Param('step') step: OnboardingStep
  ): Promise<OnboardingProgress>

  // Complete onboarding
  @Post('complete')
  async completeOnboarding(
    @CurrentUser() userId: string
  ): Promise<void>
}
```

---

## Provider-Specific Services

### GoCardless Service

```typescript
// apps/api/src/integrations/providers/gocardless.service.ts

@Injectable()
export class GocardlessService {
  private readonly baseUrl = 'https://bankaccountdata.gocardless.com/api/v2';

  async createRequisition(
    orgId: string,
    institutionId: string,
    redirectUri: string
  ): Promise<{ requisitionId: string; link: string }> {
    // 1. Create end user agreement
    // 2. Create requisition
    // 3. Return link for user redirect
  }

  async completeRequisition(
    requisitionId: string
  ): Promise<{ accounts: BankAccount[] }> {
    // 1. Get requisition status
    // 2. Fetch linked accounts
    // 3. Store account details
  }

  async getTransactions(
    accountId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Transaction[]> {
    // Fetch transactions with pagination
  }

  async getBalance(accountId: string): Promise<Balance> {
    // Fetch current balance
  }

  async listInstitutions(country: string): Promise<Institution[]> {
    // List supported banks by country
  }
}
```

### Gmail Service

```typescript
// apps/api/src/integrations/providers/gmail.service.ts

@Injectable()
export class GmailService {
  async initiateOAuth(redirectUri: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      redirectUri
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.labels',
      ],
    });
  }

  async handleCallback(code: string): Promise<Tokens> {
    // Exchange code for tokens
  }

  async listMessages(
    accessToken: string,
    query?: string,
    maxResults?: number
  ): Promise<Message[]> {
    // List emails with optional search query
  }

  async getMessage(
    accessToken: string,
    messageId: string
  ): Promise<MessageDetail> {
    // Get full message with attachments
  }

  async getAttachment(
    accessToken: string,
    messageId: string,
    attachmentId: string
  ): Promise<Buffer> {
    // Download attachment content
  }
}
```

---

## Frontend Components

### Onboarding Wizard

```typescript
// apps/web/src/app/(onboarding)/setup/page.tsx

// Step 1: Company Profile
// Step 2: Banking Connection (GoCardless)
// Step 3: Email Connection (Gmail/Outlook)
// Step 4: Tax Software Connection
// Step 5: Preferences
// Step 6: First AI Analysis
// Step 7: Dashboard Tour
```

### Connection Hub Page

```typescript
// apps/web/src/app/(dashboard)/settings/connections/page.tsx

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <h1>Connected Accounts</h1>

      <section>
        <h2>Banking</h2>
        <ConnectionCard
          provider="gocardless"
          title="Bank Account"
          description="Connect your bank for automatic transaction sync"
          status={bankingStatus}
          onConnect={handleBankingConnect}
          onDisconnect={handleBankingDisconnect}
        />
      </section>

      <section>
        <h2>Email</h2>
        <ConnectionCard
          provider="gmail"
          title="Gmail"
          description="Extract invoices and receipts from your emails"
          status={gmailStatus}
          onConnect={handleGmailConnect}
          onDisconnect={handleGmailDisconnect}
        />
        <ConnectionCard
          provider="microsoft_outlook"
          title="Outlook"
          description="Extract invoices and receipts from your emails"
          status={outlookStatus}
          onConnect={handleOutlookConnect}
          onDisconnect={handleOutlookDisconnect}
        />
      </section>

      <section>
        <h2>Accounting Software</h2>
        <ConnectionCard
          provider="lexoffice"
          title="lexoffice"
          description="Sync invoices and contacts with lexoffice"
          status={lexofficeStatus}
          onConnect={handleLexofficeConnect}
          onDisconnect={handleLexofficeDisconnect}
        />
      </section>
    </div>
  );
}
```

### Connection Card Component

```typescript
// apps/web/src/components/integrations/connection-card.tsx

interface ConnectionCardProps {
  provider: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSyncAt?: Date;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh?: () => void;
}

export function ConnectionCard({
  provider,
  title,
  description,
  icon,
  status,
  lastSyncAt,
  onConnect,
  onDisconnect,
  onRefresh,
}: ConnectionCardProps) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
          {icon || <LinkIcon />}
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {status === 'connected' && lastSyncAt && (
            <p className="text-xs text-green-600">
              Last synced: {formatRelativeTime(lastSyncAt)}
            </p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-600">
              Connection error. Please reconnect.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge status={status} />

        {status === 'connected' ? (
          <>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshIcon className="h-4 w-4" />
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={onConnect}>
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}
```

---

## User Flows

### First-Time Setup Flow

```
1. User completes registration
2. Redirect to /setup (onboarding wizard)
3. Step 1: Company Profile
   - Company name, address, tax ID
   - Industry selection
   - Country selection

4. Step 2: Banking Connection
   - Show "Why connect your bank?" explanation
   - Click "Connect Bank Account"
   - Open GoCardless in new window/modal
   - User selects bank, logs in
   - GoCardless redirects back
   - Show "Connected successfully!" with account preview
   - Option: "Skip for now"

5. Step 3: Email Connection
   - Show "Why connect email?" explanation
   - Choose Gmail or Outlook
   - OAuth consent screen
   - Redirect back with success
   - Option: "Skip for now"

6. Step 4: Tax Software (Optional)
   - Show available options (lexoffice, sevDesk, ELSTER)
   - Most users skip initially
   - Can complete later in Settings

7. Step 5: Preferences
   - Automation level (Full Auto / Semi Auto / Manual)
   - Notification preferences
   - Language/currency

8. Step 6: First AI Analysis
   - "Analyzing your connected accounts..."
   - Progress bar with steps
   - Show early insights when ready

9. Step 7: Dashboard Tour
   - Interactive tooltips
   - Highlight key features
   - Introduce chatbot

10. Complete → Redirect to dashboard
```

### Reconnection Flow (Expired Token)

```
1. Background sync fails with 401
2. Mark integration status = EXPIRED
3. Show banner in dashboard: "Your bank connection needs to be refreshed"
4. User clicks "Reconnect"
5. Same OAuth flow as initial connection
6. Update tokens, reset status = CONNECTED
7. Trigger immediate sync
```

---

## Security Requirements

1. **Token Encryption**
   - Encrypt access/refresh tokens with AES-256
   - Store encryption key in environment variable
   - Rotate encryption keys periodically

2. **State Parameter**
   - Generate unique state for each OAuth flow
   - Store in Redis with 10-minute TTL
   - Validate on callback

3. **PKCE (Where Supported)**
   - Use code_verifier and code_challenge
   - Required for public clients (mobile/SPA)

4. **Audit Logging**
   - Log all connection attempts
   - Log all sync operations
   - Store for GoBD compliance (10 years)

---

## Testing Plan

### Unit Tests
- OAuth URL generation
- Token exchange
- Token refresh logic
- Encryption/decryption

### Integration Tests
- GoCardless sandbox
- Gmail API (test account)
- Microsoft Graph (test tenant)

### E2E Tests
- Complete onboarding flow
- Connection/disconnection
- Sync trigger and verification
- Error handling (expired tokens)

---

## Success Criteria

- [ ] User can complete setup in < 5 minutes
- [ ] Banking connection works for top 10 German banks
- [ ] Email connection works for Gmail and Outlook
- [ ] Token refresh happens automatically
- [ ] Clear error messages for all failure cases
- [ ] Reconnection flow is seamless
- [ ] All actions logged for audit
