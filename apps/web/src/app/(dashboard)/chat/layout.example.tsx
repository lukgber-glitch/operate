'use client';

import React from 'react';
import { SuggestionStreamProvider } from '@/components/chat/SuggestionStreamProvider';

/**
 * Example Chat Layout with SSE Integration
 *
 * This example shows how to wrap the chat interface with the SuggestionStreamProvider
 * to enable real-time suggestions via Server-Sent Events.
 */
export default function ChatLayoutExample({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuggestionStreamProvider
      // Show connection status indicator in bottom-right corner
      showConnectionStatus={true}
      statusPosition="bottom-right"

      // Show toast notifications for important events
      showToasts={true}

      // Auto-connect on mount
      autoConnect={true}
    >
      {children}
    </SuggestionStreamProvider>
  );
}

/**
 * Alternative: Minimal Provider (no UI components)
 *
 * Use this if you want to handle UI feedback yourself
 */
export function MinimalChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuggestionStreamProvider
      showConnectionStatus={false}
      showToasts={false}
      autoConnect={true}
    >
      {children}
    </SuggestionStreamProvider>
  );
}

/**
 * Alternative: Delayed Connection
 *
 * Connect only after user interaction or initial data load
 */
export function DelayedConnectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuggestionStreamProvider
      showConnectionStatus={true}
      statusPosition="top-right"
      showToasts={true}
      autoConnect={false} // Don't connect immediately
    >
      {children}
    </SuggestionStreamProvider>
  );
}
