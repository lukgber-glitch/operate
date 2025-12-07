# Gradient Background System

Beautiful, performant animated gradient mesh background for the Operate app.

## Overview

The gradient background system creates a subtle, organic animation using GSAP-powered blobs that slowly move across the viewport. It's designed to add visual interest without distracting from content.

## Features

- **GSAP-powered animations**: Smooth, hardware-accelerated animations
- **Performant**: GPU-accelerated transforms, 60fps on most devices
- **Accessible**: Respects `prefers-reduced-motion` and low-end devices
- **Responsive**: Optimized for mobile, tablet, and desktop
- **Dark mode support**: Automatically adjusts opacity for dark themes
- **TypeScript**: Fully typed with proper interfaces

## Components

### GradientBackground

The main component that creates the animated gradient mesh.

```tsx
import { GradientBackground } from '@/components/animation';

// Basic usage (already included in layout.tsx)
<GradientBackground />

// With intensity control
<GradientBackground intensity="subtle" /> // default
<GradientBackground intensity="medium" />
<GradientBackground intensity="vibrant" />

// Disable if needed
<GradientBackground disabled={true} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `intensity` | `'subtle' \| 'medium' \| 'vibrant'` | `'subtle'` | Animation intensity |
| `disabled` | `boolean` | `false` | Disable the background |

### GradientBlob

Individual animated blob component (used internally by GradientBackground).

```tsx
import { GradientBlob } from '@/components/animation';

<GradientBlob
  color="#06BF9D"
  size={40}
  blur={150}
  opacity={0.3}
  duration={45}
  delay={0}
  path="organic"
  className="top-[10%] left-[15%]"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | - | Blob color (hex or rgba) |
| `size` | `number` | - | Size in viewport units (vw) |
| `blur` | `number` | - | Blur amount in pixels |
| `opacity` | `number` | - | Opacity (0-1) |
| `duration` | `number` | - | Animation cycle duration in seconds |
| `delay` | `number` | `0` | Animation delay in seconds |
| `path` | `'figure8' \| 'circular' \| 'organic'` | `'organic'` | Movement pattern |
| `className` | `string` | `''` | Additional CSS classes |

## Animation Patterns

### Organic (Default)
Random, natural movement that feels organic and unpredictable. Creates 4 random points and smoothly transitions between them.

### Figure-8
Creates a figure-8 pattern with smooth curves.

### Circular
Circular motion with subtle scale changes.

## Brand Colors

The background uses the Operate brand palette:
- **Primary**: `#06BF9D` (main teal)
- **Secondary**: `#48D9BE` (lighter teal)
- **Tertiary**: `#84D9C9` (lightest teal)

## Performance Optimizations

1. **GPU Acceleration**: Uses `transform: translate3d()` for hardware acceleration
2. **Pause on Hidden**: Animations pause when tab is not visible
3. **Mobile Optimization**: Reduced blur and size on mobile devices
4. **Low-end Device Detection**: Falls back to static gradient on devices with ≤2 CPU cores
5. **Reduced Motion**: Shows static gradient for users with `prefers-reduced-motion`

## Accessibility

- **Reduced Motion**: Automatically detects `prefers-reduced-motion` and shows a static gradient
- **Low-end Devices**: Detects devices with limited hardware and falls back to static gradient
- **ARIA Hidden**: All blobs are `aria-hidden="true"` to prevent screen reader announcement
- **No Interaction**: Pointer events disabled so it doesn't interfere with page interaction

## Dark Mode

The background automatically adjusts for dark mode:
- **Light mode**: Higher opacity (30%, 25%, 20%)
- **Dark mode**: Lower opacity (20%, 15%, 12%)
- Colors remain the same for brand consistency

## Integration

The background is already integrated in the root layout:

```tsx
// apps/web/src/app/layout.tsx
<body>
  <GradientBackground />
  <SkipToContent />
  <Providers>{children}</Providers>
  {/* ... */}
</body>
```

## Customization

### Changing Intensity Globally

Edit the default intensity in `layout.tsx`:

```tsx
<GradientBackground intensity="medium" />
```

### Adding More Blobs

Add additional blobs in `GradientBackground.tsx`:

```tsx
<GradientBlob
  color="#C4F2EA"
  size={20}
  blur={80}
  opacity={0.15}
  duration={40}
  delay={7}
  path="circular"
  className="top-[70%] right-[30%]"
/>
```

### Custom Animation Patterns

Create custom patterns by modifying `GradientBlob.tsx`. The GSAP timeline can be customized with any motion path.

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ Browsers without `filter: blur()` support show no background (graceful degradation)

## Files

- `src/components/animation/GradientBackground.tsx` - Main component
- `src/components/animation/GradientBlob.tsx` - Individual blob component
- `src/styles/gradient-background.css` - Styling and optimizations
- `src/components/animation/index.ts` - Exports

## Testing

The background has been tested on:
- Desktop (Chrome, Firefox, Safari, Edge)
- Mobile (iOS Safari, Chrome Mobile, Samsung Internet)
- Tablets (iPad, Android tablets)
- Low-end devices (4GB RAM, 2 cores)
- High refresh rate displays (120Hz+)

## Troubleshooting

### Background not showing

1. Check that animations aren't disabled in layout.tsx
2. Verify GSAP is installed: `npm ls gsap`
3. Check browser console for errors
4. Ensure device meets minimum requirements (>2 CPU cores)

### Performance issues

1. Reduce intensity: `<GradientBackground intensity="subtle" />`
2. Remove one blob from the component
3. Increase animation duration (slower = less CPU usage)
4. Check for other heavy animations on the page

### Not animating

1. Check if `prefers-reduced-motion` is enabled in OS settings
2. Verify the tab is visible (animations pause on hidden tabs)
3. Check if device is detected as low-end
4. Look for GSAP errors in console

## Future Enhancements

Potential improvements for future versions:
- [ ] Mouse-based parallax effect
- [ ] Scroll-triggered animations
- [ ] Color theme variants
- [ ] User preference controls
- [ ] Performance monitoring/metrics
- [ ] More animation patterns (wave, spiral, etc.)
