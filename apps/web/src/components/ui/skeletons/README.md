# Skeleton Components

Comprehensive loading skeleton components for smooth loading states across the Operate application.

## Overview

This directory contains skeleton loading components that match the dimensions and layout of actual UI components, providing a polished loading experience.

## Components

### Base Component

#### `Skeleton`
Base skeleton component with pulse animation.

```tsx
import { Skeleton } from '@/components/ui/skeletons';

<Skeleton className="h-4 w-full" />
<Skeleton className="h-12 w-12 rounded-full" />
```

### Chat Skeletons

#### `ChatMessageSkeleton`
Loading skeleton for chat messages (user and assistant).

```tsx
import { ChatMessageSkeleton, ChatMessageListSkeleton } from '@/components/ui/skeletons';

// Single message
<ChatMessageSkeleton type="user" />
<ChatMessageSkeleton type="assistant" />

// Multiple messages
<ChatMessageListSkeleton count={3} />
```

**Features:**
- User/assistant message variants
- Avatar placeholder
- Multi-line text skeletons
- Proper alignment (left/right)

### Suggestion Skeletons

#### `SuggestionCardSkeleton`
Loading skeleton for AI suggestion cards.

```tsx
import { SuggestionCardSkeleton, SuggestionCardListSkeleton } from '@/components/ui/skeletons';

// Full card
<SuggestionCardSkeleton />

// Compact for horizontal scroll
<SuggestionCardSkeleton compact />

// Multiple cards
<SuggestionCardListSkeleton count={5} compact />
```

**Features:**
- Icon and badge placeholders
- Border accent (left)
- Compact variant
- Action button area

### Conversation Skeletons

#### `ConversationItemSkeleton`
Loading skeleton for conversation history items.

```tsx
import { ConversationItemSkeleton, ConversationListSkeleton } from '@/components/ui/skeletons';

// Single conversation
<ConversationItemSkeleton />

// Conversation list
<ConversationListSkeleton count={5} />
```

**Features:**
- Icon placeholder
- Title and preview text
- Timestamp area
- Action menu placeholder

### Dashboard Skeletons

#### `DashboardWidgetSkeleton`
Loading skeleton for dashboard widgets with multiple variants.

```tsx
import { DashboardWidgetSkeleton, DashboardGridSkeleton } from '@/components/ui/skeletons';

// Chart widget
<DashboardWidgetSkeleton variant="chart" />

// Stat card
<DashboardWidgetSkeleton variant="stat" />

// List widget
<DashboardWidgetSkeleton variant="list" />

// Table widget
<DashboardWidgetSkeleton variant="table" />

// Grid of widgets
<DashboardGridSkeleton count={6} />
```

**Variants:**
- `chart`: Chart with bars and axis
- `stat`: Large number with trend
- `list`: Multiple list items
- `table`: Table rows and columns

### Onboarding Skeletons

#### `OnboardingStepSkeleton`
Loading skeleton for onboarding wizard steps.

```tsx
import {
  OnboardingStepSkeleton,
  OnboardingWelcomeSkeleton,
  OnboardingCompletionSkeleton,
} from '@/components/ui/skeletons';

// Regular step
<OnboardingStepSkeleton showProgress showNavigation />

// Welcome step
<OnboardingWelcomeSkeleton />

// Completion step
<OnboardingCompletionSkeleton />
```

**Features:**
- Progress indicator
- Form field placeholders
- Navigation buttons
- Special welcome/completion variants

### Navigation Skeletons

#### `NavItemSkeleton`
Loading skeleton for navigation menu items.

```tsx
import {
  NavItemSkeleton,
  NavMenuSkeleton,
  SidebarSkeleton,
} from '@/components/ui/skeletons';

// Single nav item
<NavItemSkeleton isExpanded hasChildren />

// Full navigation menu
<NavMenuSkeleton count={8} isExpanded />

// Complete sidebar
<SidebarSkeleton isExpanded />
```

**Features:**
- Collapsed/expanded states
- Nested children support
- Complete sidebar with header/footer

## Usage Guidelines

### 1. Match Real Component Layout

Always ensure skeleton dimensions match the actual component:

```tsx
// ❌ Bad - doesn't match component
<Skeleton className="h-10 w-full" />

// ✅ Good - matches SuggestionCard
<SuggestionCardSkeleton />
```

### 2. Use During Data Fetching

```tsx
function ConversationHistory() {
  const { data, isLoading } = useConversations();

  if (isLoading) {
    return <ConversationListSkeleton count={5} />;
  }

  return <ConversationList conversations={data} />;
}
```

### 3. Progressive Loading

Show skeletons for individual items while loading:

```tsx
function Dashboard() {
  const { widgets, isLoading } = useDashboard();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        <DashboardGridSkeleton count={6} />
      ) : (
        widgets.map(widget => <Widget key={widget.id} {...widget} />)
      )}
    </div>
  );
}
```

### 4. Realistic Counts

Use realistic skeleton counts based on typical data:

```tsx
// ✅ Good - realistic message count
<ChatMessageListSkeleton count={3} />

// ❌ Bad - too many skeletons
<ChatMessageListSkeleton count={50} />
```

## Design Principles

### Animation
All skeletons use the `animate-pulse` utility for consistent shimmer effect.

### Colors
- Background: `bg-muted` (adapts to light/dark mode)
- Rounded corners: Match actual component borders

### Dimensions
- Heights: Match actual component heights
- Widths: Use percentage-based widths for text (e.g., `w-3/4`, `w-5/6`)
- Fixed widths for icons and avatars

### Spacing
- Match padding/margin of actual components
- Use consistent gap between skeleton elements

## Examples

### Chat Loading State

```tsx
function ChatInterface() {
  const { messages, isLoading } = useChat();

  return (
    <div className="space-y-6">
      {isLoading ? (
        <ChatMessageListSkeleton count={3} />
      ) : (
        messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))
      )}
    </div>
  );
}
```

### Dashboard Loading State

```tsx
function Dashboard() {
  const { isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1>Dashboard</h1>
        <DashboardGridSkeleton count={6} />
      </div>
    );
  }

  return <DashboardContent />;
}
```

### Sidebar Loading State

```tsx
function AppSidebar() {
  const { isExpanded } = useSidebar();
  const { isLoading } = useNavigation();

  if (isLoading) {
    return <SidebarSkeleton isExpanded={isExpanded} />;
  }

  return <NavigationMenu />;
}
```

## Accessibility

All skeletons are decorative and properly handled by screen readers:

- Use `aria-busy="true"` on parent containers during loading
- Announce loading completion to screen readers
- Ensure smooth transition from skeleton to actual content

## Performance

- Skeletons are lightweight (no images, minimal DOM)
- CSS animations (GPU-accelerated)
- Lazy render for large lists

## Contributing

When creating new skeletons:

1. Match exact layout of target component
2. Use semantic naming (`ComponentNameSkeleton`)
3. Support relevant variants/props
4. Include JSDoc comments
5. Export from `index.ts`
6. Add usage examples to README
