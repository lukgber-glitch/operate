# Skeleton Components Usage Guide

Quick reference for implementing loading states with skeleton components.

## Quick Start

```tsx
import { ComponentSkeleton } from '@/components/ui/skeletons';

// Show skeleton during loading
{isLoading ? <ComponentSkeleton /> : <ActualComponent />}
```

## Common Patterns

### Pattern 1: Simple Loading State

```tsx
function MyComponent() {
  const { data, isLoading } = useQuery();

  if (isLoading) {
    return <ComponentSkeleton />;
  }

  return <ActualComponent data={data} />;
}
```

### Pattern 2: List Loading State

```tsx
function MessageList() {
  const { messages, isLoading } = useMessages();

  return (
    <div>
      {isLoading ? (
        <ChatMessageListSkeleton count={3} />
      ) : (
        messages.map(msg => <Message key={msg.id} {...msg} />)
      )}
    </div>
  );
}
```

### Pattern 3: Progressive Loading

```tsx
function Dashboard() {
  const { widgets, isLoadingWidgets } = useWidgets();
  const { user, isLoadingUser } = useUser();

  return (
    <div>
      {/* Header loads independently */}
      <Header user={user} isLoading={isLoadingUser} />

      {/* Widgets load independently */}
      {isLoadingWidgets ? (
        <DashboardGridSkeleton count={6} />
      ) : (
        <WidgetGrid widgets={widgets} />
      )}
    </div>
  );
}
```

### Pattern 4: Suspense Boundaries

```tsx
import { Suspense } from 'react';

function Page() {
  return (
    <Suspense fallback={<DashboardGridSkeleton count={6} />}>
      <DashboardContent />
    </Suspense>
  );
}
```

## Component-Specific Examples

### Chat Interface

```tsx
// apps/web/src/app/chat/page.tsx
'use client';

import { ChatMessageListSkeleton } from '@/components/ui/skeletons';

function ChatPage() {
  const { messages, isLoading } = useChat();

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <ChatMessageListSkeleton count={3} />
        ) : (
          <ChatMessages messages={messages} />
        )}
      </div>
      <ChatInput />
    </div>
  );
}
```

### Suggestion Panel

```tsx
// apps/web/src/components/chat/LiveSuggestionPanel.tsx
'use client';

import { SuggestionCardListSkeleton } from '@/components/ui/skeletons';

function LiveSuggestionPanel() {
  const { suggestions, isLoading } = useSuggestions();

  return (
    <div className="p-4">
      <h3>Suggestions</h3>
      {isLoading ? (
        <SuggestionCardListSkeleton count={5} compact />
      ) : (
        <SuggestionCards suggestions={suggestions} />
      )}
    </div>
  );
}
```

### Conversation Sidebar

```tsx
// apps/web/src/components/chat/ConversationHistory.tsx
'use client';

import { ConversationListSkeleton } from '@/components/ui/skeletons';

function ConversationHistory() {
  const { conversations, isLoading } = useConversations();

  return (
    <div className="w-64 border-r">
      <div className="p-4">
        <h3>Recent Conversations</h3>
        {isLoading ? (
          <ConversationListSkeleton count={5} />
        ) : (
          <ConversationList conversations={conversations} />
        )}
      </div>
    </div>
  );
}
```

### Dashboard

```tsx
// apps/web/src/app/dashboard/page.tsx
'use client';

import { DashboardGridSkeleton } from '@/components/ui/skeletons';

function DashboardPage() {
  const { widgets, isLoading } = useDashboardWidgets();

  return (
    <div className="container py-8">
      <h1>Dashboard</h1>
      {isLoading ? (
        <DashboardGridSkeleton count={6} />
      ) : (
        <WidgetGrid widgets={widgets} />
      )}
    </div>
  );
}
```

### Onboarding Flow

```tsx
// apps/web/src/app/onboarding/page.tsx
'use client';

import { OnboardingStepSkeleton } from '@/components/ui/skeletons';

function OnboardingPage() {
  const { currentStep, isLoading } = useOnboarding();

  if (isLoading) {
    return <OnboardingStepSkeleton showProgress showNavigation />;
  }

  return <OnboardingWizard currentStep={currentStep} />;
}
```

### Navigation Sidebar

