'use client';

/**
 * ChatHistory Component - Usage Examples
 *
 * This file demonstrates various ways to use the ChatHistory component
 * in different scenarios and layouts.
 */

import { useState } from 'react';
import { ChatHistory } from './ChatHistory';
import { ChatHistoryButton } from './ChatHistoryButton';

// ============================================================
// EXAMPLE 1: Integrated Chat Page (Full Layout)
// ============================================================

export function Example1_IntegratedChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleNewChat = () => {
    setActiveConversationId(null);
    console.log('Starting new chat');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    console.log('Loading conversation:', id);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar with ChatHistory */}
      <ChatHistory
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-xl font-semibold">
            {activeConversationId ? 'Conversation' : 'New Chat'}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {activeConversationId ? (
            <p>Messages for conversation: {activeConversationId}</p>
          ) : (
            <p>Start a new conversation</p>
          )}
        </div>

        <footer className="border-t p-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full p-2 border rounded"
          />
        </footer>
      </main>
    </div>
  );
}

// ============================================================
// EXAMPLE 2: Floating History Button (Header)
// ============================================================

export function Example2_HeaderWithHistoryButton() {
  const handleNewChat = () => {
    window.location.href = '/chat';
  };

  const handleSelectConversation = (id: string) => {
    window.location.href = `/chat?conversationId=${id}`;
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Operate</h1>

        <nav className="flex gap-2">
          <a href="/dashboard" className="px-3 py-2 hover:bg-muted rounded">
            Dashboard
          </a>
          <a href="/invoices" className="px-3 py-2 hover:bg-muted rounded">
            Invoices
          </a>
          <a href="/expenses" className="px-3 py-2 hover:bg-muted rounded">
            Expenses
          </a>
        </nav>
      </div>

      {/* History Button */}
      <div className="flex items-center gap-2">
        <ChatHistoryButton
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          variant="ghost"
          showLabel={true}
        />

        <button className="px-3 py-2 hover:bg-muted rounded">
          Settings
        </button>
      </div>
    </header>
  );
}

// ============================================================
// EXAMPLE 3: Controlled Panel with Toggle
// ============================================================

export function Example3_ControlledPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setIsOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsOpen(false);
  };

  return (
    <div className="relative h-screen">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover"
      >
        {isOpen ? 'Close' : 'Open'} History
      </button>

      {/* Controlled ChatHistory Panel */}
      {isOpen && (
        <div className="absolute inset-0 z-40">
          <ChatHistory
            isOpen={isOpen}
            onClose={handleClose}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="h-full pt-16 px-4">
        <h1 className="text-2xl font-bold mb-4">Main Content</h1>
        {activeConversationId ? (
          <p>Active conversation: {activeConversationId}</p>
        ) : (
          <p>No active conversation</p>
        )}
      </main>
    </div>
  );
}

// ============================================================
// EXAMPLE 4: Mobile-Optimized Layout
// ============================================================

export function Example4_MobileOptimized() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleNewChat = () => {
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Header with History Button */}
      <header className="flex items-center justify-between p-4 border-b bg-white md:hidden">
        <ChatHistoryButton
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          size="icon"
          variant="ghost"
        />

        <h1 className="text-lg font-semibold">Chat</h1>

        <button className="p-2">⋮</button>
      </header>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <ChatHistory
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />

        <main className="flex-1">
          {/* Chat content */}
        </main>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 md:hidden">
        {activeConversationId ? (
          <div className="p-4">Conversation: {activeConversationId}</div>
        ) : (
          <div className="p-4">New chat</div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// EXAMPLE 5: With Next.js Router Integration
// ============================================================

/**
 * This example shows how to integrate ChatHistory with Next.js routing
 * to enable shareable conversation URLs.
 *
 * Usage: /chat?conversationId=abc123
 */

import { useRouter, useSearchParams } from 'next/navigation';

export function Example5_NextJsRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');

  const handleNewChat = () => {
    router.push('/chat');
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat?conversationId=${id}`);
  };

  return (
    <div className="flex h-screen">
      <ChatHistory
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      <main className="flex-1">
        {conversationId ? (
          <div>Loading conversation: {conversationId}</div>
        ) : (
          <div>New chat</div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// EXAMPLE 6: With API Hook Integration
// ============================================================

import { useConversationHistoryAPI } from '@/hooks/use-conversation-history-api';

export function Example6_WithAPIHook() {
  const {
    activeConversationId,
    setActiveConversationId,
    createConversation,
    isLoading,
    error,
    refresh,
  } = useConversationHistoryAPI({
    enableSync: true,
    syncInterval: 30000, // 30 seconds
  });

  const handleNewChat = async () => {
    const newConversation = await createConversation();
    console.log('Created conversation:', newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="flex h-screen">
      <ChatHistory
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      <main className="flex-1 p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {isLoading ? (
          <div>Loading conversations...</div>
        ) : (
          <div>
            <button
              onClick={handleRefresh}
              className="mb-4 px-4 py-2 bg-primary text-white rounded"
            >
              Refresh Conversations
            </button>

            {activeConversationId ? (
              <div>Active: {activeConversationId}</div>
            ) : (
              <div>No active conversation</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// EXAMPLE 7: Custom Styling
// ============================================================

export function Example7_CustomStyling() {
  const handleNewChat = () => console.log('New chat');
  const handleSelectConversation = (id: string) => console.log('Select:', id);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ChatHistory
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        className="bg-white/80 backdrop-blur-lg border-r-2 border-purple-200"
      />

      <main className="flex-1">
        {/* Custom styled content */}
      </main>
    </div>
  );
}

// ============================================================
// EXAMPLE 8: Dashboard Widget
// ============================================================

export function Example8_DashboardWidget() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNewChat = () => {
    window.location.href = '/chat';
  };

  const handleSelectConversation = (id: string) => {
    window.location.href = `/chat?conversationId=${id}`;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-t-lg border">
        <h2 className="text-lg font-semibold">Recent Conversations</h2>

        <ChatHistoryButton
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          size="sm"
          variant="outline"
          showLabel={false}
        />
      </div>

      {/* Widget Body */}
      <div className="bg-white rounded-b-lg border border-t-0 overflow-hidden">
        {isExpanded ? (
          <div className="h-96">
            <ChatHistory
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        ) : (
          <div className="p-4">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-primary hover:underline"
            >
              View all conversations →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Export all examples
// ============================================================

export default {
  Example1_IntegratedChatPage,
  Example2_HeaderWithHistoryButton,
  Example3_ControlledPanel,
  Example4_MobileOptimized,
  Example5_NextJsRouter,
  Example6_WithAPIHook,
  Example7_CustomStyling,
  Example8_DashboardWidget,
};
