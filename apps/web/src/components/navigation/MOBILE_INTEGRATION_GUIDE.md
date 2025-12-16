# Mobile Responsiveness Integration Guide

## Overview

This guide covers integrating the mobile-optimized components into your Operate application.

## ✅ Completed Mobile Improvements

### 1. BottomNav Component
**Location:** `src/components/navigation/BottomNav.tsx`

A mobile-only bottom navigation bar with:
- Touch-friendly 44px minimum tap targets
- Active route highlighting
- Safe area inset support for notch devices
- Auto-hidden on desktop (md breakpoint and above)

### 2. Responsive Utilities CSS
**Location:** `src/styles/responsive.css`

Comprehensive mobile utilities including:
- Safe area insets for notch devices (iPhone X+, Android notch)
- Virtual keyboard handling
- Touch target sizing (44px minimum)
- Mobile scrolling optimizations
- Horizontal scroll with snap behavior
- Reduced motion and high contrast support
- Responsive typography

### 3. Mobile-Optimized Components

#### ChatInput
- Reduced padding on mobile (3 → 4)
- Touch-friendly buttons (min 44px)
- Smaller max height on mobile (160px vs 200px)
- Hidden keyboard hints on mobile to save space
- Base font size (16px) to prevent iOS zoom

#### ChatInterface
- Sidebar hidden on mobile (becomes drawer)
- Horizontal scroll suggestions on mobile
- Responsive padding and spacing
- Bottom padding for bottom nav
- Smaller typography on mobile

#### ChatSuggestions
- Horizontal scroll with snap on mobile
- Desktop grid, mobile carousel
- 280px card width on mobile
- Touch-optimized scrolling

## 🚀 Integration Steps

### Step 1: Add BottomNav to Layout

Add the `BottomNav` component to your root layout or dashboard layout:

```tsx
// app/layout.tsx or app/(dashboard)/layout.tsx
import { BottomNav } from '@/components/navigation';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BottomNav /> {/* Automatically hidden on desktop */}
      </body>
    </html>
  );
}
```

### Step 2: Ensure Safe Area Padding

The responsive.css is already imported in `globals.css`, which includes:

```css
/* Safe area insets are automatically applied */
html {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### Step 3: Update Viewport Meta Tag

Ensure your layout has proper viewport settings (already configured):

```tsx
// app/layout.tsx metadata
export const metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};
```

### Step 4: Test on Mobile Devices

Use browser DevTools:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these viewports:
   - iPhone 14 Pro Max (430px)
   - iPhone SE (375px)
   - Samsung Galaxy S21 (360px)
   - iPad (768px)

## 📱 Mobile-Specific Classes

### Safe Area Classes

Use these Tailwind utilities for safe area support:

```tsx
// Bottom padding with safe area
<div className="pb-safe">

// Top padding with safe area
<div className="pt-safe">

// All sides
<div className="p-safe">
```

### Mobile Content Classes

```tsx
// Add bottom padding for bottom nav
<main className="mobile-content-with-nav">

// Mobile-responsive padding
<div className="mobile-px">

// Horizontal scroll on mobile
<div className="horizontal-scroll-mobile">
  <div>Card 1</div>
  <div>Card 2</div>
</div>

// Chat-specific containers
<div className="chat-container-mobile">
  <div className="chat-messages-mobile">
    {/* Messages */}
  </div>
</div>
```

### Touch Targets

Ensure all interactive elements meet accessibility guidelines:

```tsx
// Buttons automatically sized correctly
<Button className="min-h-[44px] min-w-[44px]">

// Custom interactive elements
<div className="min-h-[44px] min-w-[44px] cursor-pointer">
```

## 🎨 Mobile Layout Patterns

### Full-Width Cards on Mobile

```tsx
<Card className="card-responsive">
  {/* Borderless on mobile, with border on desktop */}
</Card>
```

### Responsive Grid to Horizontal Scroll

```tsx
<div className="mb-6">
  {/* Desktop: Grid */}
  <div className="hidden md:grid md:grid-cols-2 gap-4">
    {items.map(item => <Card key={item.id} />)}
  </div>

  {/* Mobile: Horizontal scroll */}
  <div className="md:hidden -mx-3">
    <div className="horizontal-scroll-mobile px-3 gap-3">
      {items.map(item => (
        <div key={item.id} className="w-[280px] flex-shrink-0">
          <Card />
        </div>
      ))}
    </div>
  </div>
