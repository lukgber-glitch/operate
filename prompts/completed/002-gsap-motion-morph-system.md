<objective>
Implement Phase 2 of the Operate design overhaul: the GSAP motion system with button→rectangle morph animations.

This creates the signature "unforgettable" animation where clicking a button causes all UI to fade except the button background, which then morphs/expands into the next screen's container rectangle before the new content fades in.

**Why this matters**: This animation pattern creates visual continuity and delight, making transitions feel magical rather than jarring. Users see the button "become" the next screen.
</objective>

<context>
**Project**: Operate - AI chatbot SaaS for company automation
**Tech Stack**: Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui, GSAP
**Location**: C:\Users\grube\op\operate-fresh
**Phase**: 2 of design overhaul (Phase 1 tokens/layouts complete)

**Builds on Phase 1**:
- Design tokens normalized (CSS variables)
- Layouts aligned (login 440px, onboarding 560px, chat 800px)
- Checkpoint system established

Read CLAUDE.md and `agents/IMPLEMENTATION_LOG.md` for project context.
</context>

<research>
Before implementing, thoroughly examine these existing files:

**Existing animation components** (refactor/integrate):
- `./apps/web/src/components/animation/MorphButton.tsx` - existing morph button
- `./apps/web/src/components/animation/PageTransition.tsx` - page transitions
- `./apps/web/src/components/animation/TransitionProvider.tsx` - transition context
- `./apps/web/src/components/onboarding/StepTransition.tsx` - step transitions
- `./apps/web/src/lib/animation/gsap-utils.ts` - GSAP utilities

**Pages to wire**:
- `./apps/web/src/app/(auth)/login/LoginPageWithAnimation.tsx` - login card
- `./apps/web/src/components/auth/login-form.tsx` - sign in button location
- `./apps/web/src/components/onboarding/OnboardingWizard.tsx` - step navigation
- `./apps/web/src/app/(dashboard)/chat/page.tsx` - chat container
</research>

<requirements>

## GLOBAL ANIMATION BRIEF (HARD REQUIREMENTS)

The button→rectangle morph pattern must work as follows:

### Sign In Button Click (Login → Onboarding Step 1)
1. All UI in login card fades out EXCEPT the button background (button rectangle stays)
2. Empty button briefly persists (100-150ms)
3. Button grows/expands into size and position of first onboarding step rectangle
4. Onboarding content fades in inside the new rectangle

### Next Button Click (Onboarding Step N → Step N+1)
1. All UI in current step fades out EXCEPT the "Next" button shape
2. Empty button briefly persists
3. Button grows into dimensions of next step's rectangle
4. Next step's content appears

### Final Morph (Last Onboarding Step → Chat)
- Same pattern: button morphs into main chat rectangle
- Chat content fades in

### Long-term Rule
Whenever the app changes major context (login → onboarding → chat → other sections), use this morph pattern.

</requirements>

<implementation>

## AGENT-MOTION-CORE: Architecture & Primitives

### 1. AnimatedContainer (`./apps/web/src/components/ui/animated-container.tsx`)

Create a wrapper component for morphable rectangles:

```typescript
interface AnimatedContainerProps {
  morphId: string;                    // Unique ID for morph targeting
  children: React.ReactNode;
  className?: string;
  onEnterComplete?: () => void;
  onExitComplete?: () => void;
}
```

Requirements:
- Accepts stable `morphId` string for cross-component targeting
- ENTER animation: opacity 0→1, scale 0.95→1, duration 0.25s, ease: 'power1.out'
- EXIT animation: opacity 1→0, scale 1→0.95, duration 0.2s, ease: 'power1.out'
- Expose imperative API via ref: `triggerExit()`, `triggerEnter()`
- Register itself with TransitionProvider context on mount

### 2. MorphButton (`./apps/web/src/components/ui/morph-button.tsx`)

Adapt/wrap existing MorphButton with enhanced morph capability:

```typescript
interface MorphButtonProps {
  targetId: string;                   // morphId of target AnimatedContainer
  onMorphStart?: () => void;
  onMorphComplete?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}
```

Visual behavior:
- Normal state: standard button with text/icon
- On click:
  1. Text and icon fade out (opacity 0, duration 0.15s)
  2. Button background remains visible
  3. After brief pause, background morphs to target rect

### 3. usePageTransition Hook (`./apps/web/src/hooks/usePageTransition.ts`)

Orchestrates the full morph sequence:

