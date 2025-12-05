'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * Suggestion Event Types
 */
export type SuggestionEvent =
  | { type: 'new_transaction'; data: Transaction }
  | { type: 'deadline_approaching'; data: Deadline }
  | { type: 'ai_suggestion'; data: Suggestion }
  | { type: 'bank_sync_complete'; data: { accountId: string; count: number } }
  | { type: 'invoice_extracted'; data: ExtractedInvoice }
  | { type: 'ping'; data: { timestamp: number } };

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
  needsReview?: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  type: 'tax' | 'report' | 'payment' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  daysRemaining: number;
}

export interface Suggestion {
  id: string;
  type: 'classification' | 'deduction' | 'optimization' | 'alert';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata?: Record<string, unknown>;
}

export interface ExtractedInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issuer: string;
  date: string;
  extractedFields: Record<string, unknown>;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseSuggestionStreamOptions {
  /**
   * Callback fired when a new event is received
   */
  onEvent?: (event: SuggestionEvent) => void;

  /**
   * Callback fired when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Whether to automatically connect on mount
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Base URL for the API (defaults to current origin)
   */
  baseUrl?: string;

  /**
   * Maximum number of reconnection attempts (0 = infinite)
   * @default 0
   */
  maxReconnectAttempts?: number;

  /**
   * Initial reconnection delay in milliseconds
   * @default 1000
   */
  initialReconnectDelay?: number;

  /**
   * Maximum reconnection delay in milliseconds
   * @default 30000
   */
  maxReconnectDelay?: number;

  /**
   * Heartbeat timeout in milliseconds (disconnect if no ping received)
   * @default 60000
   */
  heartbeatTimeout?: number;
}

export interface UseSuggestionStreamReturn {
  /**
   * Whether the SSE connection is currently connected
   */
  isConnected: boolean;

  /**
   * The last event received
   */
  lastEvent: SuggestionEvent | null;

  /**
   * Current suggestions array (accumulated from events)
   */
  suggestions: Suggestion[];

  /**
   * Current connection state
   */
  connectionState: ConnectionState;

  /**
   * Manually trigger reconnection
   */
  reconnect: () => void;

  /**
   * Manually disconnect
   */
  disconnect: () => void;

  /**
   * Number of reconnection attempts made
   */
  reconnectAttempts: number;

  /**
   * Last error encountered
   */
  lastError: Error | null;
}

/**
 * Custom hook for subscribing to Server-Sent Events for real-time suggestions
 *
 * @example
 * ```tsx
 * const { isConnected, lastEvent, suggestions, connectionState } = useSuggestionStream({
 *   onEvent: (event) => {
 *     console.log('New event:', event);
 *   },
 *   onError: (error) => {
 *     console.error('SSE error:', error);
 *   },
 * });
 * ```
 */
