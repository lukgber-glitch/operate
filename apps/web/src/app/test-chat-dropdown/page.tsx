'use client';

import { useState } from 'react';
import { ChatHistoryDropdown } from '@/components/chat/ChatHistoryDropdown';

export default function TestChatDropdownPage() {
  const [sessionId, setSessionId] = useState<string | undefined>();

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Chat History Dropdown Test</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <ChatHistoryDropdown
          currentSessionId={sessionId}
          onSelectSession={(id) => {
            console.log('Selected session:', id);
            setSessionId(id);
          }}
          onNewSession={() => {
            console.log('New session');
            setSessionId(undefined);
          }}
        />

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Current Session ID: {sessionId || 'None'}
          </p>
        </div>
      </div>
    </div>
  );
}
