/**
 * Real World Example - Complete application with skeleton loading states
 *
 * This example demonstrates how to use skeleton components across
 * a complete application page with multiple loading states.
 *
 * DO NOT USE IN PRODUCTION - This is for reference only
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  SidebarSkeleton,
  DashboardGridSkeleton,
  ChatMessageListSkeleton,
  SuggestionCardListSkeleton,
  ConversationListSkeleton,
} from './index';

/**
 * Example 1: Dashboard Page with Loading States
 */
export function DashboardPageExample() {
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true);
  const [isLoadingWidgets, setIsLoadingWidgets] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar with loading state */}
      <div className="w-64 border-r">
        {isLoadingSidebar ? (
          <SidebarSkeleton isExpanded />
        ) : (
          <div className="p-4">Actual Sidebar Content</div>
        )}
      </div>

      {/* Main content with loading state */}
      <div className="flex-1 overflow-auto">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

          {isLoadingWidgets ? (
            <DashboardGridSkeleton count={6} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Actual widget components */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Chat Interface with Multiple Loading States
 */
export function ChatInterfaceExample() {
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Conversation sidebar */}
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Conversations</h3>
        </div>
        <div className="overflow-auto">
          {isLoadingConversations ? (
            <ConversationListSkeleton count={5} />
          ) : (
            <div className="p-2">{/* Actual conversations */}</div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-6">
          {isLoadingMessages ? (
            <ChatMessageListSkeleton count={3} />
          ) : (
            <div className="space-y-4">{/* Actual messages */}</div>
          )}
        </div>

        {/* Suggestions panel */}
        <div className="border-t p-4 bg-muted/30">
          <h4 className="text-sm font-medium mb-3">Suggestions</h4>
          {isLoadingSuggestions ? (
            <SuggestionCardListSkeleton count={4} compact />
          ) : (
            <div className="flex gap-3 overflow-x-auto">
              {/* Actual suggestions */}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Progressive Loading
 *
 * Shows how to handle different parts loading at different times
 */
export function ProgressiveLoadingExample() {
  const [loadingStates, setLoadingStates] = useState({
    header: true,
    sidebar: true,
    mainContent: true,
    footer: true,
  });

  // Simulate progressive loading
  const simulateLoading = () => {
    setLoadingStates({ header: true, sidebar: true, mainContent: true, footer: true });

    setTimeout(() => setLoadingStates((s) => ({ ...s, header: false })), 500);
    setTimeout(() => setLoadingStates((s) => ({ ...s, sidebar: false })), 1000);
    setTimeout(() => setLoadingStates((s) => ({ ...s, mainContent: false })), 1500);
    setTimeout(() => setLoadingStates((s) => ({ ...s, footer: false })), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4">
        {loadingStates.header ? (
          <div className="flex items-center justify-between animate-pulse">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-full" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1>Operate</h1>
            <button>Profile</button>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r">
          {loadingStates.sidebar ? (
            <SidebarSkeleton isExpanded />
          ) : (
            <div className="p-4">Navigation</div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {loadingStates.mainContent ? (
            <DashboardGridSkeleton count={4} />
          ) : (
            <div>Main Content</div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t p-4">
        {loadingStates.footer ? (
          <div className="flex justify-between animate-pulse">
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        ) : (
          <div className="flex justify-between">
            <p>© 2025 Operate</p>
            <p>Version 1.0</p>
          </div>
        )}
      </footer>

      {/* Demo controls */}
      <div className="fixed bottom-4 right-4">
        <Button onClick={simulateLoading}>Simulate Loading</Button>
      </div>
    </div>
  );
}

/**
 * Example 4: Error State Fallback
 *
 * Shows skeleton while loading, error on failure, content on success
 */
export function ErrorStateFallbackExample() {
  const [state, setState] = useState<'loading' | 'error' | 'success'>('loading');

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {state === 'loading' && <DashboardGridSkeleton count={6} />}

      {state === 'error' && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load dashboard</p>
          <Button onClick={() => setState('loading')}>Retry</Button>
        </div>
      )}

      {state === 'success' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Actual dashboard widgets */}
        </div>
      )}

      {/* Demo controls */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Button onClick={() => setState('loading')} variant="outline">
          Loading
        </Button>
        <Button onClick={() => setState('error')} variant="outline">
          Error
        </Button>
        <Button onClick={() => setState('success')} variant="outline">
          Success
        </Button>
      </div>
    </div>
  );
}

/**
 * Example 5: Suspense Integration
 *
 * Using skeletons with React Suspense
 */
export function SuspenseExample() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Suspense Example</h1>

      {/* Suspense with skeleton fallback */}
      {/*
      <Suspense fallback={<DashboardGridSkeleton count={6} />}>
        <AsyncDashboardContent />
      </Suspense>
      */}

      <p className="text-muted-foreground">
        Uncomment the Suspense code above to see it in action with async components.
      </p>
    </div>
  );
}

/**
 * Example 6: Next.js App Router Integration
 *
 * Example loading.tsx file for Next.js 14 App Router
 */
export function NextJsLoadingExample() {
  // This would be in: app/dashboard/loading.tsx
  /*
  export default function Loading() {
    return (
      <div className="container py-8">
        <div className="h-10 w-48 bg-muted rounded mb-6 animate-pulse" />
        <DashboardGridSkeleton count={6} />
      </div>
    );
  }
  */

  return (
    <div className="container py-8">
      <div className="h-10 w-48 bg-muted rounded mb-6 animate-pulse" />
      <DashboardGridSkeleton count={6} />
    </div>
  );
}

export default DashboardPageExample;
