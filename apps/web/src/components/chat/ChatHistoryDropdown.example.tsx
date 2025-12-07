'use client';

import { useState } from 'react';
import { ChatHistoryDropdown } from './ChatHistoryDropdown';
import { ChatInterface } from './ChatInterface';

/**
 * ChatHistoryDropdown Example
 *
 * Demonstrates how to integrate the ChatHistoryDropdown component
 * into a chat interface. The dropdown sits at the top of the chat
 * container and provides quick access to conversation history.
 */
export default function ChatHistoryDropdownExample() {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

  const handleSelectSession = (id: string) => {
    console.log('Selected session:', id);
    setCurrentSessionId(id);
    // Load the conversation messages for this session
  };

  const handleNewSession = () => {
    console.log('Creating new session');
    setCurrentSessionId(undefined);
    // Clear current conversation and start fresh
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Chat History Dropdown at the top */}
        <div className="mb-4">
          <ChatHistoryDropdown
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col rounded-2xl border shadow-md overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

/**
 * Usage in a page component:
 *
 * ```tsx
 * import { ChatHistoryDropdown } from '@/components/chat';
 *
 * export default function ChatPage() {
 *   const [sessionId, setSessionId] = useState<string>();
 *
 *   return (
 *     <div className="container mx-auto p-4">
 *       <ChatHistoryDropdown
 *         currentSessionId={sessionId}
 *         onSelectSession={setSessionId}
 *         onNewSession={() => setSessionId(undefined)}
 *       />
 *
 *       <ChatMessages sessionId={sessionId} />
 *     </div>
 *   );
 * }
 * ```
 *
 * Features:
 * - Dropdown sits at the top of the chat container
 * - Click to expand/collapse
 * - Shows conversation history grouped by date (Today, Yesterday, This Week, Older)
 * - Each item shows: title, timestamp, and message count
 * - "New conversation" button to start fresh
 * - Smooth GSAP animations with stagger effect
 * - Respects reduced motion preferences
 * - Brand colors integration
 * - Mobile-friendly (full width on mobile)
 * - Keyboard accessible
 */
