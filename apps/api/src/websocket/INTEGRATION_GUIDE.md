# WebSocket Integration Guide

This guide shows how to integrate WebSocket events into your existing modules.

## Step 1: Import EventsModule in Your Feature Module

Add `EventsModule` to your module's imports:

```typescript
// apps/api/src/modules/finance/finance.module.ts
import { Module } from '@nestjs/common';
import { EventsModule } from '../../websocket/events.module';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [
    EventsModule, // Import WebSocket module
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class FinanceModule {}
```

## Step 2: Inject EventsService in Your Service

```typescript
// apps/api/src/modules/finance/invoice.service.ts
import { Injectable } from '@nestjs/common';
import { EventsService } from '../../websocket/events.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService, // Inject EventsService
  ) {}

  async createInvoice(userId: string, data: CreateInvoiceDto) {
    // Get user's organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        ...data,
        organizationId: user.organizationId,
      },
    });

    // Emit WebSocket event
    this.eventsService.emitInvoiceCreated({
      organizationId: user.organizationId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    });

    return invoice;
  }

  async markInvoiceAsPaid(invoiceId: string) {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Emit payment event
    this.eventsService.emitInvoicePaid({
      organizationId: invoice.organizationId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
    });

    // Also send a notification
    this.eventsService.emitNotification({
      organizationId: invoice.organizationId,
      notificationId: 'generated-id',
      title: 'Invoice Paid',
      message: `Invoice ${invoice.number} has been marked as paid`,
      type: 'success',
    });

    return invoice;
  }
}
```

## Step 3: Frontend Integration

### Option A: Using React Query for Auto-Refetch

```typescript
// apps/web/src/app/invoices/page.tsx
'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useInvoices } from '@/hooks/useInvoices'; // Your React Query hook
import { InvoiceEvent, InvoiceEventPayload } from '@operate/shared';

export default function InvoicesPage() {
  const { data: invoices, refetch } = useInvoices();
  const { connected, subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers = [
      subscribe<InvoiceEventPayload>(InvoiceEvent.CREATED, () => {
        refetch(); // Auto-refresh when new invoice created
      }),

      subscribe<InvoiceEventPayload>(InvoiceEvent.UPDATED, () => {
        refetch(); // Auto-refresh when invoice updated
      }),

      subscribe<InvoiceEventPayload>(InvoiceEvent.PAID, (data) => {
        refetch(); // Auto-refresh when invoice paid
        toast.success(`Invoice ${data.invoiceNumber} has been paid!`);
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, refetch]);

  return (
    <div>
      <h1>Invoices {connected && <span className="text-green-500">● Live</span>}</h1>
      {/* Render invoices */}
    </div>
  );
}
```

### Option B: Using Zustand for State Management

```typescript
// apps/web/src/store/invoiceStore.ts
import { create } from 'zustand';
import { InvoiceEventPayload } from '@operate/shared';

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  markAsPaid: (id: string) => void;
}

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  invoices: [],
  addInvoice: (invoice) =>
    set((state) => ({ invoices: [...state.invoices, invoice] })),
  updateInvoice: (id, data) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, ...data } : inv
      ),
    })),
  markAsPaid: (id) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, status: 'PAID', paidAt: new Date() } : inv
      ),
    })),
}));

// Component
export function InvoiceList() {
  const { invoices, addInvoice, updateInvoice, markAsPaid } = useInvoiceStore();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers = [
      subscribe<InvoiceEventPayload>(InvoiceEvent.CREATED, (data) => {
        // Fetch the full invoice and add to store
        fetch(`/api/invoices/${data.invoiceId}`)
          .then(res => res.json())
          .then(invoice => addInvoice(invoice));
      }),

      subscribe<InvoiceEventPayload>(InvoiceEvent.PAID, (data) => {
        markAsPaid(data.invoiceId);
        toast.success(`Invoice ${data.invoiceNumber} paid!`);
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, addInvoice, markAsPaid]);

  // Render invoices...
}
```

## Step 4: Common Integration Patterns

### Pattern 1: Toast Notifications

