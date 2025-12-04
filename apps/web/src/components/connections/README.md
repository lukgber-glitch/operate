# Connection Components

This directory contains the UI components for managing integrations in the Settings page.

## Components

### ConnectionStatus.tsx
Status badge component displaying the current state of an integration.

**Variants:**
- `connected` - Green badge with checkmark (active connection)
- `disconnected` - Gray badge with X icon
- `pending` - Yellow outline with clock icon
- `syncing` - Blue outline with spinning refresh icon
- `error` - Red badge with alert icon
- `expired` - Orange outline with alert icon

**Usage:**
```tsx
<ConnectionStatus status="connected" />
```

### ConnectionCard.tsx
Individual integration card showing provider info, status, and actions.

**Features:**
- Provider logo/icon display
- Status badge
- Last sync timestamp
- Expandable connected accounts list
- Action buttons: Sync Now, Details, Reconnect, Disconnect

**Usage:**
```tsx
<ConnectionCard
  integration={integration}
  onDisconnect={handleDisconnect}
  onReconnect={handleReconnect}
  onSyncNow={handleSyncNow}
  onViewDetails={handleViewDetails}
/>
```

### ConnectionGrid.tsx
Grid layout organizing integration cards by category.

**Categories:**
- Banking (Plaid, FinAPI, etc.)
- Email (Gmail, Outlook, IMAP)
- Accounting (DATEV, lexoffice, QuickBooks)
- Tax (ELSTER, FinanzOnline, VIES)
- Storage (Google Drive, Dropbox, S3)

**Features:**
- Category headers with descriptions
- "Add Connection" button per category
- Responsive grid layout (1-3 columns)
- Empty state for categories with no connections

**Usage:**
```tsx
<ConnectionGrid
  integrations={integrations}
  onAddConnection={handleAddConnection}
  onDisconnect={handleDisconnect}
  onReconnect={handleReconnect}
  onSyncNow={handleSyncNow}
  onViewDetails={handleViewDetails}
/>
```

### AddConnectionDialog.tsx
Modal dialog for adding new integrations.

**Features:**
- Category-filtered provider list
- Provider selection interface
- OAuth flow initiation
- "Coming Soon" badges for unavailable providers

**Usage:**
```tsx
<AddConnectionDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  type="banking"
  onConnect={handleConnect}
/>
```

### ConnectionDetails.tsx
Detailed view of an integration with history and logs.

**Sections:**
- Integration header with status
- Connected accounts list
- Sync history timeline
- Error logs (if any)
- Configuration settings

**Usage:**
```tsx
<ConnectionDetails
  integration={integration}
  syncHistory={syncHistory}
  errorLogs={errorLogs}
  configuration={configuration}
/>
```

## API Integration

The components expect the following API endpoints:

### GET /api/connection-hub/integrations
Fetch all integrations for the current user.

**Response:**
```json
[
  {
    "id": "string",
    "provider": "string",
    "name": "string",
    "status": "connected" | "disconnected" | "pending" | "syncing" | "error" | "expired",
    "lastSync": "ISO8601 datetime",
    "logo": "string (optional)",
    "connectedAccounts": [
      {
        "id": "string",
        "name": "string",
        "type": "string (optional)"
      }
    ],
    "error": "string (optional)"
  }
]
```

### GET /api/connection-hub/integrations/:id
Fetch details for a specific integration.

### POST /api/connection-hub/connect
Initiate a new connection.

**Request:**
```json
{
  "providerId": "string"
}
```

**Response:**
```json
{
  "authUrl": "string (optional - OAuth URL)"
}
```

### DELETE /api/connection-hub/integrations/:id
Disconnect an integration.

### POST /api/connection-hub/integrations/:id/reconnect
Reconnect an integration (OAuth refresh).

### POST /api/connection-hub/integrations/:id/sync
Trigger immediate sync for an integration.

### GET /api/connection-hub/integrations/:id/sync-history
Fetch sync history for an integration.

### GET /api/connection-hub/integrations/:id/error-logs
Fetch error logs for an integration.

### GET /api/connection-hub/integrations/:id/configuration
Fetch configuration settings for an integration.

## Pages

### /settings/connections
Main connections page using ConnectionGrid.

### /settings/connections/[id]
Individual connection details page.

## Development

Mock data is provided in the page components for development/testing when API endpoints are not available.

To test without backend:
1. The components will use mock data if API calls fail
2. Mock integrations include examples of all status types
3. Mock sync history and error logs are generated for detail view

## Styling

All components use shadcn/ui components and Tailwind CSS:
- Card, Badge, Button, Dialog from shadcn/ui
- Responsive grid layouts
- Dark mode support via Tailwind classes
- Lucide icons for UI elements
