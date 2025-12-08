# Operate UI Beautification - Design Brief

**One-liner**: Transform Operate into a minimal, whitespace-focused, chatbot-centric app with unforgettable micro-interactions and morphing animations.

## Vision

An AI business automation chatbot where users focus on actual work while the app handles everything else. The design should feel:
- **Calm & Professional** - Meditation guru aesthetic (not aggressive SaaS)
- **Focused** - Chat is the hero, everything else supports it
- **Delightful** - Micro-interactions that make users want to stay
- **Trustworthy** - AI reasoning is transparent, sources cited

## Design Principles

1. **Clarity Over Complexity** - Every element serves a purpose
2. **Proactive Intelligence** - AI anticipates needs, suggests actions
3. **Trustworthy Transparency** - Show reasoning, provide sources
4. **Delightful Efficiency** - Fast, smooth, satisfying interactions
5. **Accessible First** - WCAG AAA compliance, voice support, dark mode

## Current State

- Existing components: shadcn/ui base, OnboardingWizard, ChatPanel, Sidebar
- Logo: GuruLogo SVG (meditation figure in blue palette)
- Layout: Dashboard with sidebar navigation, chat button overlay
- Colors: Using shadcn defaults (not the specified blue palette)
- Animations: Basic (minimal micro-interactions)

## Target State

### Color Palette (Material Blue Scale)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary 100 | #E3F2FD | Backgrounds, hover states, light surfaces |
| Primary 200 | #BBDEFB | Secondary backgrounds, dividers |
| Primary 300 | #90CAF9 | Disabled states, subtle borders |
| Primary 400 | #64B5F6 | Secondary actions, accents |
| Primary 500 | #1E88E5 | Main UI/brand color |
| Primary 600 | #1565C0 | Buttons, highlights, links |
| Primary 700 | #0D47A1 | Strong emphasis, text on light |

### Accessibility Requirements

- WCAG AAA: Use #0D47A1 text on #E3F2FD backgrounds
- WCAG AA: #1565C0 for links (sufficient contrast)
- Never use #90CAF9 or lighter on white backgrounds
- Focus indicators: 3px #0D47A1 border
- Reduced motion: Provide slower/static alternatives

### Typography

- Font Family: Inter or system fonts (performance)
- Body: 14px, line-height 1.5
- Emphasized: 16px
- Secondary: 12px
- Code: JetBrains Mono or Fira Code

### Icon Family

- **Lucide Icons** (consistent, minimal, already installed)
- All icons same weight/style for cohesion
- 20px default size, 16px for compact areas

---

## Core Features

### 1. Chatbot-Centric Landing

After login/onboarding, users land on a chat interface (not dashboard):

```
┌─────────────────────────────────────────────────────────────────┐
│  [logo]  Operate                    [Dashboard] [Settings] [?] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     Good morning, John! Here's what I'm thinking about:        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  [Guru Logo - animated]                                 │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ I noticed 3 unpaid invoices from last week.      │   │   │
│  │  │ Want me to send reminders?                       │   │   │
│  │  │ [Yes, send them] [Show details] [Not now]        │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Suggestions:                                   │    │   │
│  │  │  [Tax deadline] [Cash flow] [Create invoice]    │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────┬───────┐     │   │
│  │  │ Ask me anything...                    │ [mic] │     │   │
│  │  └───────────────────────────────────────┴───────┘     │   │
│  │                                                         │   │
│  │  [Chat History ▼]                                       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Morphing Button Animations (Signature Feature)

When clicking buttons, they morph into content containers:

**Implementation: Framer Motion `layoutId`**

```tsx
// Button morphs into form container
<motion.button layoutId="login-container" onClick={() => setIsOpen(true)}>
  Login
</motion.button>

<AnimatePresence>
  {isOpen && (
    <motion.div layoutId="login-container">
      {/* Content fades in */}
    </motion.div>
  )}
