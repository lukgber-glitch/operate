# Operate Design Overhaul - Master Plan

## Vision
A minimal, breathing interface where the chatbot is the hero. Everything emerges from a single button through fluid morphing animations.

---

## Brand Identity

### Colors (with accessibility)
| Name | Hex | Usage | Contrast on White |
|------|-----|-------|-------------------|
| Primary | #06BF9D | Buttons, accents | 3.1:1 (use #048A71 for text) |
| Primary Dark | #048A71 | Text on light bg | 4.5:1 ✓ |
| Secondary | #48D9BE | Hover states | 2.4:1 (decorative only) |
| Tertiary | #84D9C9 | Borders, dividers | 1.9:1 (decorative only) |
| Background | #C4F2EA | Light backgrounds | N/A |
| Surface | #F2F2F2 | Cards, containers | N/A |
| Text Primary | #1A1A1A | Main text | 16:1 ✓ |
| Text Secondary | #666666 | Subtle text | 5.7:1 ✓ |

### Dark Mode
| Name | Hex | Usage |
|------|-----|-------|
| Background | #0D1F1B | Page background |
| Surface | #1A2F2A | Cards, containers |
| Primary | #06BF9D | Buttons, accents (same) |
| Text Primary | #F2F2F2 | Main text |
| Text Secondary | #A0A0A0 | Subtle text |

### Typography
- **Font**: Inter (already installed)
- **Headline Outside**: 24px, font-weight 600, text-secondary
- **Card Title**: 20px, font-weight 500
- **Body**: 16px, font-weight 400
- **Small**: 14px, font-weight 400

### Spacing Scale (4px base)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Border Radius
- sm: 8px (buttons, inputs)
- md: 16px (cards, small containers)
- lg: 24px (main containers, onboarding steps)
- full: 9999px (pills, avatars)

---

## Animation System (GSAP)

### Core Principle
Every page transition follows this pattern:
1. **EXIT**: Content fades out (opacity 0, scale 0.95)
2. **MORPH**: Button stays, expands to new container size
3. **ENTER**: New content fades in (opacity 1, scale 1)

### Timing
- Exit duration: 300ms
- Morph duration: 500ms (with ease: "power2.inOut")
- Enter duration: 400ms
- Stagger for lists: 50ms per item

### Background Animation
- Subtle gradient mesh with 3-4 color blobs
- Movement: Very slow (30-60 second cycle)
- Blur: High (100-150px)
- Opacity: 30-50%
- Colors: #06BF9D, #48D9BE, #84D9C9

---

## Component Architecture

### 1. AnimatedContainer
The core building block - a rounded rectangle that can morph.

```tsx
<AnimatedContainer
  id="unique-id"
  className="..."
  morphFrom="previous-container-id"
>
  {children}
</AnimatedContainer>
```

### 2. MorphButton
A button that becomes the next container.

```tsx
<MorphButton
  targetId="next-container-id"
  onClick={handleNext}
>
  Continue
</MorphButton>
```

### 3. PageTransition
Wraps pages with exit/enter animations.

```tsx
<PageTransition>
  <OnboardingStep1 />
</PageTransition>
```

### 4. GradientBackground
The subtle moving background.

```tsx
<GradientBackground />
```

---

## User Flow

### Landing → Sign In
```
┌─────────────────────────────────────┐
│                                     │
│            [Guru Logo]              │
│                                     │
│     "Your AI business partner"      │  ← Outside
│                                     │
│   ┌───────────────────────────┐     │
│   │                           │     │
│   │     [ Sign In Button ]    │     │  ← Button INSIDE
│   │                           │     │
│   └───────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

### Onboarding Step (each step)
```
      "Tell us about your business"       ← Outside headline
   ┌───────────────────────────────┐
   │                               │
   │   Company Name: [________]    │
   │   Industry:     [________]    │
   │                               │
   │         [ Continue ]          │     ← Morphs to next
   │                               │
   └───────────────────────────────┘
```

### Main Chat UI
```
   "Good morning, Alex"                    ← Outside greeting
                              ⚙️ 👤        ← Minimal icons
   ┌───────────────────────────────┐
   │  💬 Chat History ▼            │      ← Dropdown
   │                               │
   │  ┌─────────────────────────┐  │
   │  │ 🤖 You have 3 overdue   │  │
   │  │    invoices...          │  │
   │  └─────────────────────────┘  │
   │                               │
   │  ┌──────┐ ┌──────┐ ┌──────┐  │
   │  │📋 Tax│ │💰Bill│ │📊Cash│  │      ← Suggestion chips
   │  └──────┘ └──────┘ └──────┘  │
   │                               │
   │  ┌─────────────────────┐ 🎤  │      ← Input + voice
   │  │ Ask anything...     │     │
   │  └─────────────────────┘     │
   └───────────────────────────────┘
```

---

## Phase Breakdown

### Phase 1: Design System Foundation (2 agents parallel)
**Agent 1 - PRISM-TOKENS**: Design tokens + Tailwind config
**Agent 2 - PRISM-COMPONENTS**: Base component primitives

### Phase 2: Animation System (2 agents parallel)
**Agent 3 - MOTION-CORE**: GSAP page transitions + morph
**Agent 4 - MOTION-BG**: Gradient mesh background

### Phase 3: Core UI (3 agents parallel)
**Agent 5 - PRISM-ONBOARD**: Onboarding flow with animations
**Agent 6 - PRISM-CHAT**: Chat container + input + voice
**Agent 7 - PRISM-HISTORY**: Chat history dropdown

### Phase 4: Polish (2 agents parallel)
**Agent 8 - PRISM-HEADER**: Minimal header + greeting
**Agent 9 - PRISM-SUGGESTIONS**: AI suggestion chips

---

## Files to Create/Modify

### New Files
- `src/styles/design-tokens.css` - CSS custom properties
- `src/styles/components.css` - Base component styles
- `src/components/ui/animated-container.tsx` - Core container
- `src/components/ui/morph-button.tsx` - Morphing button
- `src/components/animation/page-transition.tsx` - Page wrapper
- `src/components/animation/gradient-background.tsx` - Background
- `src/hooks/usePageTransition.ts` - Transition hook
- `src/hooks/useVoiceRecording.ts` - Voice input hook
- `src/components/chat/ChatHistoryDropdown.tsx` - History UI
- `src/components/chat/VoiceInput.tsx` - Voice recording
- `public/logo.svg` - Brand logo

### Modified Files
- `tailwind.config.js` - Extended theme
- `src/app/layout.tsx` - Add background + providers
- `src/app/(auth)/login/page.tsx` - Redesigned login
- `src/app/onboarding/*` - All onboarding steps
- `src/app/(dashboard)/chat/page.tsx` - Chat redesign
- `src/app/(dashboard)/layout.tsx` - Minimal header

---

## Success Metrics
- [ ] All animations run at 60fps
- [ ] Accessibility: WCAG AA compliant
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] User can complete onboarding in < 2 minutes
- [ ] Voice recording works on mobile

---

## Notes
- GSAP is already installed in the project
- Using Lucide icons exclusively
- Logo source: D:\Neuer Ordner\print\ai\guru.svg
