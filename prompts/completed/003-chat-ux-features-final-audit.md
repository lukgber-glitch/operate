<objective>
Execute Phase 3 of the Operate design overhaul: Chat UX, Features (history + voice), and Final Audit.

This phase completes the design overhaul by:
1. Perfecting the main chat experience with suggestions and retention features
2. Adding chat history dropdown and voice input capabilities
3. Conducting a final end-to-end audit of the entire flow
4. Ensuring all checkpoint documentation is complete

**Why this matters**: The chat is the core of Operate. Users must immediately understand it's the hero element, feel delighted by the experience, and have tools (history, voice) that make interaction effortless.
</objective>

<context>
**Project**: Operate - AI chatbot SaaS for company automation
**Tech Stack**: Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui, GSAP
**Location**: C:\Users\grube\op\operate-fresh
**Phase**: 3 of design overhaul (Phases 1-2 complete)

**Builds on previous phases**:
- Phase 1: Design tokens normalized, layouts aligned (login 440px, onboarding 560px, chat 800px)
- Phase 2: GSAP motion system with button→rectangle morphs

Read CLAUDE.md and `agents/IMPLEMENTATION_LOG.md` for project context.
</context>

<research>
Before implementing, examine these existing files:

**Design System**:
- `./apps/web/src/styles/design-tokens.css` - color palette, spacing, radius
- `./apps/web/src/app/globals.css` - global styles

**Existing Components**:
- `./apps/web/src/components/ui/animated-container.tsx` - morphable containers
- `./apps/web/src/components/animation/MorphButton.tsx` - morph buttons
- `./apps/web/src/hooks/usePageTransition.ts` - transition orchestration

**Pages to modify**:
- `./apps/web/src/app/(dashboard)/layout.tsx` - dashboard layout
- `./apps/web/src/app/(dashboard)/chat/page.tsx` - main chat page

**For audit**:
- `./apps/web/src/app/(auth)/login/LoginPageWithAnimation.tsx`
- `./apps/web/src/components/onboarding/OnboardingWizard.tsx`
</research>

<requirements>

## HARD VISUAL/UX REQUIREMENTS

1. **Chat Card**: Same rectangular visual language as onboarding (rounded rectangle, same radius/spacing tokens), gradient background, visual hero on page.

2. **Color Palette** (ONLY these via CSS variables):
   - Primary: #06BF9D
   - Accent 1: #48D9BE
   - Accent 2: #84D9C9
   - Accent 3: #C4F2EA
   - Background light: #F2F2F2

3. **Icons**: Lucide only. No mixing icon sets.

4. **Style**: Minimal, flat, whitespace-heavy. No skeuomorphic effects.

</requirements>

<implementation>

## AGENT-CHAT-UX: Layout, Suggestions, Retention

### 1. Chat Card Layout
In `./apps/web/src/app/(dashboard)/chat/page.tsx`:

Ensure:
- Gradient background is active (same as login/onboarding)
- Chat card uses AnimatedContainer with `morphId="main-chat-card"`
- Header OUTSIDE the card:
  - Top-left: greeting headline (e.g., "Good morning, Alex")
  - Top-right: 2-3 Lucide icons (Home, Bell, User)
- Use spacing and typography tokens

### 2. SuggestionChips Component
Create `./apps/web/src/components/chat/SuggestionChips.tsx`:

```typescript
interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

const suggestions = [
  { label: "Help me with taxes", icon: "Calculator" },
  { label: "Prepare invoices for this month", icon: "FileText" },
  { label: "Review client bills", icon: "Receipt" },
  { label: "Explain my cash flow", icon: "TrendingUp" },
];
```

Requirements:
- Chips styled with design tokens (radius, colors, spacing)
- Keyboard accessible with visible focus styles
- Subtle hover animation (scale 1.02, ease-out)
- Display below/near latest assistant message in empty state

### 3. Retention Documentation
Add to `agents/IMPLEMENTATION_LOG.md`:
- "Retention & Unforgettable Experience – Chat" section
- Document UX decisions: helpful first-time state, friendly microcopy, micro-animations, whitespace

---

## AGENT-CHAT-FEATURES: History & Voice

### 1. ChatHistoryDropdown
Create `./apps/web/src/components/chat/ChatHistoryDropdown.tsx`:

```typescript
interface ChatHistory {
  id: string;
  title: string;
  date: Date;
  preview?: string;
}

interface ChatHistoryDropdownProps {
  conversations: ChatHistory[];
  onSelect: (id: string) => void;
  currentId?: string;
}
```

Requirements:
- Position: top-right inside the chat card header area
- Visual: minimal, flat, uses design tokens
- Animation: light fade/slide in (0.2s, power1.out)
- Accessible keyboard navigation
- Shows recent conversations with titles/dates
- Dropdown trigger shows current conversation title

### 2. useVoiceRecording Hook
Create `./apps/web/src/hooks/useVoiceRecording.ts`:

```typescript
interface UseVoiceRecordingReturn {
  isRecording: boolean;
  hasPermission: boolean | null;
  error: string | null;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}
```

Requirements:
- Uses browser MediaRecorder API
- Handles permission states gracefully
- Exposes clear state for UI feedback
- Cleans up on unmount

### 3. VoiceInput Component
Create `./apps/web/src/components/chat/VoiceInput.tsx`:

```typescript
interface VoiceInputProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}
```

Requirements:
- Microphone button using Lucide Mic icon
- Visual feedback when recording: subtle pulsing border or dot
- Uses design tokens (colors, radius)
- Flat style, no 3D effects
- Accessible with proper ARIA labels

