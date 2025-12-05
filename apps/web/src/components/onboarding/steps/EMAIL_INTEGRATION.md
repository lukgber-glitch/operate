# Email Integration - Onboarding Step

This document describes the Email Connection Step implementation for the Operate/CoachOS onboarding wizard.

## Overview

The Email Connection Step allows users to connect their Gmail and/or Outlook email accounts to automatically extract invoices and receipts. This feature is part of the competitor parity initiative (W31-T4).

## Features

### Supported Providers
- **Gmail**: Google Workspace and personal Gmail accounts
- **Outlook**: Microsoft 365, Outlook.com, and Hotmail accounts
- Users can connect both providers simultaneously

### Key Functionality
1. **OAuth 2.0 Authentication**: Secure authentication using OAuth2 with PKCE
2. **Connection Status**: Real-time display of connection state
3. **Email Display**: Shows connected email address
4. **Last Sync Time**: Displays when emails were last scanned
5. **Disconnect/Reconnect**: Easy management of connections
6. **Error Handling**: Clear error messages and recovery options

### Security & Privacy
- Read-only access to emails
- AES-256 encrypted token storage
- Only scans emails with invoice/receipt keywords
- Email content never stored on servers
- Users can revoke access anytime

## Files

### 1. EmailStep.tsx (322 lines)
Main component for the email connection onboarding step.

**Location**: `apps/web/src/components/onboarding/steps/EmailStep.tsx`

**Key Features**:
- Displays Gmail and Outlook provider cards
- Shows benefits of email integration
- Privacy and security information
- Skip option for users who prefer manual upload
- Success state when connected
- Manual upload alternative information

**Dependencies**:
- `useAuth` - Get current user information
- `useEmailConnection` - Manage email connections
- `EmailProviderCard` - Reusable provider card component

### 2. EmailProviderCard.tsx (187 lines)
Reusable card component for email provider display.

**Location**: `apps/web/src/components/onboarding/steps/EmailProviderCard.tsx`

**Props**:
```typescript
interface EmailProviderCardProps {
  provider: 'gmail' | 'outlook';
  name: string;
  description: string;
  logo?: React.ReactNode;
  status: 'disconnected' | 'connected' | 'connecting' | 'error';
  email?: string;
  lastSync?: string;
  error?: string | null;
  recommended?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}
```

**Features**:
- Visual status indicators (badges, icons, colors)
- Provider-specific branding (Gmail red, Outlook blue)
- Last sync time display
- Error state display
- Connect/Disconnect/Reconnect buttons
- Loading state with spinner

### 3. use-email-connection.ts (325 lines)
Custom React hook for managing email connections.

**Location**: `apps/web/src/hooks/use-email-connection.ts`

**API**:
```typescript
const {
  gmail,              // Gmail connection state
  outlook,            // Outlook connection state
  isLoading,          // Loading initial status
  connectGmail,       // Initiate Gmail OAuth
  connectOutlook,     // Initiate Outlook OAuth
  disconnectGmail,    // Disconnect Gmail
  disconnectOutlook,  // Disconnect Outlook
  refresh,            // Refresh connection statuses
} = useEmailConnection({
  userId: string,
  orgId: string,
  onConnectionSuccess?: (provider, email) => void,
  onConnectionError?: (provider, error) => void,
});
```

**Features**:
- Manages OAuth popup windows
- Handles postMessage communication
- Auto-refreshes connection status
- Error handling and recovery
- Connection state management

### 4. email-integrations.ts (237 lines)
API client for email integration endpoints.

**Location**: `apps/web/src/lib/api/email-integrations.ts`

**Functions**:
- `getGmailAuthUrl()` - Get Gmail OAuth URL
- `getOutlookAuthUrl()` - Get Outlook OAuth URL
- `getGmailStatus()` - Check Gmail connection status
- `getOutlookStatus()` - Check Outlook connection status
- `disconnectGmail()` - Disconnect Gmail account
- `disconnectOutlook()` - Disconnect Outlook account
- `testGmailConnection()` - Test Gmail connection
- `testOutlookConnection()` - Test Outlook connection
- `searchGmailInvoices()` - Search for invoices in Gmail
- `searchOutlookInvoices()` - Search for invoices in Outlook

### 5. email-callback/page.tsx (150 lines)
OAuth callback handler page.

**Location**: `apps/web/src/app/(dashboard)/integrations/email-callback/page.tsx`

**Functionality**:
- Handles OAuth redirects from Google and Microsoft
- Extracts connection status from URL parameters
- Notifies parent window via postMessage (if popup)
- Auto-closes popup or redirects to appropriate page
- Error handling with user-friendly messages

## Backend Integration

### Gmail Controller
**Endpoint**: `/api/v1/integrations/gmail`

Key endpoints:
- `POST /auth-url` - Generate OAuth URL
- `GET /callback` - Handle OAuth callback
- `GET /status` - Get connection status
- `POST /disconnect` - Disconnect account
- `GET /test` - Test connection
- `GET /messages` - List messages
- `GET /search/invoices` - Search for invoices

