# Real-Time Suggestion Updates (SSE)

## Overview

The `useSuggestionStream` hook provides Server-Sent Events (SSE) integration for real-time suggestions, notifications, and updates in the Operate/CoachOS platform.

## Features

- ✅ **Auto-reconnection** with exponential backoff
- ✅ **Heartbeat monitoring** to detect stale connections
- ✅ **Event parsing** with TypeScript types
- ✅ **Connection state management**
- ✅ **Manual reconnect/disconnect** controls
- ✅ **Error handling** with callbacks
- ✅ **Accumulated suggestions** state
- ✅ **Token-based authentication**

## Quick Start

### Basic Usage

```tsx
import { useSuggestionStream } from '@/hooks/useSuggestionStream';

function MyComponent() {
  const {
    isConnected,
    lastEvent,
    suggestions,
    connectionState
  } = useSuggestionStream({
    onEvent: (event) => {
      console.log('New event:', event);
    },
  });

  return (
    <div>
      <p>Status: {connectionState}</p>
      <p>Suggestions: {suggestions.length}</p>
    </div>
  );
}
```

### With Provider (Recommended)

Wrap your app with `SuggestionStreamProvider` for automatic integration with chat store:

```tsx
// app/layout.tsx
import { SuggestionStreamProvider } from '@/components/chat/SuggestionStreamProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SuggestionStreamProvider
          showConnectionStatus={true}
          statusPosition="bottom-right"
          showToasts={true}
        >
          {children}
        </SuggestionStreamProvider>
      </body>
    </html>
  );
}
```

Then access the stream context anywhere:

```tsx
import { useSuggestionStreamContext } from '@/components/chat/SuggestionStreamProvider';

function ChatInterface() {
  const { isConnected, suggestions, reconnect } = useSuggestionStreamContext();

  return (
    <div>
      {!isConnected && (
        <button onClick={reconnect}>Reconnect</button>
      )}
      <SuggestionList suggestions={suggestions} />
    </div>
  );
}
```

## Event Types

### `new_transaction`

Fired when a new transaction is detected:

```typescript
{
  type: 'new_transaction',
  data: {
    id: string,
    amount: number,
    currency: string,
    description: string,
    date: string,
    category?: string,
    needsReview?: boolean,
  }
}
```

### `deadline_approaching`

Fired when a deadline is approaching:

```typescript
{
  type: 'deadline_approaching',
  data: {
    id: string,
    title: string,
    dueDate: string,
    type: 'tax' | 'report' | 'payment' | 'compliance',
    priority: 'low' | 'medium' | 'high' | 'urgent',
    daysRemaining: number,
  }
}
```

### `ai_suggestion`

Fired when AI generates a suggestion:

```typescript
{
  type: 'ai_suggestion',
  data: {
    id: string,
    type: 'classification' | 'deduction' | 'optimization' | 'alert',
    title: string,
    description: string,
    confidence: number,
    actionable: boolean,
    metadata?: Record<string, unknown>,
  }
}
```

### `bank_sync_complete`

Fired when bank synchronization completes:

```typescript
{
  type: 'bank_sync_complete',
  data: {
    accountId: string,
    count: number,
  }
}
```

### `invoice_extracted`

Fired when an invoice is extracted from a document:

```typescript
{
  type: 'invoice_extracted',
  data: {
    id: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    issuer: string,
    date: string,
    extractedFields: Record<string, unknown>,
  }
}
```

### `ping`

Heartbeat event to keep connection alive:

```typescript
{
  type: 'ping',
  data: {
    timestamp: number,
  }
}
```

## Configuration Options

```typescript
interface UseSuggestionStreamOptions {
  // Callback fired when a new event is received
  onEvent?: (event: SuggestionEvent) => void;

  // Callback fired when an error occurs
  onError?: (error: Error) => void;

  // Whether to automatically connect on mount (default: true)
  autoConnect?: boolean;

  // Base URL for the API (defaults to current origin)
  baseUrl?: string;

  // Maximum number of reconnection attempts (0 = infinite, default: 0)
  maxReconnectAttempts?: number;

  // Initial reconnection delay in milliseconds (default: 1000)
  initialReconnectDelay?: number;

  // Maximum reconnection delay in milliseconds (default: 30000)
  maxReconnectDelay?: number;

  // Heartbeat timeout in milliseconds (default: 60000)
  heartbeatTimeout?: number;
}
```

## Return Values

```typescript
interface UseSuggestionStreamReturn {
  // Whether the SSE connection is currently connected
  isConnected: boolean;

  // The last event received
  lastEvent: SuggestionEvent | null;

  // Current suggestions array (accumulated from events)
  suggestions: Suggestion[];

  // Current connection state
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';

  // Manually trigger reconnection
  reconnect: () => void;

  // Manually disconnect
  disconnect: () => void;

  // Number of reconnection attempts made
  reconnectAttempts: number;

  // Last error encountered
  lastError: Error | null;
}
```