export function useSuggestionStream(
  options: UseSuggestionStreamOptions = {}
): UseSuggestionStreamReturn {
  const {
    onEvent,
    onError,
    autoConnect = true,
    baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
    maxReconnectAttempts = 0,
    initialReconnectDelay = 1000,
    maxReconnectDelay = 30000,
    heartbeatTimeout = 60000,
  } = options;

  const { isAuthenticated } = useAuth();
  // Note: SSE uses cookies for auth (withCredentials:true on EventSource polyfill)
  // The backend should validate session cookies instead of URL tokens

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastEvent, setLastEvent] = useState<SuggestionEvent | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Refs for cleanup and reconnection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const shouldConnectRef = useRef(autoConnect);

  /**
   * Reset heartbeat timer
   */
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('[SSE] Heartbeat timeout - reconnecting');
      reconnect();
    }, heartbeatTimeout);
  }, [heartbeatTimeout]);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(
    (attempt: number): number => {
      const delay = Math.min(
        initialReconnectDelay * Math.pow(2, attempt),
        maxReconnectDelay
      );
      // Add jitter to prevent thundering herd
      const jitter = delay * 0.1 * Math.random();
      return delay + jitter;
    },
    [initialReconnectDelay, maxReconnectDelay]
  );

  /**
   * Handle incoming SSE message
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const parsedEvent: SuggestionEvent = JSON.parse(event.data);

        // Reset heartbeat on any message
        resetHeartbeat();

        // Update last event
        setLastEvent(parsedEvent);

        // Handle specific event types
        if (parsedEvent.type === 'ai_suggestion') {
          setSuggestions((prev) => {
            // Check if suggestion already exists
            const existingIndex = prev.findIndex((s) => s.id === parsedEvent.data.id);
            if (existingIndex >= 0) {
              // Update existing
              const updated = [...prev];
              updated[existingIndex] = parsedEvent.data;
              return updated;
            } else {
              // Add new
              return [...prev, parsedEvent.data];
            }
          });
        }

        // Ignore ping events from callback
        if (parsedEvent.type !== 'ping' && onEvent) {
          onEvent(parsedEvent);
        }
      } catch (error) {
        console.error('[SSE] Failed to parse event:', error);
        const parseError = error instanceof Error ? error : new Error('Failed to parse SSE event');
        setLastError(parseError);
        if (onError) {
          onError(parseError);
        }
      }
    },
    [onEvent, onError, resetHeartbeat]
  );

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Check if we should connect
    if (!shouldConnectRef.current) {
      return;
    }

    // Check for authentication
    if (!isAuthenticated) {
      console.warn('[SSE] Not authenticated, skipping connection');
      return;
    }

    isConnectingRef.current = true;
    setConnectionState('connecting');

    try {
      // Construct SSE URL - auth is handled via cookies
      const url = new URL('/api/v1/suggestions/stream', baseUrl);

      console.log('[SSE] Connecting to:', url.toString());

      const eventSource = new EventSource(url.toString());

      eventSource.onopen = () => {
        console.log('[SSE] Connection established');
        setConnectionState('connected');
        setReconnectAttempts(0);
        setLastError(null);
        isConnectingRef.current = false;
        resetHeartbeat();
      };

      eventSource.onmessage = handleMessage;

      eventSource.onerror = (event) => {
        console.error('[SSE] Connection error:', event);
        const error = new Error('SSE connection error');
        setLastError(error);
        setConnectionState('error');
        isConnectingRef.current = false;

        if (onError) {
          onError(error);
        }

        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection if enabled
        if (shouldConnectRef.current) {
          if (maxReconnectAttempts === 0 || reconnectAttempts < maxReconnectAttempts) {
            const delay = getReconnectDelay(reconnectAttempts);
            console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts((prev) => prev + 1);
              connect();
            }, delay);
          } else {
            console.error('[SSE] Max reconnection attempts reached');
            setConnectionState('disconnected');
            shouldConnectRef.current = false;
          }
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      const connectionError = error instanceof Error ? error : new Error('Failed to create SSE connection');
      setLastError(connectionError);
      setConnectionState('error');
      isConnectingRef.current = false;

      if (onError) {
        onError(connectionError);
      }
    }
  }, [
    isAuthenticated,
    baseUrl,
    handleMessage,
    onError,
    maxReconnectAttempts,
    reconnectAttempts,
    getReconnectDelay,
    resetHeartbeat,
  ]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    console.log('[SSE] Disconnecting');
    shouldConnectRef.current = false;

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear heartbeat timeout
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionState('disconnected');
    isConnectingRef.current = false;
  }, []);

  /**
   * Manually trigger reconnection
   */
  const reconnect = useCallback(() => {
    console.log('[SSE] Manual reconnect triggered');
    disconnect();
    setReconnectAttempts(0);
    shouldConnectRef.current = true;
    connect();
  }, [disconnect, connect]);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, connect, disconnect]);

  /**
   * Reconnect when authentication changes
   */
  useEffect(() => {
    if (shouldConnectRef.current && isAuthenticated) {
      reconnect();
    }
  }, [isAuthenticated, reconnect]);

  return {
    isConnected: connectionState === 'connected',
    lastEvent,
    suggestions,
    connectionState,
    reconnect,
    disconnect,
    reconnectAttempts,
    lastError,
  };
}