</div>
```

### Mobile Drawer Instead of Sidebar

```tsx
<div className="flex">
  {/* Desktop: Sidebar */}
  <aside className="hidden md:block w-64">
    <Sidebar />
  </aside>

  {/* Mobile: Drawer (triggered by button) */}
  <Sheet>
    <SheetTrigger className="md:hidden">
      <Menu />
    </SheetTrigger>
    <SheetContent side="left">
      <Sidebar />
    </SheetContent>
  </Sheet>

  <main className="flex-1">
    {/* Content */}
  </main>
</div>
```

## 🔧 Custom Mobile Hooks

### useIsMobile Hook

Already available in `src/hooks/useMediaQuery.ts`:

```tsx
import { useIsMobile } from '@/hooks/useMediaQuery';

function MyComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
}
```

### Other Available Hooks

```tsx
import {
  useIsMobile,      // < 640px
  useIsTablet,      // 640px - 1023px
  useIsDesktop,     // >= 1024px
  useIsSmallScreen, // < 768px
  useIsTouchDevice, // Supports touch
  useBreakpoint,    // Returns 'mobile' | 'tablet' | 'desktop'
} from '@/hooks/useMediaQuery';
```

## 📐 Responsive Typography

Typography automatically scales on mobile:

```css
/* Mobile (< 640px) */
html { font-size: 14px; }
h1 { font-size: 1.75rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }

/* Desktop */
html { font-size: 16px; }
h1 { font-size: 2.25rem; }
/* etc... */
```

Override with Tailwind utilities:

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>

<p className="text-sm md:text-base">
  Responsive paragraph
</p>
```

## ⚡ Performance Optimizations

### 1. Prevent iOS Zoom on Input Focus

All inputs automatically have `font-size: 16px` to prevent zoom:

```tsx
<Input className="text-base" /> // Already applied
```

### 2. Smooth Scrolling on iOS

Use the `.scroll-touch` utility:

```tsx
<div className="scroll-touch overflow-y-auto">
  {/* Content */}
</div>
```

### 3. Snap Scrolling

Already applied to `.horizontal-scroll-mobile`:

```css
.horizontal-scroll-mobile {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
```

## ♿ Accessibility

### Focus Indicators

Enhanced focus visible for keyboard navigation:

```css
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### ARIA Labels

All navigation items include proper ARIA:

```tsx
<Link
  href="/dashboard"
  aria-label="Dashboard"
  aria-current={isActive ? 'page' : undefined}
>
  Dashboard
</Link>
```

### Reduced Motion

Automatically handled:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🧪 Testing Checklist

- [ ] All interactive elements are 44px minimum
- [ ] Text inputs don't zoom on focus (iOS Safari)
- [ ] Bottom nav visible only on mobile
- [ ] Safe area insets work on iPhone X+
- [ ] Horizontal scroll works with touch
- [ ] Sidebar hidden/drawer on mobile
- [ ] Chat interface fills viewport
- [ ] Virtual keyboard doesn't break layout
- [ ] Landscape mode works correctly
- [ ] Print styles hide mobile nav

## 🐛 Common Issues

### Issue: Bottom nav overlaps content

**Solution:** Add `mobile-content-with-nav` class:

```tsx
<main className="mobile-content-with-nav">
  {/* Content */}
</main>
```

### Issue: iOS zoom on input focus

**Solution:** Ensure inputs have `text-base` class:

```tsx
<Input className="text-base" />
```

### Issue: Horizontal scroll not working

**Solution:** Use the proper structure:

```tsx
<div className="horizontal-scroll-mobile">
  <div className="flex gap-3">
    {items.map(item => (
      <div key={item.id} className="flex-shrink-0 w-[280px]">
        {item}
      </div>
    ))}
  </div>
</div>
```

### Issue: Safe area insets not working

**Solution:** Check viewport meta tag includes `viewport-fit=cover`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## 📚 Resources

- [Apple HIG - Adaptivity and Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Material Design - Responsive Layout Grid](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## 🎯 Bottom Nav Routes

Current routes (customize in `BottomNav.tsx`):

| Icon | Label | Route |
|------|-------|-------|
| MessageSquare | Chat | `/` |
| LayoutDashboard | Dashboard | `/dashboard` |
| FileText | Invoices | `/invoices` |
| Settings | Settings | `/settings` |

To customize:

```tsx
// src/components/navigation/BottomNav.tsx
const navItems = [
  { icon: MessageSquare, label: 'Chat', href: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  // Add more items...
];
```

## ✨ Next Steps

1. Test on real mobile devices
2. Adjust touch target sizes if needed
3. Add pull-to-refresh if desired
4. Consider adding haptic feedback
5. Test with screen readers
6. Optimize images for mobile
7. Add service worker for offline support

---

**Last Updated:** December 2024
**Maintained by:** AURORA (UI/UX Design Agent)
