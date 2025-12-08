# Roadmap: Operate UI Beautification

## Overview

Transform Operate into a minimal, chatbot-centric, unforgettable experience with morphing animations, animated logo states, and glassmorphic design.

## Phases

- [ ] **Phase 1: Design System Foundation** - Blue palette, tokens, typography, icons
- [ ] **Phase 2: Morphing Animation System** - Framer Motion layoutId implementation
- [ ] **Phase 3: Chat-Centric Landing** - New landing layout with chat hero (uses existing GuruLoader)
- [ ] **Phase 4: Glassmorphic Cards & Backgrounds** - Visual treatment layer
- [ ] **Phase 5: Voice Input Integration** - Microphone with visual feedback
- [ ] **Phase 6: Chat History Dropdown** - Searchable history with grouping
- [ ] **Phase 7: Micro-Interactions** - Button hovers, success states, celebrations
- [ ] **Phase 8: Onboarding Morph Flow** - Card-to-card morphing transitions
- [ ] **Phase 9: Accessibility & Polish** - WCAG audit, dark mode, reduced motion

**Note**: GuruLoader already exists (`components/ui/guru-loader.tsx`) with spinning animation - will use for AI thinking state.

---

## Phase Details

### Phase 1: Design System Foundation
**Goal**: Establish consistent blue palette, typography, and icon usage
**Depends on**: Nothing (first phase)
**Plans**: 3 plans

Plans:
- [ ] 01-01: Update globals.css and design-tokens.css with blue palette CSS variables
- [ ] 01-02: Update tailwind.config.js with extended blue color scale
- [ ] 01-03: Audit and standardize icon usage (Lucide only, consistent sizes)

**Key Files**:
- `apps/web/src/app/globals.css`
- `apps/web/src/styles/design-tokens.css`
- `apps/web/tailwind.config.js`

---

### Phase 2: Morphing Animation System
**Goal**: Implement reusable morphing components with Framer Motion
**Depends on**: Nothing (can run parallel with Phase 1)
**Plans**: 3 plans

Plans:
- [ ] 02-01: Create MorphContainer and MorphButton base components
- [ ] 02-02: Create useMorphTransition hook for state management
- [ ] 02-03: Add reduced motion support and accessibility

**Key Files**:
- `apps/web/src/components/animation/MorphContainer.tsx`
- `apps/web/src/components/animation/MorphButton.tsx`
- `apps/web/src/hooks/use-morph-transition.ts`
- `apps/web/src/hooks/use-reduced-motion.ts`

---

### Phase 3: Chat-Centric Landing
**Goal**: Redesign main layout with chat as hero, minimal header
**Depends on**: Phase 1, Phase 2
**Plans**: 4 plans

Plans:
- [x] 03-01: Create new ChatLanding page component
- [x] 03-02: Build greeting headline + suggestion pills component
- [x] 03-03: Refactor ChatPanel as central rectangle (not floating overlay)
- [x] 03-04: Create minimal header with dashboard/settings icons

**Key Files**:
- `apps/web/src/app/(dashboard)/chat/page.tsx` (or new route)
- `apps/web/src/components/chat/ChatLanding.tsx`
- `apps/web/src/components/chat/SuggestionPills.tsx`
- `apps/web/src/components/dashboard/MinimalHeader.tsx`

---

### Phase 4: Glassmorphic Cards & Backgrounds
**Goal**: Apply glassmorphism to chat container, add animated gradient background
**Depends on**: Phase 1 (uses palette), Phase 3 (chat layout)
**Plans**: 3 plans

Plans:
- [x] 04-01: Create GlassCard component with blur/transparency
- [x] 04-02: Create AnimatedGradientBackground component
- [x] 04-03: Apply glass treatment to chat panel and onboarding cards

**Key Files**:
- `apps/web/src/components/ui/glass-card.tsx`
- `apps/web/src/components/ui/animated-gradient-background.tsx`
- `apps/web/src/styles/glassmorphism.css`

---

### Phase 5: Voice Input Integration
**Goal**: Add voice input with visual feedback states
**Depends on**: Phase 3 (chat input area)
**Plans**: 3 plans

Plans:
- [ ] 05-01: Create VoiceInputButton with morphing states (idle/listening/processing)
- [ ] 05-02: Implement useVoiceRecording hook with Web Speech API
- [ ] 05-03: Add real-time transcription display and error handling

**Key Files**:
- `apps/web/src/components/chat/VoiceInputButton.tsx` (enhance existing)
- `apps/web/src/hooks/use-voice-recording.ts`

---

### Phase 6: Chat History Dropdown
**Goal**: Searchable chat history with time grouping
**Depends on**: Phase 3 (chat layout)
**Plans**: 2 plans

Plans:
- [ ] 06-01: Create ChatHistoryDropdown with search and grouping
- [ ] 06-02: Add keyboard shortcut (Cmd+K) and hover actions (rename, delete, pin)

