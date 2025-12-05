# Micro-Interactions Guide

This guide explains how to use the micro-interactions system in Operate/CoachOS.

## Quick Start

```tsx
import { AnimatedButton, AnimatedCard, AnimatedIcon } from '@/components/ui/animated';

// Animated button with press effect
<AnimatedButton pressEffect="soft">Click Me</AnimatedButton>

// Animated card with hover lift
<AnimatedCard hoverEffect="interactive" onClick={handleClick}>
  <CardContent>Interactive Card</CardContent>
</AnimatedCard>

// Animated icon with bounce
<AnimatedIcon animation="bounce">
  <Star className="h-5 w-5" />
</AnimatedIcon>
```

## Components

### AnimatedButton

Button component with built-in micro-interactions.

**Props:**
- `pressEffect`: `'default'` | `'soft'` | `'none'` - Press animation type
- `success`: `boolean` - Show success pulse animation
- `error`: `boolean` - Show error shake animation
- `loading`: `boolean` - Show loading spinner

**Examples:**

```tsx
// Basic press feedback
<AnimatedButton pressEffect="soft">
  Save Changes
</AnimatedButton>

// With success animation
const [saved, setSaved] = useState(false);
<AnimatedButton
  success={saved}
  onClick={() => {
    saveToDB();
    setSaved(true);
  }}
>
  Save
</AnimatedButton>

// With loading state
<AnimatedButton loading={isSubmitting}>
  Submit Form
</AnimatedButton>

// With error feedback
<AnimatedButton error={hasError}>
  Try Again
</AnimatedButton>
```

### AnimatedCard

Card component with hover effects and stagger animations.

**Props:**
- `hoverEffect`: `'lift'` | `'lift-strong'` | `'interactive'` | `'none'`
- `onClick`: `() => void` - Make card clickable
- `staggerIndex`: `number` - Index for stagger animation in lists

**Examples:**

```tsx
// Subtle hover lift
<AnimatedCard hoverEffect="lift">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content</CardContent>
</AnimatedCard>

// Interactive card (clickable)
<AnimatedCard hoverEffect="interactive" onClick={handleSelect}>
  <CardContent>Click me!</CardContent>
</AnimatedCard>

// Staggered list
{items.map((item, index) => (
  <AnimatedCard key={item.id} staggerIndex={index}>
    <CardContent>{item.name}</CardContent>
  </AnimatedCard>
))}
```

### AnimatedIcon

Icon wrapper with various animation effects.

**Props:**
- `animation`: `'bounce'` | `'rotate'` | `'spin'` | `'scale'` | `'none'`
- `continuous`: `boolean` - Continuously animate without hover

**Examples:**

```tsx
// Bounce on hover
<AnimatedIcon animation="bounce">
  <Star className="h-5 w-5" />
</AnimatedIcon>

// Rotate on hover
<AnimatedIcon animation="rotate">
  <Settings className="h-5 w-5" />
</AnimatedIcon>

// Continuous spin (loading)
<AnimatedIcon animation="spin" continuous>
  <Loader2 className="h-5 w-5" />
</AnimatedIcon>

// Scale on hover
<AnimatedIcon animation="scale">
  <Heart className="h-5 w-5" />
</AnimatedIcon>
```

## Animation Hooks

### useSuccessAnimation

Trigger success animation with auto-reset.

```tsx
import { useSuccessAnimation } from '@/hooks/useAnimations';

function MyComponent() {
  const [success, triggerSuccess] = useSuccessAnimation(1000);

  return (
    <AnimatedButton
      success={success}
      onClick={() => {
        saveData();
        triggerSuccess();
      }}
    >
      Save
    </AnimatedButton>
  );
}
```

### useErrorAnimation

Trigger error animation with auto-reset.

```tsx
import { useErrorAnimation } from '@/hooks/useAnimations';

function MyComponent() {
  const [error, triggerError] = useErrorAnimation(500);

  return (
    <AnimatedButton
      error={error}
      onClick={async () => {
        try {
          await submitForm();
        } catch (e) {
          triggerError();
        }
      }}
    >
      Submit
    </AnimatedButton>
  );
}
```

### useLoadingAnimation

Manage loading state with minimum display time.

```tsx
import { useLoadingAnimation } from '@/hooks/useAnimations';

function MyComponent() {
  const { isLoading, startLoading, stopLoading } = useLoadingAnimation(300);

  const handleSubmit = async () => {
    startLoading();
    await submitData();
    stopLoading(); // Will show for at least 300ms
  };

  return (
    <AnimatedButton loading={isLoading} onClick={handleSubmit}>
      Submit
    </AnimatedButton>
  );
}
```

### useStaggerAnimation

Create staggered list animations.

```tsx
import { useStaggerAnimation } from '@/hooks/useAnimations';

function MyList({ items }) {
  const getStaggerProps = useStaggerAnimation(50);

  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id} {...getStaggerProps(index)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### useFormAnimation

Manage form states with animations.

```tsx
import { useFormAnimation } from '@/hooks/useAnimations';

