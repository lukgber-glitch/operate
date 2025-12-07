# GreetingHeader Component

## Overview
Dynamic greeting component for the chat page that provides a personalized, time-based welcome message.

## Features
- **Time-based greeting**: Automatically selects "Good morning", "Good afternoon", or "Good evening" based on current time
- **Personalization**: Uses the user's first name from authentication
- **Smooth animation**: Subtle fade-in animation on page load
- **Graceful fallback**: Displays "there" if user information is unavailable
- **Consistent styling**: Uses HeadlineOutside component for design system compliance

## Usage

```tsx
import { GreetingHeader } from '@/components/chat/GreetingHeader';

export default function ChatPage() {
  return (
    <div>
      <GreetingHeader />
      {/* Rest of chat interface */}
    </div>
  );
}
```

## Component Structure

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { HeadlineOutside } from '@/components/ui/headline-outside';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader() {
  const { user } = useAuth();
  const firstName = user?.firstName || 'there';
  const greeting = getGreeting();

  return (
    <HeadlineOutside className="animate-fade-in">
      {greeting}, {firstName}
    </HeadlineOutside>
  );
}
```

## Time Ranges

| Time Range | Greeting |
|-----------|----------|
| 00:00 - 11:59 | Good morning |
| 12:00 - 17:59 | Good afternoon |
| 18:00 - 23:59 | Good evening |

## Styling

The component inherits styling from `HeadlineOutside`:
- Font size: 24px
- Font weight: 600 (semibold)
- Color: `var(--color-text-secondary)`
- Animation: `fade-in` (0.3s ease-out)
- Margin bottom: `var(--space-6)` (24px)

## Integration Notes

### Chat Page Integration
The GreetingHeader replaces the previous centered welcome section:

**Before:**
```tsx
<div className="text-center mb-6 md:mb-8">
  <h1>{getGreeting()}, {user?.firstName || 'there'}!</h1>
  <p>How can I help you manage your business today?</p>
</div>
```

**After:**
```tsx
<div className="mb-6">
  <GreetingHeader />
</div>
```

### Design Alignment
- Sits outside the main chat container
- Left-aligned (not centered)
- Positioned above any icons or action buttons
- Creates visual hierarchy with HeadlineOutside styling

## Dependencies

- `@/hooks/use-auth`: User authentication data
- `@/components/ui/headline-outside`: Base styling component
- TailwindCSS: `animate-fade-in` utility class

## File Locations

- Component: `src/components/chat/GreetingHeader.tsx`
- Export: `src/components/chat/index.ts`
- Usage: `src/app/(dashboard)/chat/page.tsx`

## Testing

Build verification:
```bash
npm run build
```

Expected output: ✓ Compiled successfully

## Future Enhancements

Potential improvements:
- [ ] Localization support for multiple languages
- [ ] Custom greeting messages based on user preferences
- [ ] Weekend/holiday-specific greetings
- [ ] Time zone awareness for international users
