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
  return (
    <SuggestionStreamProvider
      showConnectionStatus={true}
      statusPosition="bottom-right"
      showToasts={true}
      autoConnect={true}
    >
      {children}
    </SuggestionStreamProvider>
  );
}
