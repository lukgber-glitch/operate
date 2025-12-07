# Operate Design System Specification

**Version**: 1.0
**Created**: December 7, 2024
**Style**: Minimal, Flat, Whitespace-focused

---

## Brand Identity

### Logo
- **File**: `D:\Neuer Ordner\print\ai\guru.svg`
- **Style**: Robot/avatar face with friendly expression
- **Usage**: Header (24-32px), Favicon (16px), Loading states

### Brand Colors

#### Primary Palette
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | `#04BDA5` | 4, 189, 165 | Buttons, links, primary accents |
| Primary Hover | `#06BF9D` | 6, 191, 157 | Hover states |
| Primary Dark | `#039685` | 3, 150, 133 | Active states, focus rings |

#### Secondary Palette
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Secondary | `#48D9BE` | 72, 217, 190 | Secondary buttons, badges |
| Secondary Light | `#84D9C9` | 132, 217, 201 | Highlights, backgrounds |
| Accent Light | `#C4F2EA` | 196, 242, 234 | Cards, subtle backgrounds |

#### Neutral Palette
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| White | `#FCFEFE` | 252, 254, 254 | Surfaces, cards |
| Background | `#F2F2F2` | 242, 242, 242 | Page backgrounds |
| Border | `#E5E7EB` | 229, 231, 235 | Borders, dividers |
| Text Primary | `#1A1A2E` | 26, 26, 46 | Headings, body text |
| Text Secondary | `#6B7280` | 107, 114, 128 | Captions, muted text |
| Text Muted | `#9CA3AF` | 156, 163, 175 | Placeholders, disabled |

#### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Confirmations, completed states |
| Warning | `#F59E0B` | Warnings, pending states |
| Error | `#EF4444` | Errors, destructive actions |
| Info | `#3B82F6` | Information, tips |

---

## Typography

### Font Family
```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display | 3rem (48px) | 1.1 | 700 | Hero headlines |
| H1 | 2.25rem (36px) | 1.2 | 700 | Page titles |
| H2 | 1.875rem (30px) | 1.25 | 600 | Section headers |
| H3 | 1.5rem (24px) | 1.3 | 600 | Card titles |
| H4 | 1.25rem (20px) | 1.4 | 600 | Subsections |
| Body Large | 1.125rem (18px) | 1.6 | 400 | Lead paragraphs |
| Body | 1rem (16px) | 1.6 | 400 | Default text |
| Body Small | 0.875rem (14px) | 1.5 | 400 | Secondary text |
| Caption | 0.75rem (12px) | 1.4 | 400 | Labels, hints |

### Font Weights
- **Regular (400)**: Body text
- **Medium (500)**: Buttons, emphasized text
- **Semibold (600)**: Headings H2-H4
- **Bold (700)**: H1, Display

---

## Spacing System

### Scale (8px base)
| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0 | None |
| `--space-1` | 0.25rem (4px) | Tight gaps |
| `--space-2` | 0.5rem (8px) | Inline elements |
| `--space-3` | 0.75rem (12px) | Small gaps |
| `--space-4` | 1rem (16px) | Default spacing |
| `--space-5` | 1.25rem (20px) | Medium gaps |
| `--space-6` | 1.5rem (24px) | Section padding |
| `--space-8` | 2rem (32px) | Large sections |
| `--space-10` | 2.5rem (40px) | Page margins |
| `--space-12` | 3rem (48px) | Section dividers |
| `--space-16` | 4rem (64px) | Large sections |

### Layout Spacing
- **Page Padding**: 24px (mobile), 48px (tablet), 64px (desktop)
- **Card Padding**: 16px (mobile), 24px (desktop)
- **Form Gap**: 16px
- **Button Padding**: 12px 24px

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.375rem (6px) | Small buttons, chips |
| `--radius-md` | 0.5rem (8px) | Inputs, small cards |
| `--radius-lg` | 0.75rem (12px) | Cards, dialogs |
| `--radius-xl` | 1rem (16px) | Large cards, panels |
| `--radius-2xl` | 1.5rem (24px) | Chat bubbles, hero sections |
| `--radius-full` | 9999px | Avatars, pills |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Floating elements |
| `--shadow-focus` | `0 0 0 3px rgba(4,189,165,0.3)` | Focus rings |

---

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  &:active {
    background: var(--color-primary-dark);
    transform: translateY(0);
  }

  &:focus-visible {
    box-shadow: var(--shadow-focus);
  }
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 12px 24px;
  border-radius: var(--radius-md);

  &:hover {
    background: var(--color-accent-light);
  }
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 12px 24px;

  &:hover {
    background: var(--color-background);
    color: var(--color-text-primary);
  }
}
```

#### Button Sizes
| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 8px 16px | 14px |
| Medium | 12px 24px | 16px |
| Large | 16px 32px | 18px |

