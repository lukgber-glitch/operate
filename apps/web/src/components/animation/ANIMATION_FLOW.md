# Logo Animation Flow Diagram

## First Visit Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User visits /login                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ LoginPageWithAnimation.tsx                                   │
│ • useLogoAnimation() hook checks localStorage               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ localStorage.getItem('operate_intro_seen')                  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ null/undefined          ▼ "true"
┌───────────────────┐     ┌──────────────────┐
│ First Visit       │     │ Return Visit     │
└───────┬───────────┘     └────────┬─────────┘
        │                          │
        ▼                          │
┌─────────────────────────────────┐│
│ LogoEntrance Component          ││
│ ┌─────────────────────────────┐ ││
│ │ 0-800ms: Fade in + Scale    │ ││
│ │ • opacity: 0 → 1            │ ││
│ │ • scale: 0.85 → 1.02        │ ││
│ │ • easing: power2.out        │ ││
│ └─────────────────────────────┘ ││
│ ┌─────────────────────────────┐ ││
│ │ 800-1000ms: Settle          │ ││
│ │ • scale: 1.02 → 1.0         │ ││
│ │ • easing: elastic.out       │ ││
│ └─────────────────────────────┘ ││
│ ┌─────────────────────────────┐ ││
│ │ 1000-1300ms: Hold           │ ││
│ │ • brand recognition         │ ││
│ └─────────────────────────────┘ ││
│ ┌─────────────────────────────┐ ││
│ │ 1300-1800ms: Fade out       │ ││
│ │ • opacity: 1 → 0            │ ││
│ │ • scale: 1 → 0.95           │ ││
│ │ • easing: power2.in         │ ││
│ └─────────────────────────────┘ ││
│                                 ││
│ [Skip Button - clickable]      ││
└────────────┬────────────────────┘│
             │                     │
             ▼                     │
┌─────────────────────────────────┐│
│ onComplete callback             ││
│ • markIntroSeen()               ││
│ • localStorage.setItem()        ││
└────────────┬────────────────────┘│
             │                     │
             └──────────┬──────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ LogoMorph Component                                          │
│ ┌─────────────────────────────────┐                         │
│ │ 0-300ms: Logo fade out          │                         │
│ │ • opacity: 1 → 0                │                         │
│ │ • scale: 1 → 1.1                │                         │
│ │ • easing: power2.in             │                         │
│ └─────────────────────────────────┘                         │
│ ┌─────────────────────────────────┐                         │
│ │ 300-800ms: Card fade in         │                         │
│ │ • opacity: 0 → 1                │                         │
│ │ • scale: 0.9 → 1.0              │                         │
│ │ • y: 20 → 0                     │                         │
│ │ • easing: power2.out            │                         │
│ └─────────────────────────────────┘                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Login Card (with LoginForm)                                 │
│ • Email/Password inputs                                     │
│ • Google OAuth button                                       │
│ • Language selector                                         │
│ • Links to register/forgot password                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
LoginPage (page.tsx)
│
└── LoginPageWithAnimation
    │
    ├── [if shouldShowIntro]
    │   └── LogoEntrance
    │       ├── Full-screen container
    │       ├── Logo image (Next.js Image)
    │       └── Skip button
    │
    └── [after intro OR on return visit]
        └── LogoMorph
            ├── Logo overlay (fades out)
            └── Card (fades in)
                └── LoginForm
                    ├── Email input
                    ├── Password input
                    ├── Google OAuth
                    └── Language selector
```

## State Management

```
┌─────────────────────────────────────────┐
│ useLogoAnimation Hook                   │
├─────────────────────────────────────────┤
│                                         │
│ State:                                  │
│ • shouldShowIntro: boolean              │
│ • isLoading: boolean                    │
│                                         │
│ Effects:                                │
│ • useEffect → check localStorage        │
│                                         │
│ Methods:                                │
│ • skipIntro()      → hide + set flag    │
│ • markIntroSeen()  → set localStorage   │
│                                         │
│ Storage:                                │
│ • Key: 'operate_intro_seen'             │
│ • Value: 'true' (string)                │
│                                         │
└─────────────────────────────────────────┘
```

## Animation Timing Visualization

```
Time (ms)    LogoEntrance                      LogoMorph
───────────────────────────────────────────────────────────
0            ████▓▓▓▓▒▒▒▒░░░░
100          ████████▓▓▓▓▒▒▒▒░░░░
200          ████████████▓▓▓▓▒▒▒▒
300          ████████████████▓▓▓▓                         ░░░░▒▒▒▒
400          ██████████████████▓▓                         ░░░░▒▒▒▒▓▓▓▓
500          ████████████████████                         ▒▒▒▒▓▓▓▓████
600          ████████████████████                         ▓▓▓▓████████
700          ████████████████████                         ████████████
800          ██████████████████▓▓ ← settle start          ████████████
900          ██████████████████░░                         ████████████
1000         ████████████████████ ← hold start            ████████████
1100         ████████████████████                         ████████████
1200         ████████████████████                         ████████████
1300         ████████████████▓▓▓▓ ← fade out              ████████████
1400         ████████████▓▓▓▓▒▒▒▒                         ████████████
1500         ████████▓▓▓▓▒▒▒▒░░░░                         ████████████
1600         ████▓▓▓▓▒▒▒▒░░░░                             ████████████
1700         ▓▓▓▓▒▒▒▒░░░░                                 ████████████
1800         ░░░░                                         ████████████

Legend: ████ = full opacity, ▓▓▓▓ = 75%, ▒▒▒▒ = 50%, ░░░░ = 25%
```

## Accessibility Decision Tree

```
┌─────────────────────────────────────┐
│ Animation about to start            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Check prefers-reduced-motion        │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼ reduce      ▼ no-preference
┌──────────┐   ┌─────────────────┐
│ Skip     │   │ Play animation  │
│ entirely │   │ with skip       │
└──────┬───┘   └────────┬────────┘
       │                │
       └────────┬───────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Show login form                     │
└─────────────────────────────────────┘
```

## Performance Optimization

```
┌────────────────────────────────────────────┐
│ Logo Image Loading Strategy                │
├────────────────────────────────────────────┤
│                                            │
│ Next.js Image Component                    │
│ • priority={true}      → preload           │
│ • fill={true}          → responsive        │
│ • className            → object-contain    │
│                                            │
│ GSAP Optimization                          │
│ • transform: translate3d → GPU accel      │
│ • opacity transitions  → composited        │
│ • will-change: transform → hint browser    │
│                                            │
│ React Optimization                         │
│ • useCallback for handlers                 │
│ • Cleanup on unmount (tl.kill())          │
│ • No unnecessary re-renders                │
│                                            │
└────────────────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────┐
│ Component Mount                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Check refs exist                    │
│ if (!logoRef.current) return        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Create GSAP timeline                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Run animation                       │
│ (with error boundaries)             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Component Unmount                   │
│ • clearTimeout(skipTimer)           │
│ • tl.kill() → cleanup GSAP          │
└─────────────────────────────────────┘
```
