# PRISM Agent - UI Beautification

## Mission
Fix files to comply with dark theme spec in `.planning/UI_BEAUTIFICATION_STATE.json`

## MANDATORY: Read Spec First
Before ANY edit, read the `onboardingDarkThemeSpec` section from:
`.planning/UI_BEAUTIFICATION_STATE.json`

## Checklist - EVERY file must have ALL of these:

### 1. Headlines (REQUIRED)
- Size: `text-3xl md:text-4xl` for step headlines (NOT text-2xl)
- Color: `text-white` with gradient on keyword
- Pattern:
```tsx
<h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight text-center">
  Connect Your{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
    Bank Account
  </span>
</h1>
```
- Spacing: `mb-6` after headline, container should have `space-y-4`

### 2. Text Colors (REQUIRED)
ALLOWED:
- `text-white` - primary text
- `text-white/70` - secondary text, labels
- `text-white/60` - muted/helper text
- `text-white/50` - subtle/placeholder text
- `text-gray-300/80` or `text-gray-300/90` - descriptions

FORBIDDEN (search and destroy):
- `text-primary` → replace with `text-white/70`
- `text-muted-foreground` → replace with `text-white/60`
- `text-blue-*` (any blue number) → replace with `text-white/70`
- `text-foreground` → replace with `text-white`

### 3. Icon Colors (REQUIRED)
ALLOWED:
- `text-white/70` - default icons
- `text-white/50` - subtle icons
- `text-green-400` or `text-green-500` - SUCCESS states only
- `text-red-400` or `text-red-500` - ERROR states only

FORBIDDEN:
- `text-primary` on icons → `text-white/70`
- `text-blue-*` on icons → `text-white/70`
- Emojis (🇩🇪, 📊, etc.) → Lucide icons with `text-white/70`

### 4. Backgrounds (REQUIRED)
ALLOWED:
- `bg-white/5` - subtle containers
- `bg-white/10` - cards, alerts, inputs
- `bg-white/20` - hover states
- `bg-green-500/10`, `bg-green-500/20` - SUCCESS only
- `bg-red-500/10`, `bg-red-500/20` - ERROR only

FORBIDDEN:
- `bg-muted` → `bg-white/10`
- `bg-primary/5`, `bg-primary/10` → `bg-white/10`
- `bg-blue-*` → `bg-white/10`
- `bg-secondary` → `bg-white/10`

### 5. Borders (REQUIRED)
ALLOWED:
- `border-white/10` - subtle
- `border-white/20` - default
- `border-white/30` - emphasis
- `border-green-500/20`, `border-green-500/30` - SUCCESS only
- `border-red-500/20`, `border-red-500/30` - ERROR only

FORBIDDEN:
- `border-primary` → `border-white/20`
- `border-primary/20` → `border-white/20`
- `border-blue-*` → `border-white/20`

### 6. Badges (REQUIRED)
Default: `bg-white/10 text-white/80 border border-white/20`
Success: `bg-green-500/20 text-green-400 border-green-500/30`
Error: `bg-red-500/20 text-red-400 border-red-500/30`

FORBIDDEN:
- `variant="secondary"` with no override → add dark theme classes
- `bg-primary/10 text-primary` → use default pattern above

## Execution Order
1. Read the file completely
2. Search for ALL forbidden patterns (grep each one)
3. Fix headline first (size + gradient)
4. Fix all text colors
5. Fix all icon colors
6. Fix all backgrounds
7. Fix all borders
8. Fix all badges
9. Verify NO forbidden patterns remain

## Output
After fixing, list:
- Total forbidden patterns found
- Total patterns fixed
- Any patterns that couldn't be fixed (with reason)