### Cards

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);

  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-secondary-light);
  }
}
```

#### Card Variants
- **Default**: White background, subtle shadow
- **Elevated**: Larger shadow for emphasis
- **Interactive**: Hover state with lift effect
- **Suggestion**: Accent left border (4px primary)

### Inputs

```css
.input {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--font-size-base);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  &::placeholder {
    color: var(--color-text-muted);
  }
}
```

### Chat Components

#### Chat Container
```css
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
}
```

#### Chat Message (User)
```css
.message-user {
  background: var(--color-primary);
  color: white;
  padding: var(--space-4);
  border-radius: var(--radius-2xl);
  border-bottom-right-radius: var(--radius-sm);
  max-width: 80%;
  align-self: flex-end;
}
```

#### Chat Message (Assistant)
```css
.message-assistant {
  background: var(--color-surface);
  color: var(--color-text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-2xl);
  border-bottom-left-radius: var(--radius-sm);
  max-width: 80%;
  align-self: flex-start;
  box-shadow: var(--shadow-sm);
}
```

#### Chat Input
```css
.chat-input-container {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);

  .input {
    flex: 1;
    border: none;
    box-shadow: none;

    &:focus {
      box-shadow: none;
    }
  }
}
```

#### Quick Action Pills
```css
.quick-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 16px;
  background: var(--color-accent-light);
  color: var(--color-primary-dark);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  cursor: pointer;

  &:hover {
    background: var(--color-secondary-light);
  }
}
```

### Suggestion Cards

```css
.suggestion-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);

  .icon {
    width: 40px;
    height: 40px;
    background: var(--color-accent-light);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }

  .content {
    flex: 1;
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }
}
```

---

## Icons

### Icon Family
Use **Lucide React** (already installed) for consistency.

### Common Icons
| Action | Icon |
|--------|------|
| Send | `Send` |
| Voice | `Mic` |
| History | `History` |
| Settings | `Settings` |
| Dashboard | `LayoutDashboard` |
| Invoice | `FileText` |
| Bank | `Building2` |
| Tax | `Calculator` |
| Email | `Mail` |
| Calendar | `Calendar` |
| Alert | `Bell` |
| Success | `CheckCircle` |
| Warning | `AlertTriangle` |
| Error | `XCircle` |
| Info | `Info` |
| User | `User` |
| Logout | `LogOut` |
| Search | `Search` |
| Filter | `Filter` |
| Download | `Download` |
| Upload | `Upload` |
| Plus | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |

### Icon Sizes
- **XS**: 14px (inline text)
- **SM**: 16px (buttons, labels)
- **MD**: 20px (default)
- **LG**: 24px (headers, cards)
- **XL**: 32px (empty states)

---

## Animation Guidelines

### Timing
| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| Fast | 150ms | ease-out | Hovers, toggles |
| Base | 250ms | ease-in-out | Transitions |
| Slow | 350ms | ease-in-out | Page transitions |
| Morph | 500ms | power2.inOut | Button morphs |

### GSAP Animations

#### Button to Card Morph
```typescript
gsap.to(buttonRef.current, {
  width: 400,
  height: 300,
  borderRadius: 16,
  duration: 0.5,
  ease: 'power2.inOut',
});
```

#### Stagger List Items
```typescript
gsap.fromTo(items,
  { opacity: 0, y: 20 },
  {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: 0.1,
    ease: 'power2.out'
  }
);
```

#### Page Transition
```typescript
// Exit
gsap.to(content, { opacity: 0, y: -20, duration: 0.25 });
// Enter
gsap.fromTo(newContent,
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.35, delay: 0.1 }
);
```

---

## Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| Mobile | 0px | Default styles |
| SM | 640px | Large phones |
| MD | 768px | Tablets |
| LG | 1024px | Small laptops |
| XL | 1280px | Desktops |
| 2XL | 1536px | Large screens |

### Mobile-First Approach
```css
/* Mobile default */
.container {
  padding: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 48px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

## Accessibility

### Focus States
All interactive elements must have visible focus states using `--shadow-focus`.

### Color Contrast
| Text | Background | Ratio | Status |
|------|------------|-------|--------|
| #1A1A2E | #FCFEFE | 16.4:1 | AAA |
| #1A1A2E | #F2F2F2 | 14.2:1 | AAA |
| #FCFEFE | #04BDA5 | 3.8:1 | AA Large |
| #1A1A2E | #C4F2EA | 10.8:1 | AAA |

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/dropdowns
- Arrow keys for navigation in lists

### Screen Reader
- All images have alt text
- Form fields have labels
- ARIA labels for icon-only buttons
- Live regions for dynamic content

---

## Dark Mode (Future)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0F172A;
    --color-surface: #1E293B;
    --color-border: #334155;
    --color-text-primary: #F8FAFC;
    --color-text-secondary: #94A3B8;
  }
}
```

---

## CSS Variables Export

```css
:root {
  /* Colors */
  --color-primary: #04BDA5;
  --color-primary-hover: #06BF9D;
  --color-primary-dark: #039685;
  --color-secondary: #48D9BE;
  --color-secondary-light: #84D9C9;
  --color-accent-light: #C4F2EA;
  --color-background: #F2F2F2;
  --color-surface: #FCFEFE;
  --color-border: #E5E7EB;
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
  --shadow-focus: 0 0 0 3px rgba(4,189,165,0.3);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}
```
