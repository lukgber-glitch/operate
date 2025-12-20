'use client';

import React from 'react';
import { SuggestionStreamProvider } from '@/components/chat/SuggestionStreamProvider';

/**
 * Chat Layout with SSE Integration
 * Wraps the chat interface with real-time suggestion streaming
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: SSE endpoint (/api/v1/suggestions/stream) is not yet implemented on backend
  // Connection status is hidden until the feature is ready
  return (
    <SuggestionStreamProvider
      showConnectionStatus={false}
      statusPosition="bottom-right"
      showToasts={false}
      autoConnect={false}
    >
      {children}
    </SuggestionStreamProvider>
  );
}
