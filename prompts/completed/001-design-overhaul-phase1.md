<objective>
Execute Phase 1 of the Operate frontend design overhaul, working as four cooperating agents to normalize design tokens, align layouts with the visual brief, establish the chatbot-first structure, and implement a persistent checkpoint system.

This phase focuses on foundation work - NO GSAP morphing. The goal is a cohesive, minimal, whitespace-heavy design system with the AI chatbot as the visual and interaction hero.
</objective>

<context>
**Project**: Operate - AI chatbot SaaS for company automation (taxes, invoices, client bills)
**Tech Stack**: Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui, GSAP
**Location**: C:\Users\grube\op\operate-fresh

**Why this matters**: The app's success depends on users immediately understanding that the chatbot is central. Clean design tokens, consistent layouts, and proper spacing create a professional, trustworthy experience that makes users want to stay.

Read CLAUDE.md first for project conventions.
</context>

<research>
Before implementing, thoroughly read these files to understand existing patterns:

**Required reading (all agents)**:
- `./agents/DESIGN_SYSTEM.md`
- `./agents/DESIGN_OVERHAUL_PLAN.md`
- `./agents/DESIGN_OVERHAUL_FILES.md`

**As needed**:
- `./apps/web/src/styles/design-tokens.css`
- `./apps/web/src/styles/components.css`
- `./apps/web/src/styles/gradient-background.css`
- `./apps/web/src/app/(auth)/login/page.tsx`
- `./apps/web/src/app/(auth)/onboarding/layout.tsx`
- `./apps/web/src/app/(auth)/onboarding/page.tsx`
- `./apps/web/src/app/(dashboard)/layout.tsx`
- `./apps/web/src/app/(dashboard)/chat/page.tsx`
</research>

<requirements>
**HARD VISUAL/UX REQUIREMENTS** (apply to all work):

1. **Style**: Minimal, whitespace-heavy, flat. No skeuomorphic effects. Shadows subtle (from design system only).

2. **Color Palette** (use ONLY these via CSS variables, NEVER hardcode hex):
   - Primary: #06BF9D
   - Accent 1: #48D9BE
   - Accent 2: #84D9C9
   - Accent 3: #C4F2EA
   - Background light: #F2F2F2

3. **Shapes**: Rectangles with rounded corners. Every onboarding step in a single rounded rectangle. Chat interface as matching rectangle.

4. **Icons**: Lucide only. No mixing icon sets.

5. **Chat-centric**: Chatbot rectangle is the visual hero. After onboarding: prominent chat rectangle with suggestions. Minimal header outside (greeting + 1-3 icons).
</requirements>

<implementation>

## AGENT-TOKENS: Design System & Colors

1. Open `./apps/web/src/styles/design-tokens.css`
2. Normalize tokens to match the required palette:
   - Define `--color-primary`, `--color-accent-1`, `--color-accent-2`, `--color-accent-3`, `--color-background-light`
   - Ensure semantic colors (success, warning, error) meet WCAG contrast requirements
3. Audit and refactor hardcoded hex colors in:
   - `./apps/web/src/components/ui/*`
   - `./apps/web/src/app/(auth)/*`
   - `./apps/web/src/app/(dashboard)/*`
   Replace with CSS variables or Tailwind classes mapping to tokens.
4. Update Tailwind config (`tailwind.config.ts` or `.js`) to mirror token names.

**WHY token centralization matters**: Enables easy theming, ensures consistency, prevents color drift across the codebase.

---

## AGENT-LAYOUT: Rectangles, Spacing, and Structure

### Auth & Onboarding
1. Login/onboarding cards:
   - Rectangular with consistent border-radius from tokens
   - Max widths: login ~420-460px, onboarding ~560px
   - Padding/spacing strictly from spacing tokens (no arbitrary values)
2. Background: Use gradient background component (soft blurred blobs)
3. Onboarding:
   - Each step's content in single main rectangle, centered, slightly above vertical center
   - Bottom bar with: "Back" button | Step indicator ("Step X of 8, ~N min remaining") | "Next" button

### Chat Landing (Structure Only)
In `./apps/web/src/app/(dashboard)/layout.tsx` and `./apps/web/src/app/(dashboard)/chat/page.tsx`:

1. Minimal header OUTSIDE chat rectangle:
   - Left: greeting headline (e.g., "Good morning, Alex")
   - Right: 1-3 Lucide icons (dashboard, notifications, settings/user)

