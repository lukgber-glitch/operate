# Login Layout Redesign Plan

## Current State Analysis

**Current Layout** (`AuthLayoutClient.tsx`):
- LEFT side (480px): Logo + Login form (dark navy bg with transparency)
- RIGHT side (lg+): `FeatureShowcase` component (6 static feature cards)

**User's Desired Layout**:
- LEFT/CENTER: Login form as MAIN content (clean, focused)
- RIGHT sidebar: Dark sidebar with INFO SLIDER (showcase with slides + background image)

---

## Target Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   ┌──────────────────────────────┐  ┌─────────────────────────────┐ │
│   │                              │  │ ▓▓▓▓ DARK SIDEBAR ▓▓▓▓▓▓▓▓ │ │
│   │         [Guru Logo]          │  │                             │ │
│   │      operate.guru            │  │  ┌─────────────────────┐   │ │
│   │                              │  │  │   SLIDE 1           │   │ │
│   │  ┌────────────────────────┐  │  │  │   [Background Img]  │   │ │
│   │  │                        │  │  │  │                     │   │ │
│   │  │   Email: [_________]   │  │  │  │   "AI Assistant"    │   │ │
│   │  │                        │  │  │  │   description...    │   │ │
│   │  │   Password: [_______]  │  │  │  │                     │   │ │
│   │  │                        │  │  │  └─────────────────────┘   │ │
│   │  │   [ Sign In Button ]   │  │  │                             │ │
│   │  │                        │  │  │     ● ○ ○ ○ ○ ○            │ │
│   │  │   Forgot? | Register   │  │  │   (slide indicators)       │ │
│   │  │                        │  │  │                             │ │
│   │  └────────────────────────┘  │  │  "Everything you need..."  │ │
│   │                              │  │                             │ │
│   └──────────────────────────────┘  └─────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Install Embla Carousel
**Agent**: FORGE (package management)
```bash
cd apps/web && npm install embla-carousel-react embla-carousel-autoplay
```

### Task 2: Create AuthSidebar Slider Component
**Agent**: PRISM
**File**: `apps/web/src/components/auth/AuthSidebarSlider.tsx`

**Slides Content** (expanded from FeatureShowcase):

| Slide | Title | Description | Icon | Background Theme |
|-------|-------|-------------|------|------------------|
| 1 | AI Business Assistant | "Ask anything about your finances, invoices, or taxes. Get instant answers powered by Claude AI." | MessageSquare | Abstract data visualization |
| 2 | 10,000+ Bank Connections | "Connect to banks across EU, UK & US. Automatic transaction import and categorization." | Building2 | World map with connection lines |
| 3 | Smart Invoicing | "Create professional invoices in seconds. Auto-send, track payments, and manage recurring billing." | FileText | Invoice mockup |
| 4 | Tax Compliance | "VAT returns for Germany, Austria & UK. Never miss a deadline with proactive reminders." | Calculator | Calendar with checkmarks |
| 5 | Multi-Currency | "Handle transactions in 150+ currencies. Real-time exchange rates and automatic conversion." | Globe | Currency symbols flowing |
| 6 | Autopilot Mode | "AI handles routine tasks while you focus on growth. Email processing, categorization, reconciliation." | Zap | Robot/automation illustration |

### Task 3: Background Images
**Agent**: PRISM
**Options**:

1. **Unsplash API** (free, high-quality):
   - Abstract: `https://images.unsplash.com/photo-1557683316-973673baf926` (gradient mesh)
   - Business: `https://images.unsplash.com/photo-1460925895917-afdab827c52f` (dashboard)
   - Data: `https://images.unsplash.com/photo-1551288049-bebda4e38f71` (charts)

2. **CSS Gradient Backgrounds** (no external images):
   - Use animated mesh gradients (already have `WelcomeBackground`)
   - Add slide-specific accent colors

3. **SVG Illustrations** (custom):
   - Create abstract SVG patterns per slide
   - Lightweight, scalable, on-brand

**Recommendation**: Use CSS gradients with slide-specific accent colors + subtle SVG pattern overlay. No external image dependencies, fast loading.

