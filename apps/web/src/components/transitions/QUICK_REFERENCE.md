# Transition Components - Quick Reference

One-page cheat sheet for all transition components.

---

## Import

```tsx
import {
  PageTransition,
  StepTransition,
  AnimatedList,
  AnimatedListItem,
  ModalTransition,
  DrawerTransition,
  // ... more components
} from '@/components/transitions';
```

---

## Page Transition

**Use for**: Route changes, page navigation

```tsx
<PageTransition pageKey={pathname}>
  <div>Page content</div>
</PageTransition>
```

**Duration**: 300ms | **Type**: fade + slide

---

## Step Transition

**Use for**: Onboarding, wizards, multi-step forms

```tsx
const [step, setStep] = useState(0);
const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

<StepTransition currentStep={step} direction={direction}>
  {step === 0 && <Step1 />}
  {step === 1 && <Step2 />}
</StepTransition>
```

**Duration**: 400ms | **Type**: horizontal slide

---

## Animated List

**Use for**: Task lists, chat messages, search results

```tsx
<AnimatedList staggerDelay={0.1}>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      <ItemCard item={item} />
    </AnimatedListItem>
  ))}
</AnimatedList>
```

**Duration**: 50-100ms delay | **Type**: stagger fade + slide

---

## Modal Transition

**Use for**: Dialogs, confirmations, alerts

```tsx
<ModalTransition
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  variant="scale"
  className="bg-white p-6 rounded-lg"
>
  <h2>Modal Content</h2>
</ModalTransition>
```

**Variants**: scale | slide-up | slide-down | slide-left | slide-right
**Duration**: 200ms | **Type**: spring

---

## Drawer Transition

**Use for**: Mobile menu, side panels, filters

```tsx
<DrawerTransition
  isOpen={isMenuOpen}
  onClose={() => setIsMenuOpen(false)}
  side="left"
  className="bg-white w-80 p-6"
>
  <nav>Menu items</nav>
</DrawerTransition>
```

**Sides**: left | right | top | bottom
**Duration**: 300ms | **Type**: spring

---

## Animated Grid

**Use for**: Dashboard cards, image galleries

```tsx
<AnimatedGrid className="grid grid-cols-3 gap-4" staggerDelay={0.05}>
  {cards.map(card => (
    <AnimatedGridItem key={card.id}>
      <Card />
    </AnimatedGridItem>
  ))}
</AnimatedGrid>
```

**Duration**: 50ms delay | **Type**: scale + fade

---

## Step Indicator

**Use for**: Progress dots for wizards

```tsx
<StepIndicator
  totalSteps={5}
  currentStep={2}
  className="justify-center"
  onStepClick={(step) => setStep(step)}
/>
```

**Type**: expanding dot animation

---

## Utility Hooks

### Reduced Motion

```tsx
import { useSafeVariants, useSafeTransition } from '@/components/transitions/utils';

const variants = useSafeVariants(myVariants);
const transition = useSafeTransition({ duration: 0.3 });
```

### Calculate Stagger

```tsx
import { calculateStaggerDelay } from '@/components/transitions/utils';

const delay = calculateStaggerDelay(items.length); // Auto-adjusts for performance
<AnimatedList staggerDelay={delay}>
```

---

## Pre-built Variants

```tsx
import {
  fadeVariants,
  slideVariants,
  scaleVariants,
  slideLeftVariants,
  slideRightVariants,
  transitions,
} from '@/components/transitions';

<motion.div
  variants={fadeVariants}
  transition={transitions.smooth}
/>
```

---

## Common Patterns

### Loading Skeleton

```tsx
import { motion } from 'framer-motion';

<motion.div
  className="h-32 bg-gray-200 rounded"
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.5, repeat: Infinity }}
/>
```

### Typing Indicator

```tsx
<div className="flex gap-2">
  {[0, 0.2, 0.4].map((delay) => (
    <motion.div
      key={delay}
      className="w-2 h-2 bg-gray-400 rounded-full"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay }}
    />
  ))}
</div>
```

### Hover Scale

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

---

## Performance

- Keep staggered lists under 50 items
- Use `calculateStaggerDelay()` for large lists
- Mobile animations are automatically faster
- `prefers-reduced-motion` is automatically respected

---

## Component Matrix

| Component | Use Case | Duration | Type |
|-----------|----------|----------|------|
| PageTransition | Pages | 300ms | fade+slide |
| StepTransition | Wizards | 400ms | slide |
| AnimatedList | Lists | 100ms/item | stagger |
| ModalTransition | Dialogs | 200ms | spring |
| DrawerTransition | Menus | 300ms | spring |
| AnimatedGrid | Grids | 50ms/item | scale |
| StepIndicator | Progress | 300ms | expand |

---

## Files

- **PageTransition.tsx** - Page & fade transitions
- **StepTransition.tsx** - Step wizard transitions
- **AnimatedList.tsx** - List & grid animations
- **ModalTransition.tsx** - Modal, drawer, tooltip
- **utils.ts** - Helpers & hooks
- **index.ts** - Exports
- **README.md** - Full docs
- **examples/** - Integration examples

---

## Quick Links

- Full Docs: `./README.md`
- Examples: `./examples/`
- Utils: `./utils.ts`
- Integration: `./INTEGRATION_GUIDE.md`
