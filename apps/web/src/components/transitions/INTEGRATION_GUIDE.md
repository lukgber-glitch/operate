# Transition Components Integration Guide

## Task W40-T2: Smooth Page Transitions - COMPLETED ✅

All transition components have been implemented and are ready to use across the Operate web application.

---

## What's Been Installed

### Package
- **framer-motion** v12.23.25 ✅ (installed via pnpm)

### Components Created

```
apps/web/src/components/transitions/
├── PageTransition.tsx          # Page-level fade/slide transitions
├── StepTransition.tsx          # Wizard/onboarding step transitions
├── AnimatedList.tsx            # Stagger animations for lists
├── ModalTransition.tsx         # Modal, drawer, tooltip animations
├── utils.ts                    # Helper functions and hooks
├── index.ts                    # Barrel export file
├── README.md                   # Full documentation
└── examples/
    ├── OnboardingExample.tsx   # Onboarding flow example
    ├── ChatExample.tsx         # Chat interface example
    └── DashboardExample.tsx    # Dashboard cards example
```

---

## Quick Start

### 1. Import Components

```tsx
import {
  PageTransition,
  StepTransition,
  AnimatedList,
  AnimatedListItem,
  ModalTransition,
} from '@/components/transitions';
```

### 2. Apply to Your Pages

#### Page Transitions
```tsx
// apps/web/src/app/(dashboard)/page.tsx
export default function DashboardPage() {
  const pathname = usePathname();

  return (
    <PageTransition pageKey={pathname}>
      {/* Your page content */}
    </PageTransition>
  );
}
```

#### Onboarding Steps
```tsx
// apps/web/src/app/(auth)/onboarding/page.tsx
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  return (
    <StepTransition currentStep={step} direction={direction}>
      {step === 0 && <WelcomeStep />}
      {step === 1 && <BusinessInfoStep />}
      {/* More steps... */}
    </StepTransition>
  );
}
```

#### Chat Messages
```tsx
// apps/web/src/app/(dashboard)/chat/page.tsx
<AnimatedList staggerDelay={0.1}>
  {messages.map(msg => (
    <AnimatedListItem key={msg.id}>
      <ChatBubble message={msg} />
    </AnimatedListItem>
  ))}
</AnimatedList>
```

---

## Files to Update

### Priority 1: Core User Flows

1. **Onboarding Wizard**
   - File: `apps/web/src/app/(auth)/onboarding/page.tsx`
   - Add: `StepTransition` and `StepIndicator`
   - Example: See `examples/OnboardingExample.tsx`

2. **Chat Interface**
   - File: `apps/web/src/app/(dashboard)/chat/page.example.tsx`
   - Add: `AnimatedList` for messages, `DrawerTransition` for mobile menu
   - Example: See `examples/ChatExample.tsx`

3. **Dashboard**
   - File: `apps/web/src/app/(dashboard)/page.tsx`
   - Add: `AnimatedGrid` for cards, `PageTransition` wrapper
   - Example: See `examples/DashboardExample.tsx`

### Priority 2: Shared Components

4. **Modal Dialogs**
   - Replace existing modal wrappers with `ModalTransition`
   - Files: Any component using Radix Dialog

5. **Mobile Navigation**
   - File: `apps/web/src/components/navigation/*`
   - Add: `DrawerTransition` for mobile menu

6. **Lists & Tables**
   - Files: Any component rendering lists (clients, invoices, tasks)
   - Add: `AnimatedList` or `ScaleList`

---

## Animation Specs Summary

| Animation Type | Component | Duration | Easing |
|----------------|-----------|----------|--------|
| Page transition | `PageTransition` | 300ms | easeInOut |
| Step transition | `StepTransition` | 400ms | anticipate |
| List stagger | `AnimatedList` | 50-100ms delay | easeOut |
| Modal | `ModalTransition` | 200ms | spring |
| Drawer | `DrawerTransition` | 300ms | spring |

---

## Accessibility

All components respect `prefers-reduced-motion`:
- Animations are simplified to opacity-only
- Duration reduced to near-instant (0.01s)
- Use `useSafeVariants()` and `useSafeTransition()` hooks for custom animations

Example:
```tsx
import { useSafeVariants } from '@/components/transitions/utils';

const variants = useSafeVariants({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
});
```

---

## Performance Tips

1. **Limit List Items**: Stagger animations work best with <50 items
2. **Use Pagination**: For large lists, paginate instead of animating hundreds of items
3. **Lazy Load**: Combine with lazy loading for off-screen content
4. **Mobile Optimization**: Animations are automatically faster on mobile (200ms vs 300ms)

```tsx
import { calculateStaggerDelay } from '@/components/transitions/utils';

// Automatically adjusts delay based on item count
const delay = calculateStaggerDelay(items.length);
<AnimatedList staggerDelay={delay}>
```

---

## Testing Checklist

Before merging:

- [ ] Test page transitions between dashboard pages
- [ ] Test onboarding flow forward/backward navigation
- [ ] Test chat message animations (new messages appear smoothly)
- [ ] Test modal open/close animations
- [ ] Test mobile drawer menu
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Test on mobile devices (verify performance)
- [ ] Test list animations with varying item counts
- [ ] Verify no layout shift during animations
- [ ] Check browser DevTools for performance (should be <16ms per frame)

---

## Next Steps

### Immediate (W40)
1. Apply `PageTransition` to all dashboard pages
2. Update onboarding with `StepTransition`
3. Add `AnimatedList` to chat messages

### Short-term (W41)
4. Replace all modal implementations with `ModalTransition`
5. Add `DrawerTransition` to mobile navigation
6. Implement loading skeletons with motion

### Long-term (W42+)
7. Add scroll-triggered animations for marketing pages
8. Implement micro-interactions (button press, hover states)
9. Add celebratory animations (task completion, achievement unlocks)

---

## Troubleshooting

### "AnimatePresence not working"
- Ensure each child has a unique `key` prop
- Use `mode="wait"` for exit animations

### "Animations are janky"
- Check item count (reduce if >50 items)
- Use `will-change` CSS property sparingly
- Consider reducing `staggerDelay`

### "Layout shifts during animation"
- Add explicit width/height to animated elements
- Use `layout` prop on motion components if needed

### "TypeScript errors"
- Make sure framer-motion types are installed
- Import types: `import { Variants, Transition } from 'framer-motion'`

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Component README](./README.md)
- [Example Implementations](./examples/)
- [Utility Functions](./utils.ts)

---

## Support

For questions or issues:
1. Check the README.md for component documentation
2. Review example implementations in `examples/` folder
3. Test with example components before integration
4. Check browser console for performance warnings (dev mode only)

---

**Status**: ✅ Ready for Integration
**Version**: 1.0.0
**Last Updated**: 2025-12-05
**Task**: W40-T2 - Implement smooth page transitions