```typescript
interface UsePageTransitionReturn {
  triggerTransition: (
    buttonRef: RefObject<HTMLButtonElement>,
    sourceId: string,
    targetId: string,
    onComplete?: () => void
  ) => void;
  isTransitioning: boolean;
}
```

GSAP Timeline sequence:
1. **Phase 1 - Content Exit** (0.2s, ease: 'power1.out')
   - Fade out all content in source container EXCEPT button
   - Button text/icon fades to opacity 0

2. **Phase 2 - Button Persist** (0.1s pause)
   - Empty button background visible alone

3. **Phase 3 - Morph** (0.4s, ease: 'power2.inOut')
   - Get button's current rect (getBoundingClientRect)
   - Get target container's rect
   - Animate button: position, width, height, borderRadius to match target
   - Use GSAP transform (translateX, translateY, scaleX, scaleY) for performance

4. **Phase 4 - Content Enter** (0.25s, ease: 'power1.out')
   - Target container content fades in
   - Scale 0.95 → 1

**Performance requirements**:
- Use transform + opacity only (GPU accelerated)
- Use will-change hints
- Kill animations on unmount

### 4. Integration with Existing Components

Update these files with comments documenting when to use each:

**PageTransition.tsx**: For route-level transitions (between pages)
**AnimatedContainer**: For morphable content blocks within a page
**StepTransition**: For step-to-step animations (within onboarding wizard)
**MorphButton + usePageTransition**: For button-to-container morph effects

---

## AGENT-MOTION-APPLY: Auth & Onboarding Wiring

### 1. Login → Onboarding Morph

In `./apps/web/src/app/(auth)/login/LoginPageWithAnimation.tsx`:

- Wrap login card content in `AnimatedContainer` with `morphId="login-card"`
- Replace sign-in button with `MorphButton`:
  - `targetId="onboarding-step-welcome"` (first step)
- On successful login:
  1. Call `usePageTransition.triggerTransition()`
  2. After morph completes, navigate to `/onboarding`

In `./apps/web/src/components/auth/login-form.tsx`:
- Export button ref for parent to access
- Or lift the MorphButton usage to parent component

### 2. Onboarding Step Morphs

In `./apps/web/src/components/onboarding/OnboardingWizard.tsx`:

- Wrap each step's content in `AnimatedContainer`:
  - `morphId="onboarding-step-{stepId}"` (welcome, company-info, banking, etc.)
- Replace "Next" button with `MorphButton`:
  - `targetId` = next step's morphId
  - For final step: `targetId="main-chat-card"`

Container ID mapping:
| morphId | Component/Page |
|---------|----------------|
| `login-card` | LoginPageWithAnimation |
| `onboarding-step-welcome` | WelcomeStep |
| `onboarding-step-company-info` | CompanyInfoStep |
| `onboarding-step-company-profile` | CompanyProfileStep |
| `onboarding-step-email` | EmailStep |
| `onboarding-step-banking` | BankingStep |
| `onboarding-step-accounting` | AccountingStep |
| `onboarding-step-tax` | TaxStep/TaxSoftwareStep |
| `onboarding-step-preferences` | PreferencesStep |
| `onboarding-step-completion` | CompletionStep |
| `main-chat-card` | ChatPage main container |

### 3. Final Morph to Chat

In CompletionStep:
- "Go to Dashboard" or final button is `MorphButton` with `targetId="main-chat-card"`
- On click: morph then navigate to `/chat`

In `./apps/web/src/app/(dashboard)/chat/page.tsx`:
- Wrap main chat container in `AnimatedContainer` with `morphId="main-chat-card"`

### 4. Edge Cases

- **Window resize**: Recalculate target rect before morph if resize detected
- **Back navigation**: Reverse morph direction or use simpler fade transition
- **Route constraints**: If morph across routes is impossible, implement closest effect:
  - Fade out source page
  - Navigate
  - Fade in target with same visual position

---

## AGENT-DOCS: Checkpoints

Update `./agents/IMPLEMENTATION_LOG.md` with:

