/**
 * useWebSocket Hook
 * React hook for managing WebSocket connections and real-time event subscriptions
 *
 * @example
 * // Basic usage
 * const { connected, subscribe } = useWebSocket();
 *
 * useEffect(() => {
 *   const unsubscribe = subscribe(InvoiceEvent.CREATED, (data) => {
 *     console.log('New invoice created:', data);
 *     // Update UI, show notification, etc.
 *   });
 *
 *   return unsubscribe;
 * }, []);
 *
 * @example
 * // Subscribe to multiple events
 * const { connected, subscribe } = useWebSocket();
 *
 * useEffect(() => {
 *   const unsubscribers = [
 *     subscribe(InvoiceEvent.PAID, handleInvoicePaid),
 *     subscribe(ExpenseEvent.CREATED, handleExpenseCreated),
 *     subscribe(NotificationEvent.NEW, handleNewNotification),
 *   ];
 *
 *   return () => unsubscribers.forEach(unsub => unsub());
 * }, []);
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, isSocketConnected } from '@/lib/websocket/socket-client';
import { WebSocketEvent, WebSocketPayload } from '@operate/shared';

interface UseWebSocketOptions {
  /**
   * Access token for authentication
   * If not provided, will attempt to read from cookies or local storage
   */
  token?: string;
  /**
   * Whether to auto-connect on mount (default: true)
   */
  autoConnect?: boolean;
  /**
   * Callback when connection is established
   */
  onConnect?: () => void;
  /**
   * Callback when connection is lost
   */
  onDisconnect?: () => void;
  /**
   * Callback when connection error occurs
   */
  onError?: (error: Error) => void;
}

interface UseWebSocketReturn {
  /**
   * Whether the WebSocket is currently connected
   */
  connected: boolean;
  /**
   * Subscribe to a WebSocket event
   * Returns unsubscribe function
   */
  subscribe: <T extends WebSocketPayload>(
    event: WebSocketEvent,
    handler: (data: T) => void
  ) => () => void;
  /**
   * Manually connect to WebSocket
   */
  connect: () => void;
  /**
   * Manually disconnect from WebSocket
   */
  disconnect: () => void;
  /**
   * Send a message through WebSocket
   */
  emit: (event: string, data?: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    token,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<Function>>>(new Map());

  /**
   * Get access token from various sources
   */
  const getAccessToken = useCallback((): string | undefined => {
    if (token) return token;

    // Try to get from combined op_auth cookie
    const cookieMatch = document.cookie.match(/op_auth=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      try {
        const authData = JSON.parse(decodeURIComponent(cookieMatch[1]));
        return authData.a; // access token
      } catch {
        // Invalid JSON
      }
    }

    // Try to get from localStorage (fallback)
    return localStorage.getItem('op_auth') || undefined;
  }, [token]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn('No access token available for WebSocket connection');
      return;
    }

    try {
      const socket = connectSocket(accessToken);
      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setConnected(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        onError?.(error);
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      });

      // Re-attach all existing event handlers
      handlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socket.on(event, handler as any);
        });
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      onError?.(error as Error);
    }
  }, [getAccessToken, onConnect, onDisconnect, onError]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    setConnected(false);
  }, []);

  /**
   * Subscribe to a WebSocket event
   */
  const subscribe = useCallback(<T extends WebSocketPayload>(
    event: WebSocketEvent,
    handler: (data: T) => void
  ): (() => void) => {
    // Store handler reference
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Attach handler to socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, handler as any);
    }

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(event);
        }
      }

      if (socketRef.current) {
        socketRef.current.off(event, handler as any);
      }
    };
  }, []);

  /**
   * Emit an event through WebSocket
   */
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }, [connected]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !isSocketConnected()) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        // Remove all event listeners
        handlersRef.current.forEach((handlers, event) => {
          handlers.forEach((handler) => {
            socketRef.current?.off(event, handler as any);
          });
        });
        handlersRef.current.clear();
      }
      // Note: We don't disconnect here to allow reconnection
      // Call disconnect() manually if needed
    };
  }, [autoConnect, connect]);

  // Memoize return object to prevent unnecessary re-renders in consumers
  return useMemo(() => ({
    connected,
    subscribe,
    connect,
    disconnect,
    emit,
  }), [connected, subscribe, connect, disconnect, emit]);
};

/**
 * Hook for subscribing to a single WebSocket event
 * Simplified version of useWebSocket for single event subscriptions
 */
export const useWebSocketEvent = <T extends WebSocketPayload>(
  event: WebSocketEvent,
  handler: (data: T) => void,
  options: UseWebSocketOptions = {}
): { connected: boolean } => {
  const { connected, subscribe } = useWebSocket(options);

  useEffect(() => {
    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
  }, [event, handler, subscribe]);

  return { connected };
};
