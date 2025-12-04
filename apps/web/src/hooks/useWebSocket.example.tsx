/**
 * WebSocket Usage Examples
 * Demonstrates how to use the useWebSocket hook in various scenarios
 *
 * This file is for documentation purposes and can be deleted in production
 */

import { useEffect } from 'react';
import { useWebSocket, useWebSocketEvent } from './useWebSocket';
import {
  InvoiceEvent,
  ExpenseEvent,
  NotificationEvent,
  BankEvent,
  InvoiceEventPayload,
  ExpenseEventPayload,
  NotificationEventPayload,
  BankEventPayload,
} from '@operate/shared';

/**
 * Example 1: Basic WebSocket connection with single event subscription
 */
export function InvoiceNotifications() {
  const { connected, subscribe } = useWebSocket({
    onConnect: () => console.log('Connected to real-time updates'),
    onDisconnect: () => console.log('Disconnected from real-time updates'),
  });

  useEffect(() => {
    const unsubscribe = subscribe<InvoiceEventPayload>(
      InvoiceEvent.PAID,
      (data) => {
        console.log('Invoice paid:', data);
        // Show toast notification
        // Update invoice list
        // Refresh dashboard
      }
    );

    return unsubscribe;
  }, [subscribe]);

  return (
    <div>
      Status: {connected ? 'Connected' : 'Disconnected'}
    </div>
  );
}

/**
 * Example 2: Multiple event subscriptions
 */
export function FinanceDashboard() {
  const { connected, subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers = [
      // Invoice events
      subscribe<InvoiceEventPayload>(InvoiceEvent.CREATED, (data) => {
        console.log('New invoice:', data);
        // Refresh invoice list
      }),
      subscribe<InvoiceEventPayload>(InvoiceEvent.PAID, (data) => {
        console.log('Invoice paid:', data);
        // Update dashboard metrics
      }),

      // Expense events
      subscribe<ExpenseEventPayload>(ExpenseEvent.CREATED, (data) => {
        console.log('New expense:', data);
        // Refresh expense list
      }),

      // Bank events
      subscribe<BankEventPayload>(BankEvent.TRANSACTION_IMPORTED, (data) => {
        console.log('New transaction:', data);
        // Refresh transaction list
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe]);

  if (!connected) {
    return <div>Connecting to real-time updates...</div>;
  }

  return (
    <div>
      {/* Your dashboard content */}
      <h1>Finance Dashboard</h1>
      <p>Real-time updates enabled</p>
    </div>
  );
}

/**
 * Example 3: Using the simplified useWebSocketEvent hook
 */
export function NotificationBell() {
  const handleNewNotification = (data: NotificationEventPayload) => {
    console.log('New notification:', data);
    // Show notification toast
    // Play sound
    // Update notification badge
  };

  const { connected } = useWebSocketEvent(
    NotificationEvent.NEW,
    handleNewNotification
  );

  return (
    <button>
      Notifications {connected && '(Live)'}
    </button>
  );
}

/**
 * Example 4: Custom connection handling with manual control
 */
export function AdminPanel() {
  const { connected, connect, disconnect, subscribe } = useWebSocket({
    autoConnect: false, // Don't auto-connect
  });

  // Manual connect/disconnect
  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe<InvoiceEventPayload>(
      InvoiceEvent.CREATED,
      (data) => {
        console.log('Invoice created:', data);
      }
    );

    return unsubscribe;
  }, [connected, subscribe]);

  return (
    <div>
      <button onClick={handleConnect} disabled={connected}>
        Connect
      </button>
      <button onClick={handleDisconnect} disabled={!connected}>
        Disconnect
      </button>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}

/**
 * Example 5: Integration with React Query for data refetching
 */
export function InvoiceList() {
  const { subscribe } = useWebSocket();

  // Assume you have React Query hooks like this
  // const { refetch: refetchInvoices } = useInvoices();

  useEffect(() => {
    const unsubscribers = [
      subscribe<InvoiceEventPayload>(InvoiceEvent.CREATED, () => {
        // refetchInvoices();
        console.log('Refetching invoices...');
      }),
      subscribe<InvoiceEventPayload>(InvoiceEvent.UPDATED, () => {
        // refetchInvoices();
        console.log('Refetching invoices...');
      }),
      subscribe<InvoiceEventPayload>(InvoiceEvent.PAID, () => {
        // refetchInvoices();
        console.log('Refetching invoices...');
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe]);

  return (
    <div>
      {/* Invoice list content */}
    </div>
  );
}

/**
 * Example 6: Emitting events (for client-to-server communication)
 */
export function EventEmitterExample() {
  const { connected, emit, subscribe } = useWebSocket();

  const handleSubscribeToEvents = () => {
    if (connected) {
      emit('subscribe', {
        events: [
          InvoiceEvent.CREATED,
          InvoiceEvent.PAID,
          ExpenseEvent.CREATED,
        ],
      });
    }
  };

  const handleUnsubscribeFromEvents = () => {
    if (connected) {
      emit('unsubscribe', {
        events: [InvoiceEvent.CREATED],
      });
    }
  };

  return (
    <div>
      <button onClick={handleSubscribeToEvents} disabled={!connected}>
        Subscribe to Events
      </button>
      <button onClick={handleUnsubscribeFromEvents} disabled={!connected}>
        Unsubscribe from Events
      </button>
    </div>
  );
}
