# Design Tokens - Quick Reference

## Most Common Use Cases

### 1. Primary Action Button
```tsx
<button className="bg-brand-primary hover:bg-brand-secondary text-white rounded-token-md px-4 py-2 shadow-token-sm transition-all duration-fast">
  Primary Action
</button>
```

### 2. Card/Surface Container
```tsx
<div className="bg-surface rounded-token-lg p-6 shadow-token-md border border-border-default">
  <h3 className="text-text-primary font-semibold mb-2">Title</h3>
  <p className="text-text-secondary">Description</p>
</div>
```

### 3. Input Field
```tsx
<input
  className="bg-white border border-border-default rounded-token-sm px-3 py-2 text-text-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all duration-fast"
  placeholder="Enter text..."
/>
```

### 4. Success/Error Messages
```tsx
// Success
<div className="bg-success/10 border border-success rounded-token-md p-4 text-success">
  ✓ Success message
</div>

// Error
<div className="bg-error/10 border border-error rounded-token-md p-4 text-error">
  ✗ Error message
</div>
```

### 5. Link/Text Button
```tsx
<button className="text-brand-primary-dark hover:text-brand-primary transition-colors duration-fast">
  Text Action
</button>
```

## Brand Color Palette (Copy-Paste Ready)

```
Primary:       #06BF9D  (rgb(6, 191, 157))
Primary Dark:  #048A71  (rgb(4, 138, 113))
Secondary:     #48D9BE  (rgb(72, 217, 190))
Tertiary:      #84D9C9  (rgb(132, 217, 201))
BG Light:      #C4F2EA  (rgb(196, 242, 234))
Surface:       #F2F2F2  (rgb(242, 242, 242))
```

## Tailwind Class Cheat Sheet

| Purpose | Tailwind Class |
|---------|---------------|
| Primary background | `bg-brand-primary` |
| Primary dark background | `bg-brand-primary-dark` |
| Secondary background | `bg-brand-secondary` |
| Surface/card background | `bg-surface` |
| Primary text | `text-text-primary` |
| Secondary text | `text-text-secondary` |
| Border | `border-border-default` |
| Small radius (8px) | `rounded-token-sm` |
| Medium radius (16px) | `rounded-token-md` |
| Large radius (24px) | `rounded-token-lg` |
| Small shadow | `shadow-token-sm` |
| Medium shadow | `shadow-token-md` |
| Fast transition (150ms) | `duration-fast` |
| Normal transition (300ms) | `duration-normal` |
| Success color | `text-success` / `bg-success` |
| Error color | `text-error` / `bg-error` |
| Warning color | `text-warning` / `bg-warning` |

## Common Patterns

### Hover Effects
```tsx
// Color change
className="bg-brand-primary hover:bg-brand-secondary transition-colors duration-fast"

// Shadow lift
className="shadow-token-sm hover:shadow-token-md transition-shadow duration-fast"

// Scale up
className="transform hover:scale-105 transition-transform duration-fast"
```

### Focus States
```tsx
// All elements get automatic focus:
className="focus:outline-none focus:ring-2 focus:ring-brand-primary"

// Or use the default (already applied globally):
// Just add: focus-visible:ring-2 focus-visible:ring-brand-primary
```

### Dark Mode
```tsx
// Auto-adapts when parent has .dark class
className="bg-surface text-text-primary border-border-default"

// Manual dark mode override
className="dark:bg-gray-800 dark:text-white"
```

## CSS Variable Usage (Advanced)

```css
.custom-component {
  /* Colors */
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border);

  /* Spacing */
  padding: var(--space-md);
  gap: var(--space-sm);

  /* Border radius */
  border-radius: var(--radius-md);

  /* Shadows */
  box-shadow: var(--shadow-sm);

  /* Transitions */
  transition: all var(--transition-fast);
}
```

## Migration Checklist

When updating existing components:

- [ ] Replace hardcoded colors with `bg-brand-*` or `text-brand-*`
- [ ] Replace hardcoded border-radius with `rounded-token-*`
- [ ] Replace hardcoded shadows with `shadow-token-*`
- [ ] Replace hardcoded transitions with `duration-fast/normal/slow`
- [ ] Ensure dark mode support using semantic tokens
- [ ] Test focus states (should auto-apply)
- [ ] Test with `prefers-reduced-motion`

## Testing Dark Mode

```bash
# Toggle dark mode in browser DevTools console:
document.documentElement.classList.toggle('dark')
```

## Files to Reference

- **Design Tokens:** `src/styles/design-tokens.css`
- **Global Styles:** `src/styles/globals-custom.css`
- **Tailwind Config:** `tailwind.config.js`
- **Full Documentation:** `DESIGN_TOKENS_SUMMARY.md`