## Reconnection Behavior

The hook automatically handles reconnection with exponential backoff:

1. **Initial delay**: 1 second (configurable)
2. **Backoff multiplier**: 2x on each attempt
3. **Max delay**: 30 seconds (configurable)
4. **Jitter**: ±10% to prevent thundering herd

Example progression:
- Attempt 1: ~1s
- Attempt 2: ~2s
- Attempt 3: ~4s
- Attempt 4: ~8s
- Attempt 5: ~16s
- Attempt 6+: ~30s (capped)

## Heartbeat Monitoring

The hook monitors heartbeat via `ping` events:

- Default timeout: 60 seconds
- Automatically reconnects if no ping received
- Resets timer on any incoming event

## Error Handling

```tsx
const { lastError, connectionState } = useSuggestionStream({
  onError: (error) => {
    // Log to monitoring service
    console.error('SSE Error:', error);

    // Show user notification
    toast.error('Connection lost', {
      description: error.message,
    });
  },
});

if (connectionState === 'error') {
  return <ErrorState error={lastError} />;
}
```

## Backend Requirements

The backend must implement the `/api/v1/suggestions/stream` endpoint:

```typescript
// NestJS example
@Get('stream')
@Sse()
async streamSuggestions(
  @Query('token') token: string,
): Observable<MessageEvent> {
  // Validate token
  const user = await this.authService.validateToken(token);

  return interval(1000).pipe(
    map(() => ({
      data: JSON.stringify({
        type: 'ping',
        data: { timestamp: Date.now() },
      }),
    })),
    // Merge with actual events from Redis/EventEmitter
  );
}
```

### Event Format

All events must be valid JSON strings in SSE format:

```
data: {"type":"ai_suggestion","data":{"id":"123","title":"...",}}

data: {"type":"ping","data":{"timestamp":1234567890}}

```

## Connection Status Indicator

Use the `ConnectionStatus` component to show connection state:

```tsx
import { ConnectionStatus } from '@/components/suggestions/ConnectionStatus';

function MyApp() {
  const { connectionState, reconnectAttempts, reconnect } = useSuggestionStream();

  return (
    <>
      <MyContent />
      <ConnectionStatus
        state={connectionState}
        reconnectAttempts={reconnectAttempts}
        position="bottom-right"
        onReconnect={reconnect}
      />
    </>
  );
}
```

Or use the compact badge version:

```tsx
import { ConnectionBadge } from '@/components/suggestions/ConnectionStatus';

function Header() {
  const { connectionState } = useSuggestionStreamContext();

  return (
    <header>
      <h1>Dashboard</h1>
      <ConnectionBadge state={connectionState} />
    </header>
  );
}
```

## Testing

### Mock SSE Server

```typescript
// test/mocks/sse-server.ts
export class MockSSEServer {
  private clients: Set<Response> = new Set();

  broadcast(event: SuggestionEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    this.clients.forEach(client => {
      client.write(data);
    });
  }

  sendHeartbeat() {
    this.broadcast({
      type: 'ping',
      data: { timestamp: Date.now() },
    });
  }
}
```

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSuggestionStream } from '@/hooks/useSuggestionStream';

describe('useSuggestionStream', () => {
  it('connects on mount', async () => {
    const { result } = renderHook(() => useSuggestionStream());

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
    });
  });

  it('receives events', async () => {
    const onEvent = jest.fn();
    const { result } = renderHook(() =>
      useSuggestionStream({ onEvent })
    );

    // Simulate server sending event
    mockSSEServer.broadcast({
      type: 'ai_suggestion',
      data: { id: '1', title: 'Test' },
    });

    await waitFor(() => {
      expect(onEvent).toHaveBeenCalled();
    });
  });
});
```

## Troubleshooting

### Connection fails immediately

- Check that auth token is present
- Verify SSE endpoint is correct
- Check CORS configuration on backend

### No heartbeat received

- Backend must send `ping` events every ~30s
- Check that events are formatted correctly
- Verify EventSource is not being blocked

### Reconnection loop

- Check backend logs for errors
- Verify token is still valid
- Ensure backend returns proper SSE headers

### Memory leak

- Ensure component unmounts properly
- Check that EventSource is closed on unmount
- Verify no lingering event listeners

## Performance Considerations

- **Event throttling**: Consider debouncing high-frequency events
- **Suggestion limit**: Cap accumulated suggestions array
- **Cleanup**: Always disconnect on unmount
- **Token refresh**: Handle token expiration gracefully

## Security

- ✅ Token passed via query string (consider upgrading to SSE with `Authorization` header if supported)
- ✅ HTTPS required in production
- ✅ Token rotation on expiration
- ✅ Rate limiting on backend
- ✅ Input validation on events

## Further Reading

- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [NestJS SSE Documentation](https://docs.nestjs.com/techniques/server-sent-events)
