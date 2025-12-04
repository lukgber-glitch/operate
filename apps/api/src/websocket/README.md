# WebSocket Real-Time Updates

This module provides real-time WebSocket communication using Socket.IO for the Operate platform.

## Overview

The WebSocket implementation enables real-time updates across the application, allowing users to receive instant notifications when data changes without polling or refreshing.

## Architecture

### Backend Components

1. **EventsGateway** (`events.gateway.ts`)
   - Main WebSocket gateway handling connections and event broadcasting
   - Manages organization-scoped rooms for multi-tenancy
   - Supports Redis adapter for horizontal scaling

2. **EventsService** (`events.service.ts`)
   - Service layer for emitting events from other modules
   - Provides typed methods for all event types
   - Used by business logic to broadcast real-time updates

3. **WsJwtGuard** (`ws-jwt.guard.ts`)
   - JWT authentication for WebSocket connections
   - Validates tokens and attaches user data to socket
   - Supports multiple token sources (query, header, auth)

4. **EventsModule** (`events.module.ts`)
   - NestJS module configuration
   - Exports EventsService for use in other modules

### Frontend Components

1. **useWebSocket Hook** (`apps/web/src/hooks/useWebSocket.ts`)
   - React hook for managing WebSocket connections
   - Handles authentication, reconnection, and event subscriptions
   - Provides both general and single-event subscription hooks

2. **Socket Client** (`apps/web/src/lib/websocket/socket-client.ts`)
   - Low-level Socket.IO client configuration
   - Manages connection lifecycle and reconnection logic

## Event Types

All event types are defined in `packages/shared/src/types/websocket.types.ts`:

### Invoice Events
- `invoice:created` - New invoice created
- `invoice:updated` - Invoice updated
- `invoice:paid` - Invoice marked as paid
- `invoice:cancelled` - Invoice cancelled
- `invoice:sent` - Invoice sent to customer
- `invoice:overdue` - Invoice is overdue

### Expense Events
- `expense:created` - New expense created
- `expense:updated` - Expense updated
- `expense:approved` - Expense approved
- `expense:rejected` - Expense rejected
- `expense:deleted` - Expense deleted

### Bank Events
- `bank:transaction_imported` - New transaction imported
- `bank:transactions_synced` - Bank account synced
- `bank:account_connected` - Bank account connected
- `bank:account_disconnected` - Bank account disconnected
- `bank:sync_error` - Bank sync error

### Notification Events
- `notification:new` - New notification
- `notification:read` - Notification marked as read
- `notification:deleted` - Notification deleted

### Document Events
- `document:uploaded` - Document uploaded
- `document:processed` - Document processed
- `document:classification_complete` - AI classification complete
- `document:ocr_complete` - OCR processing complete
- `document:error` - Document processing error

### HR Events
- `hr:employee_added` - New employee added
- `hr:employee_updated` - Employee updated
- `hr:leave_requested` - Leave request submitted
- `hr:leave_approved` - Leave request approved
- `hr:leave_rejected` - Leave request rejected
- `hr:contract_expiring` - Contract expiring soon

### Tax Events
- `tax:return_submitted` - Tax return submitted
- `tax:return_accepted` - Tax return accepted
- `tax:return_rejected` - Tax return rejected
- `tax:filing_due_reminder` - Filing deadline reminder

### Integration Events
- `integration:sync_started` - Integration sync started
- `integration:sync_completed` - Integration sync completed
- `integration:sync_failed` - Integration sync failed
- `integration:connection_established` - Integration connected
- `integration:connection_lost` - Integration disconnected

## Usage

### Backend: Emitting Events

Inject `EventsService` into your module and use typed methods:

```typescript
import { Injectable } from '@nestjs/common';
import { EventsService } from '../websocket/events.service';

@Injectable()
export class InvoiceService {
  constructor(private eventsService: EventsService) {}

  async createInvoice(data: CreateInvoiceDto) {
    const invoice = await this.invoiceRepo.create(data);

    // Emit real-time event
    this.eventsService.emitInvoiceCreated({
      organizationId: invoice.organizationId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    });

    return invoice;
  }

  async markAsPaid(invoiceId: string) {
    const invoice = await this.invoiceRepo.update(invoiceId, {
      status: 'PAID',
      paidAt: new Date(),
    });

    // Emit payment event
    this.eventsService.emitInvoicePaid({
      organizationId: invoice.organizationId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
    });

    return invoice;
  }
}
```

### Frontend: Subscribing to Events

Use the `useWebSocket` hook in your React components:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import { InvoiceEvent, InvoiceEventPayload } from '@operate/shared';

export function InvoiceList() {
  const { connected, subscribe } = useWebSocket();
  const { refetch } = useInvoices();

  useEffect(() => {
    const unsubscribers = [
      subscribe<InvoiceEventPayload>(InvoiceEvent.CREATED, (data) => {
        console.log('New invoice:', data);
        refetch(); // Refresh invoice list
      }),

      subscribe<InvoiceEventPayload>(InvoiceEvent.PAID, (data) => {
        console.log('Invoice paid:', data);
        refetch();
        toast.success(`Invoice ${data.invoiceNumber} paid!`);
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, refetch]);

  return <div>Invoice List (Live: {connected ? '✓' : '✗'})</div>;
}
```

## Authentication

WebSocket connections require JWT authentication. The token can be provided via:

1. **Query parameter**: `?token=YOUR_JWT_TOKEN`
2. **Authorization header**: `Authorization: Bearer YOUR_JWT_TOKEN`
3. **Auth object**: `{ auth: { token: 'YOUR_JWT_TOKEN' } }`

The frontend hook automatically extracts the token from cookies or localStorage.

## Multi-Tenancy & Security

- Users are automatically joined to their organization's room upon connection
- Events are scoped to organizations - users only receive events for their org
- JWT validation ensures only authenticated users can connect
- User data is attached to the socket for authorization checks

## Scaling with Redis

For multi-instance deployments, configure Redis adapter:

1. Install Redis adapter:
```bash
pnpm add @socket.io/redis-adapter redis --filter @operate/api
```

2. Set Redis environment variables:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

3. The gateway automatically detects Redis configuration and sets up the adapter

## Testing

### Manual Testing

1. Start the backend:
```bash
cd apps/api
pnpm dev
```

2. Start the frontend:
```bash
cd apps/web
pnpm dev
```

3. Open browser console and monitor WebSocket events
4. Trigger actions (create invoice, etc.) and verify events are received

### Automated Testing

TODO: Add tests for WebSocket functionality

## Troubleshooting

### Connection Issues

- **Verify JWT token**: Check that token is valid and not expired
- **Check CORS settings**: Ensure frontend origin is allowed in gateway config
- **Network/Firewall**: Verify WebSocket ports are accessible
- **Redis connection**: If using Redis adapter, ensure Redis is running

### Events Not Received

- **Organization mismatch**: Verify user is in correct organization
- **Event subscription**: Ensure you've subscribed to the event type
- **Room management**: Check that user was properly joined to org room

## Future Enhancements

- [ ] Message queuing for offline users
- [ ] Event replay/history
- [ ] Binary data support for file transfers
- [ ] WebSocket metrics and monitoring
- [ ] Rate limiting per connection
- [ ] Custom event filters
