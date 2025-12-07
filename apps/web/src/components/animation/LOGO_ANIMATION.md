# Logo Entrance Animation

## Overview

The logo entrance animation creates a professional, branded first-time user experience for the Operate app. It uses GSAP for smooth, high-performance animations with a "Soft Emergence" effect.

## Files Created

### 1. `LogoEntrance.tsx`
Full-screen logo animation component that plays on first visit.

**Features:**
- Centered logo with fade-in and scale animation
- 1.8-second total animation sequence
- Skip button (enabled after 500ms to prevent accidental skips)
- Respects `prefers-reduced-motion` accessibility setting
- Stores completion in localStorage

**Animation Timeline:**
1. **0-800ms**: Fade from opacity 0 to 1, scale from 0.85 to 1.02 (slight overshoot)
2. **800-1000ms**: Settle to scale 1.0 using elastic ease
3. **1000-1300ms**: Hold position for brand recognition
4. **1300-1800ms**: Fade out and transition to login

**Props:**
```typescript
interface LogoEntranceProps {
  onComplete: () => void;     // Callback when animation completes
  skipEnabled?: boolean;       // Default: true
}
```

### 2. `LogoMorph.tsx`
Component that morphs the logo into the login card.

**Features:**
- Smooth transition from logo to card shape
- Uses opacity and scale transformations
- Wraps login card content
- Respects reduced motion preference

**Props:**
```typescript
interface LogoMorphProps {
  children: React.ReactNode;   // Card content to morph into
  className?: string;          // Optional wrapper class
}
```

### 3. `useLogoAnimation.ts`
Custom hook for managing animation state.

**Returns:**
```typescript
{
  shouldShowIntro: boolean;    // Should the intro play?
  skipIntro: () => void;       // Skip the intro immediately
  markIntroSeen: () => void;   // Mark intro as seen in localStorage
  isLoading: boolean;          // Is localStorage being checked?
}
```

**localStorage Key:** `operate_intro_seen`

### 4. `LoginPageWithAnimation.tsx`
Login page wrapper that integrates all animation components.

**Flow:**
1. Check if user has seen intro (via `useLogoAnimation`)
2. If first visit: Show `LogoEntrance`
3. After entrance completes: Show `LogoMorph` with login card
4. Return visits: Show login card immediately with morph animation

## Usage

The login page (`/login`) automatically uses the animation for first-time visitors:

```tsx
import { LoginPageWithAnimation } from './LoginPageWithAnimation';

export default function LoginPage() {
  return <LoginPageWithAnimation />;
}
```

## Animation Specs

### Timing Curve
- **Fade in**: `ease: "power2.out"` (smooth deceleration)
- **Settle**: `ease: "elastic.out(1, 0.5)"` (slight bounce)
- **Fade out**: `ease: "power2.in"` (smooth acceleration)

### Brand Colors (from logo.svg)
- Primary: `#04bda5`
- Light: `#84d9c9`
- White: `#fcfefe`

### Responsive Sizing
- Mobile: 128px × 128px (w-32 h-32)
- Desktop: 160px × 160px (w-40 h-40)

## Accessibility

- **Reduced Motion**: Animation automatically skips if user has `prefers-reduced-motion: reduce` set
- **Skip Button**: Always visible and accessible via keyboard
- **ARIA Labels**: Skip button has proper `aria-label`

## Performance

- **60fps target**: GSAP hardware-accelerated transforms
- **Preloaded logo**: Uses Next.js Image with `priority` flag
- **Minimal re-renders**: State changes are batched
- **Memory cleanup**: GSAP timeline is killed on unmount

## Testing

### Test First Visit
```javascript
// Clear localStorage to test first-time experience
localStorage.removeItem('operate_intro_seen');
// Reload page
```

### Test Skip Functionality
1. Visit `/login`
2. Click anywhere or press "Skip" button after 500ms
3. Should immediately show login form

### Test Reduced Motion
1. Enable reduced motion in OS settings
2. Visit `/login`
3. Animation should skip entirely

## Future Enhancements

Potential improvements:
- Sound effects (muted by default, with user preference)
- Particle effects during morph
- Custom animations for different user roles
- A/B testing different animation styles
- Analytics tracking for skip rate

## Technical Notes

- Uses GSAP 3.13.0+ with `@gsap/react` plugin
- Compatible with Next.js 14+ App Router
- Fully typed with TypeScript
- Works with all modern browsers (Chrome, Firefox, Safari, Edge)
- No external CDN dependencies (GSAP bundled locally)

## Troubleshooting

**Animation doesn't play:**
- Check browser console for errors
- Verify GSAP is installed: `npm list gsap`
- Check if reduced motion is enabled
- Clear localStorage and try again

**Animation is choppy:**
- Check browser performance tools
- Reduce animation complexity if needed
- Verify hardware acceleration is enabled

**Skip button not working:**
- Wait 500ms (intentional delay to prevent accidental skips)
- Check if `skipEnabled` prop is true
- Verify click handler is not blocked by other elements
