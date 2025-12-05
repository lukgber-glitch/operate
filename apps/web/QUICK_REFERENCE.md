# Micro-Interactions Quick Reference

## Import

```tsx
import { AnimatedButton, AnimatedCard, AnimatedIcon } from '@/components/ui/animated';
```

## Components

### AnimatedButton

```tsx
// Basic press feedback
<AnimatedButton pressEffect="soft">Save</AnimatedButton>

// With loading
<AnimatedButton loading={isLoading}>Submit</AnimatedButton>

// With success
<AnimatedButton success={saved}>Saved!</AnimatedButton>

// With error
<AnimatedButton error={failed}>Retry</AnimatedButton>

// All together
<AnimatedButton
  pressEffect="soft"
  loading={isLoading}
  success={isSuccess}
  error={isError}
>
  Submit
</AnimatedButton>
```

### AnimatedCard

```tsx
// Subtle hover
<AnimatedCard hoverEffect="lift">
  <CardContent>Content</CardContent>
</AnimatedCard>

// Interactive (clickable)
<AnimatedCard hoverEffect="interactive" onClick={handleClick}>
  <CardContent>Click me!</CardContent>
</AnimatedCard>

// Staggered list
{items.map((item, i) => (
  <AnimatedCard key={item.id} staggerIndex={i}>
    <CardContent>{item.name}</CardContent>
  </AnimatedCard>
))}
```

### AnimatedIcon

```tsx
// Bounce on hover
<AnimatedIcon animation="bounce">
  <Star />
</AnimatedIcon>

// Rotate on hover
<AnimatedIcon animation="rotate">
  <Settings />
</AnimatedIcon>

// Continuous spin (loading)
<AnimatedIcon animation="spin" continuous>
  <Loader2 />
</AnimatedIcon>
```

## Hooks

### useFormAnimation

```tsx
const { isLoading, isSuccess, isError, setLoading, setSuccess, setError } = useFormAnimation();

const handleSubmit = async () => {
  setLoading();
  try {
    await save();
    setSuccess(2000); // Show for 2s
  } catch (e) {
    setError(2000);
  }
};

<AnimatedButton
  loading={isLoading}
  success={isSuccess}
  error={isError}
  onClick={handleSubmit}
/>
```

### useSuccessAnimation

```tsx
const [success, triggerSuccess] = useSuccessAnimation(1000);

<AnimatedButton
  success={success}
  onClick={() => {
    save();
    triggerSuccess();
  }}
/>
```

### useErrorAnimation

```tsx
const [error, triggerError] = useErrorAnimation(500);

<AnimatedButton
  error={error}
  onClick={() => {
    if (invalid) triggerError();
  }}
/>
```

## CSS Classes

### Button Effects
```tsx
<button className="btn-press">Default</button>
<button className="btn-press-soft">Soft</button>
```

### Card Effects
```tsx
<div className="card-hover">Lift</div>
<div className="card-hover-lift">Strong Lift</div>
<div className="card-interactive">Interactive</div>
```

### Icon Effects
```tsx
<div className="icon-bounce-hover">Bounce</div>
<div className="icon-rotate-hover">Rotate</div>
<div className="icon-spin-hover">Spin</div>
<div className="icon-scale-hover">Scale</div>
```

### Animations
```tsx
<div className="animate-shake">Shake</div>
<div className="animate-pulse-success">Success</div>
<div className="animate-fade-in">Fade In</div>
<div className="animate-slide-in-up">Slide Up</div>
```

## Common Patterns

### Form Button
```tsx
const { isLoading, isSuccess, isError, setLoading, setSuccess, setError } = useFormAnimation();

<AnimatedButton
  pressEffect="soft"
  loading={isLoading}
  success={isSuccess}
  error={isError}
  onClick={async () => {
    setLoading();
    try {
      await submit();
      setSuccess();
    } catch (e) {
      setError();
    }
  }}
>
  Submit
</AnimatedButton>
```

### Interactive Cards Grid
```tsx
{suggestions.map((item, index) => (
  <AnimatedCard
    key={item.id}
    hoverEffect="interactive"
    staggerIndex={index}
    onClick={() => handleSelect(item)}
  >
    <CardHeader>
      <AnimatedIcon animation="bounce">
        <item.icon />
      </AnimatedIcon>
      <CardTitle>{item.title}</CardTitle>
    </CardHeader>
  </AnimatedCard>
))}
```

### Send Button
```tsx
const [sent, setSent] = useState(false);

<AnimatedButton
  pressEffect="soft"
  loading={isSending}
  success={sent}
  onClick={async () => {
    await sendMessage();
    setSent(true);
    setTimeout(() => setSent(false), 1000);
  }}
>
  <AnimatedIcon animation="rotate">
    <Send />
  </AnimatedIcon>
</AnimatedButton>
```

## Props Reference

### AnimatedButton Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pressEffect` | `'default'` \| `'soft'` \| `'none'` | `'default'` | Press animation type |
| `success` | `boolean` | `false` | Show success pulse |
| `error` | `boolean` | `false` | Show error shake |
| `loading` | `boolean` | `false` | Show loading spinner |

### AnimatedCard Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hoverEffect` | `'lift'` \| `'lift-strong'` \| `'interactive'` \| `'none'` | `'lift'` | Hover animation |
| `onClick` | `() => void` | - | Click handler |
| `staggerIndex` | `number` | - | Stagger delay index |

### AnimatedIcon Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animation` | `'bounce'` \| `'rotate'` \| `'spin'` \| `'scale'` \| `'none'` | `'scale'` | Animation type |
| `continuous` | `boolean` | `false` | Continuous animation |

## Demo & Documentation

- **Demo Page**: `/micro-interactions`
- **Full Guide**: `MICRO_INTERACTIONS_GUIDE.md`
- **Summary**: `MICRO_INTERACTIONS_SUMMARY.md`
- **Completion Report**: `W40-T3-COMPLETION-REPORT.md`