```typescript
import { useToast } from '@/components/ui/use-toast';

export function useInvoiceNotifications() {
  const { toast } = useToast();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers = [
      subscribe<InvoiceEventPayload>(InvoiceEvent.PAID, (data) => {
        toast({
          title: 'Invoice Paid',
          description: `Invoice ${data.invoiceNumber} - ${data.currency} ${data.amount}`,
        });
      }),

      subscribe<InvoiceEventPayload>(InvoiceEvent.OVERDUE, (data) => {
        toast({
          title: 'Invoice Overdue',
          description: `Invoice ${data.invoiceNumber} is overdue`,
          variant: 'destructive',
        });
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, toast]);
}
```

### Pattern 2: Live Badge/Indicator

```typescript
export function LiveIndicator() {
  const { connected } = useWebSocket();

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-sm">{connected ? 'Live' : 'Offline'}</span>
    </div>
  );
}
```

### Pattern 3: Optimistic Updates with Rollback

```typescript
export function useOptimisticInvoice() {
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();

  const createInvoice = useMutation({
    mutationFn: (data: CreateInvoiceDto) => api.post('/invoices', data),

    // Optimistic update
    onMutate: async (newInvoice) => {
      await queryClient.cancelQueries(['invoices']);
      const previous = queryClient.getQueryData(['invoices']);

      queryClient.setQueryData(['invoices'], (old: any) => [
        ...old,
        { ...newInvoice, id: 'temp-id', status: 'PENDING' }
      ]);

      return { previous };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['invoices'], context.previous);
    },
  });

  // Listen for WebSocket confirmation
  useEffect(() => {
    const unsubscribe = subscribe<InvoiceEventPayload>(
      InvoiceEvent.CREATED,
      (data) => {
        queryClient.invalidateQueries(['invoices']);
      }
    );

    return unsubscribe;
  }, [subscribe, queryClient]);

  return { createInvoice };
}
```

## Best Practices

1. **Always cleanup subscriptions**: Use the unsubscribe function in useEffect cleanup
2. **Handle disconnections gracefully**: Show connection status to users
3. **Don't over-refetch**: Use debouncing or batch updates if needed
4. **Organization scoping**: Events are automatically scoped to organizations
5. **Error handling**: Wrap event handlers in try-catch for production
6. **Type safety**: Always use TypeScript types from @operate/shared
7. **Performance**: Consider using React.memo for components that re-render on events

## Testing WebSocket Events

### Backend Unit Test

```typescript
// invoice.service.spec.ts
describe('InvoiceService', () => {
  let service: InvoiceService;
  let eventsService: EventsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: EventsService,
          useValue: {
            emitInvoiceCreated: jest.fn(),
            emitInvoicePaid: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should emit event when invoice is created', async () => {
    const invoice = await service.createInvoice(userId, createDto);

    expect(eventsService.emitInvoiceCreated).toHaveBeenCalledWith({
      organizationId: expect.any(String),
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    });
  });
});
```

### Frontend Integration Test

```typescript
// invoice-list.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { useWebSocket } from '@/hooks/useWebSocket';
import { InvoiceEvent } from '@operate/shared';

jest.mock('@/lib/websocket/socket-client');

describe('Invoice WebSocket Integration', () => {
  it('should refetch invoices on creation event', () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useWebSocket());

    // Subscribe to event
    result.current.subscribe(InvoiceEvent.CREATED, refetch);

    // Simulate event
    mockSocket.emit(InvoiceEvent.CREATED, {
      organizationId: 'org-1',
      invoiceId: 'inv-1',
      timestamp: new Date(),
    });

    expect(refetch).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Events not received
- Verify WebSocket connection is established (`connected === true`)
- Check that you're subscribed to the correct event type
- Ensure organizationId matches your current organization
- Check browser console for WebSocket errors

### Multiple duplicate events
- Make sure you're cleaning up subscriptions in useEffect
- Check that you're not subscribing multiple times
- Verify dependencies array in useEffect is correct

### Connection drops frequently
- Check network stability
- Verify JWT token expiration
- Check server logs for disconnection reasons
- Consider adjusting reconnection settings

## Next Steps

- See `apps/web/src/hooks/useWebSocket.example.tsx` for more examples
- Read `apps/api/src/websocket/README.md` for architecture details
- Check event types in `packages/shared/src/types/websocket.types.ts`
