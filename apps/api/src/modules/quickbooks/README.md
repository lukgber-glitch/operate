# QuickBooks Online Integration

## Overview

Comprehensive QuickBooks Online (QBO) integration with OAuth2 authentication and bidirectional data synchronization.

## Features

### Authentication
- **OAuth2 with PKCE**: Secure authorization flow with Proof Key for Code Exchange
- **Token Management**: Automatic token refresh, encrypted storage (AES-256-GCM)
- **Multi-Tenant**: Support for multiple organizations

### Data Synchronization
- **Bidirectional Sync**: Data flows both ways between QuickBooks and Operate
- **Sync Modes**:
  - **Full Sync**: Complete data import (initial setup)
  - **Incremental Sync**: Only sync changes since last sync
  - **Real-time Sync**: Webhook-based instant updates (future)

### Supported Entities
- **Customers** (QBO Customer ↔ Operate Client)
- **Invoices** (QBO Invoice ↔ Operate Invoice)
- **Payments** (QBO Payment ↔ Operate Payment)
- **Chart of Accounts** (future)
- **Items/Products** (future)

## Usage Example

```typescript
// Connect to QuickBooks
const { authUrl } = await quickbooksAuthService.generateAuthUrl(orgId);

// Perform full sync
const result = await quickbooksSyncService.performFullSync(orgId, userId);

// Get sync statistics
const stats = await quickbooksSyncService.getSyncStats(orgId);
```

See full documentation in the module source files.
