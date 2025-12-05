# Mobile Responsiveness - Quick Reference

## 🎯 Common Patterns

### Responsive Padding
```tsx
className="p-3 md:p-4"        // 12px → 16px
className="px-4 md:px-6"      // 16px → 24px
className="mobile-px"         // Auto scaling
```

### Responsive Typography
```tsx
className="text-sm md:text-base"      // 14px → 16px
className="text-2xl md:text-3xl"     // 24px → 30px
className="text-base md:text-lg"     // 16px → 18px
```

### Responsive Spacing
```tsx
className="gap-2 md:gap-4"           // 8px → 16px
className="space-y-4 md:space-y-6"   // 16px → 24px
className="mb-6 md:mb-8"             // 24px → 32px
```

### Responsive Visibility
```tsx
className="hidden md:block"          // Desktop only
className="block md:hidden"          // Mobile only
className="md:hidden"                // Hide on desktop
```

---

## 📱 Mobile-Specific Classes

### Safe Areas
```tsx
className="pb-safe"                  // Bottom (for bottom nav)
className="pt-safe"                  // Top (for status bar)
className="p-safe"                   // All sides
```

### Touch Targets
```tsx
className="min-h-[44px] min-w-[44px]"  // Minimum tap size
```

### Mobile Containers
```tsx
className="mobile-content-with-nav"    // Account for bottom nav
className="chat-container-mobile"      // Full viewport height
className="chat-messages-mobile"       // Scrollable messages
className="chat-input-container"       // Sticky input
```

### Horizontal Scroll
```tsx
<div className="horizontal-scroll-mobile">
  <div className="w-[280px] flex-shrink-0">
    Card content
  </div>
</div>
```

### Responsive Cards
```tsx
className="card-responsive"          // Borderless on mobile
```

---

## 🎨 Layout Patterns

### Grid → Horizontal Scroll
```tsx
{/* Desktop */}
<div className="hidden md:grid md:grid-cols-2 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

{/* Mobile */}
<div className="md:hidden -mx-3">
  <div className="horizontal-scroll-mobile px-3 gap-3">
    {items.map(item => (
      <div key={item.id} className="w-[280px] flex-shrink-0">
        <Card />
      </div>
    ))}
  </div>
</div>
```

### Sidebar → Drawer
```tsx
{/* Desktop */}
<aside className="hidden md:block w-64">
  <Sidebar />
</aside>

{/* Mobile */}
<Sheet>
  <SheetTrigger className="md:hidden">
    <Menu />
  </SheetTrigger>
  <SheetContent side="left">
    <Sidebar />
  </SheetContent>
</Sheet>
```

### Stacked → Inline
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

---

## 🪝 React Hooks

### Basic Usage
```tsx
import { useIsMobile } from '@/hooks/useMediaQuery';

function MyComponent() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### All Available Hooks
```tsx
import {
  useIsMobile,         // < 640px
  useIsTablet,         // 640px - 1023px
  useIsDesktop,        // >= 1024px
  useIsSmallScreen,    // < 768px
  useIsTouchDevice,    // Has touch support
  useBreakpoint,       // Returns: 'mobile' | 'tablet' | 'desktop'
} from '@/hooks/useMediaQuery';
```

---

## 🧩 Component Integration

### BottomNav
```tsx
import { BottomNav } from '@/components/navigation';

// In layout
<body>
  {children}
  <BottomNav />
</body>
```

### ChatInput (Mobile-Optimized)
```tsx
<ChatInput
  onSend={handleSend}
  showAttachment={true}
  showVoice={true}
  placeholder="Type a message..."
/>
// Already mobile-optimized with:
// - 44px touch targets
// - Reduced padding on mobile
// - Base font size (no zoom)
```

### ChatInterface (Mobile-Optimized)
```tsx
<ChatInterface />
// Already mobile-optimized with:
// - Hidden sidebar on mobile
// - Horizontal scroll suggestions
// - Bottom nav spacing
```

---

## ⚡ Performance Tips

### Prevent iOS Zoom
```tsx
<Input className="text-base" />  // Always use text-base
```

### Smooth Scrolling
```tsx
<div className="scroll-touch overflow-y-auto">
  {/* Content */}
</div>
```

### Fixed Elements
```tsx
<div className="fixed inset-x-0 bottom-0 pb-safe">
  {/* Fixed bottom content */}
</div>
```

---

## 🎯 Common Breakpoints

```tsx
// Mobile First
className="text-sm md:text-base"

// sm:   640px   (Landscape phones)
// md:   768px   (Tablets)
// lg:   1024px  (Desktops)
// xl:   1280px  (Large desktops)
// 2xl:  1536px  (Extra large)
```

---

## 🐛 Quick Fixes

### Bottom Nav Overlaps Content
```tsx
// Add this class to your main content
<main className="mobile-content-with-nav">
```

### Horizontal Scroll Not Working
```tsx
// Ensure flex-shrink-0 and fixed width
<div className="horizontal-scroll-mobile">
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-[280px]">Card</div>
  </div>
</div>
```

### Safe Areas Not Applied
```tsx
// Use the utility classes
<div className="pb-safe">
  {/* Content */}
</div>
```

---

## 📏 Standard Sizes

### Touch Targets
- Minimum: 44×44px
- Comfortable: 48×48px
- Generous: 56×56px

### Card Widths (Mobile)
- Suggestion cards: 280px
- Feature cards: 320px
- Full-width: 100%

### Spacing (Mobile)
- Tight: 8px (gap-2)
- Normal: 12px (gap-3)
- Comfortable: 16px (gap-4)

### Font Sizes (Mobile)
- Small: 12px (text-xs)
- Body: 14px (text-sm)
- Input: 16px (text-base) ← Prevents zoom
- Heading 3: 20px (text-xl)
- Heading 2: 24px (text-2xl)
- Heading 1: 28px (text-3xl on mobile)

---

## ✅ Pre-Flight Checklist

Before releasing mobile features:

- [ ] All buttons are min 44×44px
- [ ] Inputs use `text-base` class
- [ ] Bottom nav spacing added
- [ ] Horizontal scroll tested
- [ ] Safe areas tested on iPhone
- [ ] Virtual keyboard tested
- [ ] Touch scrolling smooth
- [ ] Typography readable
- [ ] No horizontal overflow
- [ ] Landscape mode works

---

## 📱 Test Viewports

Quick DevTools setup:
```
iPhone SE:        375×667
iPhone 14:        390×844
iPhone 14 Pro Max: 430×932
Galaxy S21:       360×800
iPad:             768×1024
```

---

## 💡 Pro Tips

1. **Always start mobile-first** - Design for small screens, enhance for large
2. **Use semantic HTML** - Helps with accessibility and SEO
3. **Test on real devices** - Emulation doesn't catch everything
4. **Mind the thumb zone** - Important actions at bottom for mobile
5. **Reduce animations** - Respect `prefers-reduced-motion`
6. **Consider orientation** - Test both portrait and landscape
7. **Watch bundle size** - Mobile users often on slower connections
8. **Progressive enhancement** - Core functionality works without JS

---

**Quick Access:**
- Full Guide: `src/components/navigation/MOBILE_INTEGRATION_GUIDE.md`
- Summary: `MOBILE_RESPONSIVENESS_SUMMARY.md`
- Utilities: `src/styles/responsive.css`