**Key Files**:
- `apps/web/src/components/chat/ChatHistoryDropdown.tsx`
- `apps/web/src/components/chat/ConversationItem.tsx` (enhance)

---

### Phase 7: Micro-Interactions
**Goal**: Add delightful animations to all interactive elements
**Depends on**: Phase 3, Phase 4
**Plans**: 4 plans

Plans:
- [ ] 07-01: Button hover/tap animations (scale 1.02×/0.98×)
- [ ] 07-02: Card hover animations (shadow lift)
- [ ] 07-03: Success/completion animations (checkmark expand, confetti)
- [ ] 07-04: Error animations (shake, red flash)

**Key Files**:
- `apps/web/src/components/ui/button.tsx` (enhance with motion)
- `apps/web/src/components/ui/card.tsx` (enhance)
- `apps/web/src/components/ui/celebrations.tsx` (new)
- `apps/web/src/styles/micro-interactions.css`

---

### Phase 8: Onboarding Morph Flow
**Goal**: Add morphing transitions to existing 8-step onboarding (no structural changes)
**Depends on**: Phase 2 (morph system), Phase 4 (glass cards)
**Plans**: 3 plans

Plans:
- [ ] 08-01: Add morphing card transitions between existing 8 steps
- [ ] 08-02: Apply glassmorphic styling to OnboardingWizard cards
- [ ] 08-03: Enhance progress indicator with smooth animations

**Existing 8 Steps (preserved)**:
1. Welcome → 2. Company Info → 3. Banking → 4. Email → 5. Tax → 6. Accounting → 7. Preferences → 8. Complete

**Key Files**:
- `apps/web/src/components/onboarding/OnboardingWizard.tsx` (enhance, not refactor)
- `apps/web/src/components/onboarding/StepTransition.tsx` (enhance)
- `apps/web/src/components/onboarding/OnboardingProgress.tsx` (enhance)

---

### Phase 9: Accessibility & Polish
**Goal**: WCAG AAA compliance, dark mode, reduced motion, final polish
**Depends on**: All previous phases
**Plans**: 4 plans

Plans:
- [ ] 09-01: Accessibility audit and fixes (contrast, focus, ARIA)
- [ ] 09-02: Implement dark mode with inverted blue palette
- [ ] 09-03: Add reduced motion alternatives for all animations
- [ ] 09-04: Performance optimization and mobile testing

**Key Files**:
- `apps/web/src/styles/accessibility.css`
- `apps/web/src/styles/dark-mode.css`
- `apps/web/src/hooks/use-reduced-motion.ts`

---

## Progress

| Phase | Plans Complete | Status | Notes |
|-------|----------------|--------|-------|
| 1. Design System | 3/3 | COMPLETE | Blue palette, tokens, tailwind |
| 2. Morph System | 3/3 | COMPLETE | MorphButton, MorphContainer, hooks |
| 3. Chat Landing | 4/4 | COMPLETE | ChatLanding, SuggestionPills, ChatCentralPanel, MinimalHeader |
| 4. Glassmorphism | 3/3 | COMPLETE | GlassCard, AnimatedGradientBackground, glass utilities |
| 5. Voice Input | 0/3 | PENDING | Needs 3 |
| 6. Chat History | 0/2 | PENDING | Needs 3 |
| 7. Micro-Interactions | 0/4 | PENDING | Needs 3, 4 |
| 8. Onboarding Morph | 0/3 | PENDING | Needs 2, 4 |
| 9. Accessibility | 0/4 | PENDING | Final phase |

**Note**: Animated Logo phase removed - using existing `GuruLoader` component.

---

## Dependency Graph

```
Phase 1 (Design) ────┬────> Phase 2 (Morph) ────┐
                     │                           │
                     v                           v
                Phase 3 (Chat Landing) ◄────────┘
                     │
        ┌────────────┼────────────┐
        v            v            v
   Phase 4      Phase 5      Phase 6
  (Glass)      (Voice)     (History)
        │            │
        v            │
   Phase 7 ◄─────────┘
  (Micro-Int)
        │
        v
   Phase 8 (Onboarding) ◄── Phase 2
        │
        v
   Phase 9 (Accessibility)
```

---

## Key Information

**Tech Stack**:
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Framer Motion (animation)
- Lucide React (icons)

**Color Palette** (from brief):
- Primary 100: #E3F2FD (backgrounds)
- Primary 500: #1E88E5 (brand)
- Primary 600: #1565C0 (buttons)
- Primary 700: #0D47A1 (text emphasis)

**Animation Timing**:
- Micro-interactions: 200-300ms
- Morphing: 400-600ms (spring)
- Logo breathing: 4s loop
- Logo thinking glow: 2s loop

**Accessibility Targets**:
- WCAG AAA contrast ratios
- Keyboard navigation everywhere
- Screen reader compatibility
- Reduced motion support

---

## Related Files

- Brief: `.planning/BRIEF-ui-beautification.md`
- Style Inventory: `.planning/STYLE_INVENTORY.md`