```markdown
### MOTION-CORE – Architecture (AGENT-MOTION-CORE)
- Created AnimatedContainer for morphable blocks
- Created MorphButton with targetId linking
- Created usePageTransition hook with GSAP timeline
- Timeline: EXIT (0.2s) → PERSIST (0.1s) → MORPH (0.4s) → ENTER (0.25s)
- Integrated with TransitionProvider context
- Files: animated-container.tsx, morph-button.tsx, usePageTransition.ts
- Open TODOs: [list any]

### MOTION-APPLY – Auth & Onboarding (AGENT-MOTION-APPLY)
- Wired login card with morphId="login-card"
- Wired onboarding steps with morphId="onboarding-step-{id}"
- Wired chat container with morphId="main-chat-card"
- MorphButton replaces Next/SignIn buttons
- Files changed: LoginPageWithAnimation, OnboardingWizard, step components, chat/page
- Limitations: [document any cross-route constraints]

### Container ID Map
| morphId | Component |
|---------|-----------|
| login-card | LoginPageWithAnimation |
| onboarding-step-welcome | WelcomeStep |
| ... | ... |
| main-chat-card | ChatPage |
```

Update `./agents/DESIGN_OVERHAUL_TRACKER.md`:
- Mark "Motion Architecture" as COMPLETE
- Mark "Sign In → Onboarding morph" as COMPLETE
- Mark "Next button morphs" as COMPLETE
- Mark "Onboarding → Chat morph" as COMPLETE

</implementation>

<output>

Create/modify these files:

**New files**:
- `./apps/web/src/components/ui/animated-container.tsx`
- `./apps/web/src/components/ui/morph-button.tsx` (or update existing)
- `./apps/web/src/hooks/usePageTransition.ts`

**Modified files**:
- `./apps/web/src/app/(auth)/login/LoginPageWithAnimation.tsx`
- `./apps/web/src/components/auth/login-form.tsx`
- `./apps/web/src/components/onboarding/OnboardingWizard.tsx`
- `./apps/web/src/components/onboarding/steps/WelcomeStep.tsx`
- `./apps/web/src/components/onboarding/steps/CompletionStep.tsx`
- `./apps/web/src/app/(dashboard)/chat/page.tsx`
- `./apps/web/src/components/animation/TransitionProvider.tsx` (if needed)

**Documentation**:
- `./agents/IMPLEMENTATION_LOG.md`
- `./agents/DESIGN_OVERHAUL_TRACKER.md`

</output>

<response_format>
Structure your response EXACTLY as follows:

## 1) SUMMARY BY AGENT
- **AGENT-MOTION-CORE**: [architecture and APIs created]
- **AGENT-MOTION-APPLY**: [where morphs are wired in]
- **AGENT-DOCS**: [which checkpoint files were updated]

## 2) CORE CODE SNIPPETS
Show actual code for:
- animated-container.tsx (full implementation)
- morph-button.tsx (full implementation)
- usePageTransition.ts (full implementation)
- Key changes to LoginPageWithAnimation
- Key changes to OnboardingWizard
- Key changes to chat/page.tsx
- Example of triggerTransition call

## 3) CHECKPOINTS UPDATED
- Headings and bullet lists added to IMPLEMENTATION_LOG.md
- Rows updated in DESIGN_OVERHAUL_TRACKER.md
</response_format>

<constraints>
- Do NOT skip any animation phases (exit → persist → morph → enter)
- Do NOT use CSS-only animations for the morph - use GSAP for precise control
- Do NOT hardcode pixel values - calculate dynamically from getBoundingClientRect
- Do NOT forget to handle reduced motion preference
- Do NOT leave any placeholder code - implement fully working animations
- Do NOT just describe what should happen - show actual code evidence
</constraints>

<verification>
Before declaring complete, verify:

1. **AnimatedContainer** renders children and exposes triggerEnter/triggerExit
2. **MorphButton** fades text on click and can initiate morph
3. **usePageTransition** creates working GSAP timeline with correct timing
4. **Login page** has MorphButton that targets onboarding
5. **OnboardingWizard** has MorphButtons for each step transition
6. **Chat page** has AnimatedContainer ready to receive morph
7. **Documentation** updated with MOTION-CORE and MOTION-APPLY sections
8. **Reduced motion** is respected (skip animations if prefers-reduced-motion)
</verification>

<success_criteria>
- All three agents' tasks completed as specified
- GSAP timeline orchestrates: EXIT (0.2s) → PERSIST (0.1s) → MORPH (0.4s) → ENTER (0.25s)
- Sign In button morphs to onboarding step 1
- Each Next button morphs to next step
- Final step morphs to chat container
- Container ID map documented
- Both checkpoint files updated
- Response includes actual code snippets (not just descriptions)
</success_criteria>