```tsx
// apps/web/src/components/layout/Sidebar.tsx
'use client';

import { SidebarSkeleton } from '@/components/ui/skeletons';

function Sidebar() {
  const { isExpanded } = useSidebar();
  const { navItems, isLoading } = useNavigation();

  if (isLoading) {
    return <SidebarSkeleton isExpanded={isExpanded} />;
  }

  return <Navigation items={navItems} isExpanded={isExpanded} />;
}
```

## Integration with React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { ChatMessageListSkeleton } from '@/components/ui/skeletons';

function ChatMessages({ conversationId }: { conversationId: string }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  if (isLoading) {
    return <ChatMessageListSkeleton count={3} />;
  }

  return (
    <div className="space-y-4">
      {messages?.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

## Integration with Next.js Server Components

```tsx
// app/dashboard/loading.tsx
import { DashboardGridSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="container py-8">
      <DashboardGridSkeleton count={6} />
    </div>
  );
}
```

## Accessibility Considerations

### Announce Loading State

```tsx
function DataTable() {
  const { data, isLoading } = useData();

  return (
    <div aria-busy={isLoading} aria-live="polite">
      {isLoading ? (
        <>
          <span className="sr-only">Loading data...</span>
          <TableSkeleton />
        </>
      ) : (
        <Table data={data} />
      )}
    </div>
  );
}
```

### Smooth Transitions

```tsx
import { motion } from 'framer-motion';

function AnimatedSkeleton() {
  const { data, isLoading } = useData();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {isLoading ? <ComponentSkeleton /> : <Component data={data} />}
    </motion.div>
  );
}
```

## Performance Tips

### 1. Limit Skeleton Count

```tsx
// ❌ Too many skeletons (poor UX)
<MessageListSkeleton count={50} />

// ✅ Reasonable count
<MessageListSkeleton count={3} />
```

### 2. Match Expected Data Size

```tsx
function SuggestionPanel() {
  const { suggestions, isLoading } = useSuggestions();

  // Use count that matches typical data size
  const skeletonCount = suggestions?.length || 5;

  return isLoading ? (
    <SuggestionCardListSkeleton count={skeletonCount} compact />
  ) : (
    <SuggestionCards suggestions={suggestions} />
  );
}
```

### 3. Lazy Load Skeletons for Large Lists

```tsx
function InfiniteList() {
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery();

  return (
    <div>
      {data.pages.map(page => (
        <Items key={page.id} items={page.items} />
      ))}

      {hasNextPage && isLoading && (
        <ConversationListSkeleton count={3} />
      )}
    </div>
  );
}
```

## Testing

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { ChatMessageListSkeleton } from '@/components/ui/skeletons';

describe('ChatMessageListSkeleton', () => {
  it('renders correct number of skeletons', () => {
    const { container } = render(<ChatMessageListSkeleton count={3} />);
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
```

### Visual Regression Testing

```tsx
// Use with Storybook + Chromatic
export const LoadingState = () => <DashboardGridSkeleton count={6} />;
```

## Troubleshooting

### Issue: Skeleton doesn't match component

**Solution:** Compare skeleton dimensions with actual component using browser DevTools.

### Issue: Jank during skeleton → content transition

**Solution:** Ensure skeleton and component have same height/width to prevent layout shift.

```tsx
// ✅ Good - same dimensions
<div className="h-[400px]">
  {isLoading ? <ChartSkeleton /> : <Chart />}
</div>
```

### Issue: Too much flashing with fast loads

**Solution:** Add minimum loading time or delay skeleton appearance.

```tsx
const [showSkeleton, setShowSkeleton] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setShowSkeleton(true), 200);
  return () => clearTimeout(timer);
}, []);

if (isLoading && !showSkeleton) return null;
if (isLoading) return <Skeleton />;
```

## Best Practices Summary

1. ✅ Use skeleton that matches component layout exactly
2. ✅ Show realistic skeleton counts (3-5 items typically)
3. ✅ Add aria-busy and aria-live for accessibility
4. ✅ Prevent layout shift by matching dimensions
5. ✅ Use Suspense boundaries for automatic loading states
6. ✅ Test skeleton appearance in loading.tsx files
7. ❌ Don't show skeletons for very fast loads (< 200ms)
8. ❌ Don't use too many skeletons (50+ items)
9. ❌ Don't forget dark mode compatibility (use `bg-muted`)
