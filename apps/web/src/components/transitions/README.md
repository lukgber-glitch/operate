# Transition Components

Smooth, polished animations powered by Framer Motion for the Operate/CoachOS web app.

## Installation

Framer Motion is already installed in this project. Import components from `@/components/transitions`.

## Components

### PageTransition

Wraps page content with fade and slide transitions. Use at the route/page level.

```tsx
import { PageTransition } from '@/components/transitions';

export default function HomePage() {
  const pathname = usePathname();

  return (
    <PageTransition pageKey={pathname}>
      <div>Your page content</div>
    </PageTransition>
  );
}
```

**Props:**
- `children`: ReactNode
- `pageKey`: string (unique key to trigger transition)
- `className?`: string

**Duration:** 300ms

---

### StepTransition

Multi-step flow transitions (onboarding, wizards). Slides right for next, left for previous.

```tsx
import { StepTransition } from '@/components/transitions';

function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const nextStep = () => {
    setDirection('forward');
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setDirection('backward');
    setStep(s => s - 1);
  };

  return (
    <StepTransition currentStep={step} direction={direction}>
      {step === 0 && <WelcomeStep />}
      {step === 1 && <BusinessInfoStep />}
      {step === 2 && <TaxSetupStep />}
    </StepTransition>
  );
}
```

**Props:**
- `children`: ReactNode
- `currentStep`: number
- `direction?`: 'forward' | 'backward'
- `className?`: string

**Duration:** 400ms

**Also available:**
- `VerticalStepTransition` - slides vertically
- `StepIndicator` - animated step dots

---

### AnimatedList

Stagger animations for lists. Items appear one by one.

```tsx
import { AnimatedList, AnimatedListItem } from '@/components/transitions';

function TaskList({ tasks }) {
  return (
    <AnimatedList staggerDelay={0.1}>
      {tasks.map(task => (
        <AnimatedListItem key={task.id}>
          <TaskCard task={task} />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
```

**Props:**
- `children`: ReactNode
- `staggerDelay?`: number (default: 0.1s)
- `className?`: string

**Also available:**
- `AnimatedGrid` + `AnimatedGridItem` - for grid layouts
- `ScaleList` + `ScaleListItem` - scale animation instead of slide

---

### ModalTransition

Modal/dialog animations with backdrop.

```tsx
import { ModalTransition } from '@/components/transitions';

function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <ModalTransition
      isOpen={isOpen}
      onClose={onClose}
      variant="scale"
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full"
    >
      <h2>Confirm Delete</h2>
      <p>Are you sure?</p>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Delete</button>
      </div>
    </ModalTransition>
  );
}
```

**Props:**
- `isOpen`: boolean
- `onClose?`: () => void
- `variant?`: 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
- `className?`: string

**Duration:** 200ms (spring animation)

**Also available:**
- `DrawerTransition` - side panel/drawer (mobile menu)
- `TooltipTransition` - lightweight tooltip
- `DropdownTransition` - dropdown menu

---

### DrawerTransition

Side drawer for mobile menus, filters, etc.

```tsx
import { DrawerTransition } from '@/components/transitions';

function MobileMenu({ isOpen, onClose }) {
  return (
    <DrawerTransition
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      className="bg-white dark:bg-gray-900 w-80 p-6"
    >
      <nav>
        <ul>
          <li>Dashboard</li>
          <li>Tasks</li>
          <li>Settings</li>
        </ul>
      </nav>
    </DrawerTransition>
  );
}
```

**Props:**
- `isOpen`: boolean
- `onClose?`: () => void
- `side?`: 'left' | 'right' | 'top' | 'bottom'
- `className?`: string

---

## Utility Exports

### Animation Variants

Pre-built variants for custom motion components:

```tsx
import { fadeVariants, slideVariants, scaleVariants } from '@/components/transitions';
import { motion } from 'framer-motion';

<motion.div
  variants={fadeVariants}
  initial="hidden"
  animate="visible"
>
  Content
</motion.div>
```

**Available variants:**
- `fadeVariants`
- `slideVariants`
- `scaleVariants`
- `slideLeftVariants`
- `slideRightVariants`

### Transition Presets

