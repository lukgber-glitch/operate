# Skeleton Components - Quick Reference Card

## Import

```tsx
import { ComponentSkeleton } from '@/components/ui/skeletons';
```

## Usage Pattern

```tsx
{isLoading ? <ComponentSkeleton /> : <ActualComponent />}
```

---

## Chat

```tsx
// Single message
<ChatMessageSkeleton type="user" />
<ChatMessageSkeleton type="assistant" />

// Multiple messages
<ChatMessageListSkeleton count={3} />
```

**Use when:** Loading chat messages, conversation history

---

## Suggestions

```tsx
// Full card
<SuggestionCardSkeleton />

// Compact (horizontal scroll)
<SuggestionCardSkeleton compact />

// Multiple cards
<SuggestionCardListSkeleton count={5} compact />
```

**Use when:** Loading AI suggestions, recommendations

---

## Conversations

```tsx
// Single item
<ConversationItemSkeleton />

// List
<ConversationListSkeleton count={5} />
```

**Use when:** Loading conversation sidebar, history list

---

## Dashboard

```tsx
// Chart
<DashboardWidgetSkeleton variant="chart" />

// Stat card
<DashboardWidgetSkeleton variant="stat" />

// List
<DashboardWidgetSkeleton variant="list" />

// Table
<DashboardWidgetSkeleton variant="table" />

// Grid (mixed widgets)
<DashboardGridSkeleton count={6} />
```

**Use when:** Loading dashboard widgets, analytics

---

## Onboarding

```tsx
// Welcome
<OnboardingWelcomeSkeleton />

// Regular step
<OnboardingStepSkeleton showProgress showNavigation />

// Completion
<OnboardingCompletionSkeleton />
```

**Use when:** Loading onboarding wizard steps

---

## Navigation

```tsx
// Single item
<NavItemSkeleton isExpanded hasChildren />

// Menu
<NavMenuSkeleton count={6} isExpanded />

// Complete sidebar
<SidebarSkeleton isExpanded />
```

**Use when:** Loading sidebar, navigation menu

---

## Common Patterns

### React Query
```tsx
function Component() {
  const { data, isLoading } = useQuery();

  if (isLoading) return <ComponentSkeleton />;
  return <Content data={data} />;
}
```

### Suspense
```tsx
<Suspense fallback={<ComponentSkeleton />}>
  <Component />
</Suspense>
```

### Next.js loading.tsx
```tsx
// app/page/loading.tsx
export default function Loading() {
  return <ComponentSkeleton />;
}
```

---

## Tips

- ✅ Use realistic counts (3-5 items)
- ✅ Match skeleton to component layout
- ✅ Add `aria-busy="true"` to parent
- ❌ Don't show 50+ skeletons
- ❌ Don't flash for fast loads (< 200ms)

---

## Full Documentation

- **README.md** - Complete reference
- **USAGE.md** - Patterns and examples
- **SkeletonShowcase.example.tsx** - Interactive demo