### Task 4: Update AuthLayoutClient
**Agent**: PRISM
**File**: `apps/web/src/app/(auth)/AuthLayoutClient.tsx`

**Changes**:
```tsx
// Current: Left form (480px) | Right features
// New: Left/Center form (flex-1) | Right sidebar (400px fixed)

<div className="min-h-screen flex">
  {/* Main content - Login form */}
  <main className="flex-1 flex items-center justify-center p-8">
    <div className="w-full max-w-md">
      {/* Logo + Form */}
    </div>
  </main>

  {/* Right sidebar - Slider showcase */}
  <aside className="hidden lg:block w-[400px] bg-slate-900 relative overflow-hidden">
    <AuthSidebarSlider />
  </aside>
</div>
```

### Task 5: Slider Features
**Agent**: PRISM

- **Auto-play**: 5 seconds per slide
- **Manual navigation**: Dots + swipe gestures
- **Animations**: Fade transition with slight scale
- **Responsive**: Hidden on mobile, full-height on desktop
- **Accessibility**: ARIA labels, keyboard navigation, pause on hover

---

## File Structure

```
apps/web/src/components/auth/
├── AuthLayoutClient.tsx      # Updated layout
├── AuthSidebarSlider.tsx     # NEW - Main slider component
├── SlideContent.tsx          # NEW - Individual slide renderer
├── FeatureShowcase.tsx       # DEPRECATED (keep for reference)
└── slides/
    └── slideData.ts          # NEW - Slide content configuration
```

---

## Slide Design Spec

Each slide contains:
```tsx
interface Slide {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor: string;      // e.g., "blue", "purple", "green"
  backgroundPattern: string; // CSS gradient or SVG pattern
}
```

**Slide Layout**:
```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Background pattern/gradient
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│         ┌────────┐              │
│         │  ICON  │              │  ← Large icon (64px)
│         └────────┘              │
│                                 │
│     "AI Business Assistant"     │  ← Title (24px, bold, white)
│                                 │
│   "Ask anything about your      │  ← Description (16px, gray-300)
│    finances, invoices..."       │
│                                 │
│         ● ○ ○ ○ ○ ○            │  ← Dot indicators
└─────────────────────────────────┘
```

---

## Background Image Strategy

**Per-slide gradient themes**:

| Slide | Primary | Secondary | Pattern |
|-------|---------|-----------|---------|
| AI Assistant | blue-600 | purple-600 | Neural network dots |
| Banking | emerald-600 | teal-600 | Connection lines |
| Invoicing | orange-500 | amber-500 | Document outlines |
| Tax | red-500 | rose-500 | Calendar grid |
| Currency | indigo-500 | blue-500 | Globe wireframe |
| Autopilot | violet-500 | fuchsia-500 | Circuit pattern |

**Implementation**: Use CSS `radial-gradient` + `linear-gradient` layers with SVG pattern overlay.

---

## Implementation Order

1. **Install embla-carousel** (2 min)
2. **Create slideData.ts** with content (10 min)
3. **Create AuthSidebarSlider.tsx** (30 min)
4. **Update AuthLayoutClient.tsx** (15 min)
5. **Add background patterns** (20 min)
6. **Test & polish animations** (15 min)
7. **Build & deploy** (10 min)

**Total**: ~1.5 hours

---

## Agent Assignment

| Task | Agent | Priority |
|------|-------|----------|
| Install embla-carousel | FORGE | 1 |
| Create slider component | PRISM | 1 |
| Update layout | PRISM | 2 |
| Background patterns | PRISM | 3 |
| Build & deploy | FLUX | 4 |

---

## Success Criteria

- [ ] Login form centered on left/main area
- [ ] Dark sidebar on right with slider
- [ ] 6 slides with auto-play (5s interval)
- [ ] Smooth fade/scale transitions
- [ ] Dot navigation indicators
- [ ] Unique background gradient per slide
- [ ] Mobile: sidebar hidden, form full-width
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Build passes, no TypeScript errors
- [ ] Deployed to https://operate.guru