Pre-configured timing for consistency:

```tsx
import { transitions } from '@/components/transitions';
import { motion } from 'framer-motion';

<motion.div transition={transitions.smooth}>
  Content
</motion.div>
```

**Available presets:**
- `transitions.fast` - 200ms
- `transitions.smooth` - 300ms
- `transitions.deliberate` - 400ms
- `transitions.spring` - spring physics
- `transitions.bouncy` - bouncy spring

---

## Integration Examples

### Chat Interface

```tsx
// apps/web/src/app/(dashboard)/chat/page.tsx
import { PageTransition, AnimatedList, AnimatedListItem } from '@/components/transitions';

export default function ChatPage() {
  const pathname = usePathname();
  const { messages } = useChat();

  return (
    <PageTransition pageKey={pathname}>
      <div className="flex flex-col h-screen">
        <ChatHeader />

        <AnimatedList className="flex-1 overflow-y-auto p-4">
          {messages.map(msg => (
            <AnimatedListItem key={msg.id}>
              <ChatBubble message={msg} />
            </AnimatedListItem>
          ))}
        </AnimatedList>

        <ChatInput />
      </div>
    </PageTransition>
  );
}
```

### Onboarding Wizard

```tsx
// apps/web/src/app/(auth)/onboarding/page.tsx
import { StepTransition, StepIndicator } from '@/components/transitions';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const nextStep = () => {
    setDirection('forward');
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setDirection('backward');
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StepIndicator totalSteps={5} currentStep={step} className="mb-8" />

      <StepTransition currentStep={step} direction={direction}>
        {step === 0 && <WelcomeStep onNext={nextStep} />}
        {step === 1 && <BusinessTypeStep onNext={nextStep} onBack={prevStep} />}
        {step === 2 && <CountryStep onNext={nextStep} onBack={prevStep} />}
        {step === 3 && <TaxInfoStep onNext={nextStep} onBack={prevStep} />}
        {step === 4 && <CompletionStep />}
      </StepTransition>
    </div>
  );
}
```

### Dashboard Cards

```tsx
// apps/web/src/app/(dashboard)/page.tsx
import { AnimatedGrid, AnimatedGridItem } from '@/components/transitions';

export default function DashboardPage() {
  const cards = useDashboardCards();

  return (
    <AnimatedGrid
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      staggerDelay={0.05}
    >
      {cards.map(card => (
        <AnimatedGridItem key={card.id}>
          <DashboardCard {...card} />
        </AnimatedGridItem>
      ))}
    </AnimatedGrid>
  );
}
```

### Command Palette

```tsx
// apps/web/src/components/command-palette/CommandPalette.tsx
import { ModalTransition, AnimatedList, AnimatedListItem } from '@/components/transitions';

export function CommandPalette({ isOpen, onClose }) {
  const results = useCommandSearch();

  return (
    <ModalTransition
      isOpen={isOpen}
      onClose={onClose}
      variant="scale"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full"
    >
      <CommandInput />

      <AnimatedList className="max-h-96 overflow-y-auto">
        {results.map(result => (
          <AnimatedListItem key={result.id}>
            <CommandItem {...result} />
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </ModalTransition>
  );
}
```

---

## Performance Tips

1. **Use `AnimatePresence` mode="wait"** - Already handled in components
2. **Limit stagger children** - Keep lists under 50 items for smooth animation
3. **Use `will-change` sparingly** - Framer Motion handles this
4. **Reduce motion for accessibility** - Add `prefers-reduced-motion` check:

```tsx
import { useReducedMotion } from 'framer-motion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageTransition pageKey="home">
      {/* Animations will be simplified automatically */}
    </PageTransition>
  );
}
```

---

## Browser Support

Framer Motion supports:
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- iOS Safari 14+
- Android Chrome 88+

All modern browsers support smooth animations.

---

## Next Steps

1. Apply `PageTransition` to all pages in `apps/web/src/app`
2. Update onboarding flow with `StepTransition`
3. Add `AnimatedList` to chat messages, task lists, client lists
4. Replace existing modals with `ModalTransition`
5. Add `DrawerTransition` for mobile navigation

See individual component files for detailed JSDoc and more examples.