function MyForm() {
  const { status, isLoading, isSuccess, isError, setLoading, setSuccess, setError } = useFormAnimation();

  const handleSubmit = async () => {
    setLoading();
    try {
      await submitForm();
      setSuccess(2000); // Show success for 2 seconds
    } catch (e) {
      setError(2000); // Show error for 2 seconds
    }
  };

  return (
    <AnimatedButton
      loading={isLoading}
      success={isSuccess}
      error={isError}
      onClick={handleSubmit}
    >
      Submit
    </AnimatedButton>
  );
}
```

## CSS Utility Classes

### Button Interactions

```tsx
// Press feedback
<button className="btn-press">Default Press</button>
<button className="btn-press-soft">Soft Press</button>
```

### Card Interactions

```tsx
// Hover effects
<div className="card-hover">Subtle Lift</div>
<div className="card-hover-lift">Strong Lift</div>
<div className="card-interactive">Interactive Card</div>
```

### Icon Interactions

```tsx
// Hover effects
<div className="icon-bounce-hover">Bounce</div>
<div className="icon-rotate-hover">Rotate</div>
<div className="icon-spin-hover">Spin</div>
<div className="icon-scale-hover">Scale</div>
```

### State Animations

```tsx
// Success/Error states
<div className="success-pulse">Success!</div>
<div className="error-shake">Error!</div>
<div className="loading-pulse">Loading...</div>
```

### Transition Utilities

```tsx
// Custom transitions
<div className="transition-micro">Fast Transition</div>
<div className="transition-smooth">Smooth Transition</div>
<div className="transition-bounce">Bouncy Transition</div>
```

## Tailwind Animation Classes

### Built-in Animations

```tsx
// Shake animation
<div className="animate-shake">Shake on error</div>

// Bounce
<div className="animate-bounce-subtle">Subtle bounce</div>

// Pulse
<div className="animate-pulse-success">Success pulse</div>
<div className="animate-pulse-slow">Slow pulse</div>

// Entrance animations
<div className="animate-fade-in">Fade in</div>
<div className="animate-slide-in-up">Slide up</div>
<div className="animate-slide-in-down">Slide down</div>
<div className="animate-scale-in">Scale in</div>

// Loading
<div className="animate-spinner">Spinning loader</div>
```

### Stagger Animations

```tsx
// Automatic stagger (first 8 items)
<div className="stagger-item">Item 1</div>
<div className="stagger-item">Item 2</div>
<div className="stagger-item">Item 3</div>
```

## Best Practices

1. **Use Sparingly**: Don't animate everything. Focus on key interactions.

2. **Consistent Timing**: Stick to the predefined durations:
   - Micro (150ms): Button presses, quick feedback
   - Smooth (300ms): Hovers, transitions
   - Standard (500ms): Error shakes
   - Long (1000ms): Success pulses

3. **Performance**:
   - Use transform and opacity for animations (GPU-accelerated)
   - Avoid animating width, height, or margin
   - Use `will-change` sparingly

4. **Accessibility**:
   - Respect `prefers-reduced-motion`
   - Keep animations subtle
   - Don't rely solely on animations for feedback

5. **Combine Wisely**:
   ```tsx
   // Good: Clear purpose
   <AnimatedButton pressEffect="soft" loading={isLoading}>
     Submit
   </AnimatedButton>

   // Bad: Too many simultaneous effects
   <AnimatedButton
     pressEffect="soft"
     success={true}
     error={true}
     loading={true}
   >
     Confusing
   </AnimatedButton>
   ```

## Implementation in Existing Components

### Chat Suggestions

```tsx
// Before
<Card onClick={handleSuggestion}>
  <CardContent>{suggestion.text}</CardContent>
</Card>

// After
<AnimatedCard
  hoverEffect="interactive"
  staggerIndex={index}
  onClick={handleSuggestion}
>
  <CardContent>{suggestion.text}</CardContent>
</AnimatedCard>
```

### Send Button

```tsx
// Before
<Button onClick={handleSend}>
  <Send className="h-4 w-4" />
</Button>

// After
<AnimatedButton
  pressEffect="soft"
  loading={isSending}
  success={sent}
>
  <AnimatedIcon animation="rotate">
    <Send className="h-4 w-4" />
  </AnimatedIcon>
</AnimatedButton>
```

### Form Buttons

```tsx
const { isLoading, isSuccess, isError, setLoading, setSuccess, setError } = useFormAnimation();

<AnimatedButton
  pressEffect="soft"
  loading={isLoading}
  success={isSuccess}
  error={isError}
  onClick={handleSubmit}
>
  Save Changes
</AnimatedButton>
```

## RTL Support

All animations automatically support RTL layouts:

```tsx
// Rotation animations flip direction in RTL
<AnimatedIcon animation="rotate"> {/* Rotates -12deg in RTL */}
  <Settings />
</AnimatedIcon>
```