</AnimatePresence>
```

**Timing:**
- Spring animation: stiffness 300, damping 25
- Content fade-in: 200ms delay, 200ms duration
- Total perceived: ~500ms

### 3. Animated Guru Logo States

| State | Animation | Duration | Use Case |
|-------|-----------|----------|----------|
| **idle** | Gentle breathing (scale 1→1.05) | 4s loop | Ready, waiting |
| **thinking** | Breathing + blue glow pulse | 2s loop | AI processing |
| **success** | Scale pulse + green tint flash | 800ms | Action completed |
| **error** | Shake + red tint flash | 500ms | Error occurred |

**CSS Implementation:** Pure CSS keyframes for performance (0 bundle cost)

### 4. Voice Input Integration

- Microphone icon in input field
- States: idle → listening (waveform) → processing → transcribed
- Real-time speech-to-text display
- Error handling: "Sorry, I didn't catch that. Try again?"
- Privacy notice for voice data

### 5. Chat History UX

- **Dropdown from chat header** (not sidebar - keeps focus on chat)
- Grouped: Today, Yesterday, Last 7 days, Older
- Search with `Cmd/Ctrl + K`
- Hover actions: Rename, Delete, Pin
- Mobile: Sheet/drawer pattern

### 6. Glassmorphic Cards

Chat rectangle and content containers use glassmorphism:

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(13, 71, 161, 0.1);
  border-radius: 24px;
}
```

### 7. Background Treatment

- Soft animated gradient: #E3F2FD → #BBDEFB
- 30s loop, subtle movement
- Option to disable in settings
- Fallback: solid #E3F2FD for reduced motion

### 8. Micro-Interactions

| Element | Interaction | Animation |
|---------|-------------|-----------|
| Buttons | Hover | Scale 1.02×, 300ms |
| Buttons | Tap | Scale 0.98×, 100ms |
| Cards | Hover | Shadow increase 4px, 200ms |
| Success | Completion | Checkmark expands from center |
| Milestones | Achievement | Confetti + trophy animation |
| Errors | Shake | 3× horizontal, 100ms each |
| Send | Click | Button morphs to message bubble |

### 9. Onboarding Flow (Morphing Cards)

Keep existing 8-step structure, add morphing transitions between cards:

1. **Welcome** - Introduction
2. **Company Info** - Basic company information
3. **Banking** - Connect bank account (optional)
4. **Email** - Connect email (optional)
5. **Tax Software** - Connect tax software (optional)
6. **Accounting** - Connect accounting software (optional)
7. **Preferences** - Customize experience
8. **Complete** - Setup complete

Cards use morphing transition between steps (Framer Motion layoutId).

### 10. Quick Action Suggestions

Pill-shaped suggestion chips above chat input:
- "Check tax deadline"
- "Show cash flow"
- "Create invoice"
- "Unpaid bills"

Ripple effect on tap (Material Design inspired).

---

## Meta Tags & SEO

```html
<meta name="description" content="AI-powered business automation. Invoice creation, expense tracking, tax filing - all through natural conversation.">
<meta name="keywords" content="AI assistant, business automation, invoice, expense tracking, tax filing, chatbot">
<meta name="author" content="Operate">

<!-- Open Graph -->
<meta property="og:title" content="Operate - AI Business Automation">
<meta property="og:description" content="Focus on your work. Let AI handle invoices, expenses, and taxes.">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">

<!-- AI Systems Designer Tag (experimental) -->
<meta name="ai-systems-designer" content="Operate AI - Chatbot-first business automation">
```

---

## Technical Constraints

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion (already in stack)
- **Icons**: Lucide React (already in stack)
- **No new dependencies** for core animations (CSS keyframes)
- **Performance**: 60fps on mobile, <2s page load
- **Bundle**: Minimal impact from animation code

---

## Success Criteria

- [ ] Blue palette applied consistently across all surfaces
- [ ] Chat interface is primary landing (not dashboard)
- [ ] Guru logo animates based on AI state
- [ ] Button morphing works on key interactions
- [ ] Voice input functional with state feedback
- [ ] Chat history accessible via dropdown
- [ ] Glassmorphic cards on gradient background
- [ ] Micro-interactions on all interactive elements
- [ ] Onboarding uses morphing card transitions
- [ ] Dark mode available with inverted palette
- [ ] WCAG AAA compliance verified
- [ ] 60fps animations on mobile devices
- [ ] Reduced motion preferences respected

---

## Out of Scope

- New backend features
- Database schema changes
- Third-party integrations
- Mobile native apps (PWA only)
- 3D/Three.js animations (overkill)
- Lottie files (CSS handles logo simply)

---

## Reference Inspiration

- **Claude.ai**: Minimalism, long-form focus
- **Notion**: Warmth, realistic use cases
- **Stripe**: Gradient sophistication
- **Linear**: Authentic product previews
- **ChatGPT**: Intuitive chat simplicity
- **Arc Browser**: Beautiful chromeless design