### 4. Wire into Chat Page
Update `./apps/web/src/app/(dashboard)/chat/page.tsx`:
- Add ChatHistoryDropdown in chat header area (inside card, top)
- Add VoiceInput next to text input at bottom
- Maintain spacing rules and focus on chat card

### 5. Documentation
Add "CHAT-FEATURES – History & Voice" section to `agents/IMPLEMENTATION_LOG.md`:
- Files added/changed
- Behavior description
- Browser limitations (MediaRecorder support)

---

## AGENT-AUDIT: End-to-End Verification

### 1. Audit Scope
Check entire flow: Login → Onboarding → Chat

### 2. Verification Checklist

**Cards & Layout**:
- [ ] All cards share same radius tokens (--radius-lg or --radius-md)
- [ ] Consistent padding from spacing tokens
- [ ] Gradient background on all auth/chat pages

**Colors**:
- [ ] Only palette colors used: #06BF9D, #48D9BE, #84D9C9, #C4F2EA, #F2F2F2
- [ ] No hardcoded hex values outside tokens

**Icons**:
- [ ] All icons from Lucide
- [ ] No mixed icon families

**GSAP Morphs**:
- [ ] Sign In button → onboarding step 1
- [ ] Onboarding step X → step X+1
- [ ] Final onboarding → main-chat-card

**Chat Hero**:
- [ ] Chat card is visually dominant
- [ ] Suggestion chips present
- [ ] Header outside, input inside

### 3. Audit Output Format
For EACH item:
- ✅ if fully met with file/line evidence
- ❌ if NOT met with:
  - What's missing
  - Which file to adjust
  - Concrete fix suggestion

### 4. Update Documentation
- Update `agents/DESIGN_OVERHAUL_TRACKER.md` with completion status
- Add "FINAL AUDIT – [date]" section to `agents/IMPLEMENTATION_LOG.md`

---

## AGENT-DOCS: Final Checkpoints

Ensure `agents/IMPLEMENTATION_LOG.md` contains:
1. Vision section (from Phase 1)
2. MOTION-CORE / MOTION-APPLY sections (from Phase 2)
3. Retention & Unforgettable Experience – Chat section
4. CHAT-FEATURES – History & Voice section
5. FINAL AUDIT section with date

Ensure `agents/DESIGN_OVERHAUL_TRACKER.md` reflects:
1. Completed design tokens
2. Completed layouts
3. Completed motion flows
4. Completed chat features

</implementation>

<output>

**New files**:
- `./apps/web/src/components/chat/SuggestionChips.tsx`
- `./apps/web/src/components/chat/ChatHistoryDropdown.tsx`
- `./apps/web/src/components/chat/VoiceInput.tsx`
- `./apps/web/src/hooks/useVoiceRecording.ts`

**Modified files**:
- `./apps/web/src/app/(dashboard)/chat/page.tsx`
- `./apps/web/src/app/(dashboard)/layout.tsx` (if needed)
- `./agents/IMPLEMENTATION_LOG.md`
- `./agents/DESIGN_OVERHAUL_TRACKER.md`

</output>

<response_format>
Structure your response EXACTLY as follows:

## 1) SUMMARY BY AGENT
- **AGENT-CHAT-UX**: [what was done]
- **AGENT-CHAT-FEATURES**: [what was done]
- **AGENT-AUDIT**: [audit results with ✅/❌]
- **AGENT-DOCS**: [what was updated]

## 2) KEY CODE SNIPPETS
Show actual code for:
- Chat card layout (AnimatedContainer with morphId)
- Header with greeting + icons
- SuggestionChips component (full)
- ChatHistoryDropdown component (full)
- useVoiceRecording hook (full)
- VoiceInput component (full)
- Integration in chat/page.tsx

## 3) FINAL CHECKLIST
For each, mark ✅ or ❌ and explain if ❌:
- Design system & palette normalized and used consistently
- All major UI surfaces are rectangles with shared radius/spacing tokens
- Login → onboarding → chat follow GSAP button→rectangle morph pattern
- Chat card is visual hero with suggestions and gradient background
- Chat history dropdown implemented and integrated
- Voice input implemented and integrated
- Single icon family (Lucide) used everywhere
- agents/IMPLEMENTATION_LOG.md fully updated
- agents/DESIGN_OVERHAUL_TRACKER.md fully updated

You must tie claims to code snippets shown. Do not simply say "everything is done."
</response_format>

<constraints>
- Do NOT hardcode hex colors - use CSS variables
- Do NOT mix icon families - Lucide only
- Do NOT skip accessibility (focus styles, ARIA labels)
- Do NOT create flashy 3D effects - flat and minimal only
- Do NOT leave placeholder implementations - fully working code
- Do NOT skip any audit items - check each one
</constraints>

<verification>
Before declaring complete, verify:

1. **SuggestionChips** renders with proper styling and hover animations
2. **ChatHistoryDropdown** opens/closes with animation, lists conversations
3. **useVoiceRecording** handles start/stop and permission states
4. **VoiceInput** shows recording feedback and integrates with hook
5. **Chat page** integrates all components with proper layout
6. **Audit** checked all items and documented any issues
7. **Both documentation files** updated with new sections
8. **Reduced motion** respected in all animations
</verification>

<success_criteria>
- All four agents' tasks completed as specified
- SuggestionChips, ChatHistoryDropdown, VoiceInput components created
- useVoiceRecording hook created with proper browser API handling
- Chat page integrates all new components
- End-to-end audit completed with clear ✅/❌ for each item
- Both checkpoint files updated with new sections
- Response follows exact format with actual code snippets
</success_criteria>