### Outlook Controller
**Endpoint**: `/api/v1/integrations/outlook`

Key endpoints:
- `GET /auth-url` - Generate OAuth URL
- `GET /callback` - Handle OAuth callback
- `GET /status` - Get connection status
- `POST /disconnect` - Disconnect account
- `GET /test` - Test connection
- `GET /messages` - List messages
- `GET /search/invoices` - Search for invoices

## OAuth Flow

1. **User clicks "Connect"**
   - `connectGmail()` or `connectOutlook()` is called
   - Opens OAuth popup with authorization URL

2. **User authorizes in popup**
   - Google/Microsoft consent screen
   - User grants permissions

3. **Redirect to callback**
   - Backend exchanges auth code for tokens
   - Tokens encrypted and stored in database
   - Redirects to `/integrations/email-callback?status=connected&email=...`

4. **Callback handler**
   - Extracts connection details
   - Notifies parent window via postMessage
   - Closes popup

5. **Parent window updates**
   - Receives postMessage event
   - Updates connection state
   - Refreshes status from API

## Usage in Onboarding

```tsx
import { EmailStep } from '@/components/onboarding/steps/EmailStep';

// In your onboarding wizard:
<FormProvider {...form}>
  <EmailStep />
</FormProvider>
```

The component integrates with React Hook Form and stores connection data in the form state:

```typescript
// Form data structure:
{
  email: {
    gmail: {
      connected: boolean,
      email: string,
    },
    outlook: {
      connected: boolean,
      email: string,
    },
    skipped: boolean,
  }
}
```

## Styling

The component uses:
- **Shadcn/ui components**: Card, Button, Badge, Alert
- **Lucide icons**: Mail, ShieldCheck, Sparkles, etc.
- **Tailwind CSS**: Utility classes for styling
- **Provider-specific colors**:
  - Gmail: Red theme (`text-red-600`, `bg-red-50`, etc.)
  - Outlook: Blue theme (`text-blue-600`, `bg-blue-50`, etc.)

## Benefits Display

Four key benefits are highlighted:
1. **Automatic extraction** - AI scans inbox for invoices
2. **Never miss documents** - All important docs captured
3. **AI categorization** - Smart expense classification
4. **Payment alerts** - Notifications before due dates

## Privacy & Security

Prominent display of:
- **Read-only access** - Can only read, never send emails
- **Keyword filtering** - Only scans invoice-related emails
- **No storage** - Email content never stored
- **Encryption** - AES-256 token encryption
- **Revocable access** - Users can disconnect anytime
- **Privacy policy link** - Transparent data handling

## Error Handling

The component handles various error scenarios:
- Popup blocked
- OAuth errors
- Network failures
- Token expiration
- Connection failures

Each error displays:
- Clear error message
- Suggested action
- Option to retry

## Testing

To test the component:

1. **Manual Testing**:
   ```bash
   cd apps/web
   npm run dev
   # Navigate to /onboarding
   ```

2. **Test OAuth Flow**:
   - Ensure backend API is running
   - Configure OAuth credentials in `.env`
   - Test with real Google/Microsoft accounts
   - Test popup and redirect modes

3. **Test Error Cases**:
   - Block popups
   - Use invalid credentials
   - Simulate network errors
   - Test token expiration

## Environment Variables

Required in `.env`:

```env
# Gmail OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Outlook OAuth
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3001
```

## Future Enhancements

Potential improvements:
- [ ] Add IMAP/SMTP provider for other email services
- [ ] Show preview of found invoices before connecting
- [ ] Display invoice count after connection
- [ ] Add email folder selection (scan specific folders)
- [ ] Support multiple accounts per provider
- [ ] Add email sync scheduling options
- [ ] Show sync progress/history
- [ ] Add webhook notifications for new invoices

## Related Tasks

- **W32-T1**: Gmail OAuth2 Integration (Backend) - Completed
- **W32-T2**: Microsoft Graph OAuth2 Integration (Backend) - Completed
- **W31-T4**: Email Connection Step (Frontend) - This implementation

## Support

For issues or questions:
1. Check backend logs for OAuth errors
2. Verify OAuth credentials are configured
3. Test with postman/curl directly
4. Check browser console for errors
5. Verify popup blockers are disabled

## Line Counts

- `EmailStep.tsx`: 322 lines
- `EmailProviderCard.tsx`: 187 lines
- `use-email-connection.ts`: 325 lines
- `email-integrations.ts`: 237 lines
- `email-callback/page.tsx`: 150 lines
- **Total**: 1,221 lines

## Dependencies

- `react-hook-form` - Form state management
- `lucide-react` - Icons
- `@/components/ui/*` - Shadcn UI components
- `@/hooks/use-auth` - Authentication state
- `@/lib/api/client` - API client