2. Chat rectangle (main element):
   - Same/compatible radius and padding as onboarding
   - Centered on viewport, on gradient background
   - Inside the rectangle:
     - Top: space for chat history dropdown (future)
     - Main: message stream area
     - Bottom: text input + future voice button placeholder

3. Add placeholder suggestion chips inside chat rectangle:
   - "Taxes", "Invoices", "Client bills" as clickable chips

**WHY consistent geometry matters**: Creates visual continuity from onboarding to chat, reducing cognitive load.

---

## AGENT-UX-FOCUS: "Why Stay?" & Unforgettable Experience

1. Ensure chatbot rectangle is visually dominant over secondary navigation
2. On landing (post-onboarding):
   - Clear headline outside rectangle
   - Friendly microcopy inside
   - Suggestion chips as conversation starters
3. Write section in `./agents/IMPLEMENTATION_LOG.md` titled "Vision – Making the experience unforgettable" with 5-7 concrete UX decisions for future prompts:
   - Subtle micro-animations
   - Helpful empty states
   - Proactive suggestions
   - Lightweight progress indicators
   - etc.

---

## AGENT-DOCS: Checkpointing (MANDATORY)

After AGENT-TOKENS and AGENT-LAYOUT finish each subtask:

1. Create/append to `./agents/IMPLEMENTATION_LOG.md`:
   ```markdown
   ### [STEP NAME] – [AGENT NAME]
   - What changed (files, components, tokens)
   - Why it changed
   - Open TODOs
   ```

2. Update `./agents/DESIGN_OVERHAUL_TRACKER.md`:
   - Mark items completed or in progress
   - Add any new files/components introduced
   - Note intentional deviations from original plan (with reasons)

**WHY checkpointing matters**: If chat context is lost, progress persists in the repo. Nothing is forgotten.

</implementation>

<output>
Modify/create files with these relative paths:

**Tokens & Config**:
- `./apps/web/src/styles/design-tokens.css` - normalized color/spacing tokens
- `./apps/web/tailwind.config.ts` (or `.js`) - token mappings

**Layouts**:
- `./apps/web/src/app/(auth)/login/page.tsx` - aligned login card
- `./apps/web/src/app/(auth)/onboarding/layout.tsx` - onboarding wrapper
- `./apps/web/src/app/(auth)/onboarding/page.tsx` - step container
- `./apps/web/src/app/(dashboard)/layout.tsx` - dashboard with header
- `./apps/web/src/app/(dashboard)/chat/page.tsx` - chat rectangle + suggestions

**Documentation**:
- `./agents/IMPLEMENTATION_LOG.md` - checkpoint entries for each agent
- `./agents/DESIGN_OVERHAUL_TRACKER.md` - updated status
</output>

<response_format>
Structure your response EXACTLY as follows:

## 1) SUMMARY BY AGENT
- **AGENT-TOKENS**: [what was done]
- **AGENT-LAYOUT**: [what was done]
- **AGENT-UX-FOCUS**: [what was done]
- **AGENT-DOCS**: [what was done]

## 2) KEY CODE CHANGES
Show the most important snippets:
- Design tokens CSS
- Layout wrappers for login/onboarding/chat
- Header + chat rectangle
- Placeholder suggestions

## 3) CHECKPOINTS UPDATED
- Headings and bullet lists added to `IMPLEMENTATION_LOG.md`
- Rows/sections updated in `DESIGN_OVERHAUL_TRACKER.md`
</response_format>

<constraints>
- Do NOT implement GSAP morphing - that is for a future prompt
- Do NOT hardcode hex colors - always use CSS variables
- Do NOT mix icon sets - Lucide only
- Do NOT use arbitrary Tailwind values - use design tokens
- Do NOT skip checkpoint updates - they are mandatory
</constraints>

<verification>
Before declaring complete, verify:

1. **Tokens**: All colors in design-tokens.css match the required palette. No hardcoded hex values in modified files.

2. **Layouts**:
   - Login card respects max-width and uses token spacing
   - Onboarding steps are in single rectangles with consistent geometry
   - Chat page has header outside, chat rectangle inside, suggestion chips present

3. **Checkpoints**:
   - IMPLEMENTATION_LOG.md has sections for each agent
   - DESIGN_OVERHAUL_TRACKER.md reflects completed items

4. **No GSAP**: Confirm no morphing animations were added
</verification>

<success_criteria>
- All four agents' tasks completed as specified
- Design tokens normalized with semantic CSS variables
- Login, onboarding, and chat layouts aligned with visual brief
- Chatbot rectangle is visually prominent with placeholder suggestions
- Both checkpoint files updated with detailed progress
- Response follows the exact format specified
</success_criteria>
