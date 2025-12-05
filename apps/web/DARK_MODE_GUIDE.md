# Dark Mode Implementation Guide

## Overview

This document provides comprehensive guidelines for implementing and maintaining dark mode across the Operate/CoachOS web application.

## Color System

### Core Colors

All colors use HSL values defined as CSS custom properties for easy theme switching.

#### Light Mode
```css
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--card: 0 0% 100%
--border: 214.3 31.8% 91.4%
```

#### Dark Mode
```css
--background: 222.2 84% 4.9%
--foreground: 210 40% 98%
--card: 217.2 32.6% 7.5%        /* Lighter than background for depth */
--border: 217.2 32.6% 20%        /* Higher contrast for visibility */
```

### Semantic Colors

Additional semantic colors for enhanced UX:

| Color | Light | Dark | Usage |
|-------|-------|------|-------|
| **Success** | `142 76% 36%` | `142 76% 45%` | Success messages, confirmations |
| **Warning** | `38 92% 50%` | `38 92% 50%` | Warnings, alerts |
| **Info** | `199 89% 48%` | `199 89% 48%` | Informational messages |
| **Destructive** | `0 84.2% 60.2%` | `0 62.8% 50.6%` | Errors, destructive actions |

### Using Colors in Components

```tsx
// Tailwind classes
<div className="bg-success text-success-foreground">
  Success state
</div>

<div className="bg-warning text-warning-foreground">
  Warning state
</div>

// CSS custom properties
.custom-element {
  background-color: hsl(var(--success));
  color: hsl(var(--success-foreground));
}
```

## Contrast Requirements

All text must meet WCAG 2.1 AA contrast requirements:

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI components**: 3:1 minimum for borders and visual indicators

### Improved Contrast in Dark Mode

The dark mode implementation includes:

1. **Enhanced muted text**: Increased from `65.1%` to `70%` lightness for better readability
2. **Distinct card backgrounds**: Cards are lighter (`7.5%`) than background (`4.9%`) for clear hierarchy
3. **Visible borders**: Border lightness increased to `20%` for better definition

## Shadow Refinement

Shadows are adjusted for dark mode to prevent excessive harshness:

```css
/* Light mode - standard shadows */
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }

/* Dark mode - reduced opacity */
.dark .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.15); }
.dark .shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.2); }
```

## Theme Transitions

### Smooth Transitions

The application uses CSS transitions for smooth theme switching:

```css
html * {
  transition-property: background-color, border-color, color, fill, stroke, box-shadow;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### View Transition API

For modern browsers supporting the View Transition API, enhanced transitions are applied:

```javascript
const handleThemeChange = (newTheme) => {
  document.documentElement.classList.add('theme-transitioning')
  setTheme(newTheme)
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 300)
}
```

### Reduced Motion

Respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  html * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

## Component Guidelines

### Cards

Cards should have distinct backgrounds from the page:

```tsx
<Card className="bg-card text-card-foreground border-border">
  {/* Content */}
</Card>
```

### Buttons

Use semantic variants for clarity:

```tsx
// Success action
<ButtonEnhanced variant="success">Confirm</ButtonEnhanced>

// Warning action
<ButtonEnhanced variant="warning">Proceed with caution</ButtonEnhanced>

// Destructive action
<ButtonEnhanced variant="destructive">Delete</ButtonEnhanced>
```

### Alerts

Leverage enhanced alert variants:

```tsx
<AlertEnhanced variant="success" showIcon>
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Operation completed successfully</AlertDescription>
</AlertEnhanced>
```

### Badges

Status indicators with proper contrast:

```tsx
<BadgeEnhanced variant="success" showDot>Active</BadgeEnhanced>
<BadgeEnhanced variant="warning" showDot>Pending</BadgeEnhanced>
<BadgeEnhanced variant="info" showDot>Draft</BadgeEnhanced>
```

## Skeleton Loaders

Enhanced shimmer effect for dark mode:

```tsx
<Skeleton className="h-4 w-full skeleton-shimmer" />
```

The `skeleton-shimmer` class provides a smooth gradient animation optimized for dark backgrounds.

## Focus Indicators

Ensure focus rings are always visible:

```css
.dark *:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.dark button:focus-visible,
.dark input:focus-visible {
  box-shadow: 0 0 0 2px hsl(var(--background)),
              0 0 0 4px hsl(var(--ring));
}
```

## Images and Media

### Image Brightness

Images are slightly dimmed in dark mode for visual comfort:

```css
.dark img:not(.no-dark-filter) {
  filter: brightness(0.9);
}
```

To prevent filtering on specific images:

```tsx
<img src="..." className="no-dark-filter" alt="..." />
```

## Tables

Enhanced table styling for dark mode:

```tsx
<Table>
  <TableHeader className="bg-muted">
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-accent border-border">
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Forms

### Input Fields

Proper contrast and autofill handling:

```css
.dark input:-webkit-autofill {
  -webkit-text-fill-color: hsl(var(--foreground));
  -webkit-box-shadow: 0 0 0 1000px hsl(var(--input)) inset;
  border-color: hsl(var(--border));
}
```

### Placeholder Text

Improved visibility:

```css
.dark ::placeholder {
  color: hsl(215 20.2% 55%);
  opacity: 1;
}
```

## Scrollbars

Custom scrollbar styling for dark mode:

```css
.dark *::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.dark *::-webkit-scrollbar-track {
  background: hsl(var(--background));
}

.dark *::-webkit-scrollbar-thumb {
  background: hsl(var(--muted));
  border-radius: 4px;
}
```

## Testing Checklist

### Visual Testing

- [ ] All text has sufficient contrast (4.5:1 minimum)
- [ ] Cards are visually distinct from background
- [ ] Borders are visible and clear
- [ ] Shadows are subtle, not harsh
- [ ] Focus indicators are clearly visible
- [ ] Skeleton loaders are visible with shimmer effect
- [ ] Images display appropriately
- [ ] Icons maintain contrast

### Functional Testing

- [ ] Theme toggle works smoothly
- [ ] Theme preference persists across sessions
- [ ] System theme detection works correctly
- [ ] Transitions are smooth (or instant with reduced motion)
- [ ] No FOUC (Flash of Unstyled Content) on page load
- [ ] All interactive elements are accessible

### Component Testing

- [ ] Buttons (all variants)
- [ ] Alerts (all variants)
- [ ] Badges (all variants)
- [ ] Cards
- [ ] Forms and inputs
- [ ] Tables
- [ ] Modals and dialogs
- [ ] Dropdowns and popovers
- [ ] Navigation components
- [ ] Loading states

## Performance Considerations

### CSS Structure

1. **Base colors** defined in `globals.css`
2. **Dark mode overrides** in `styles/themes/dark.css`
3. **Transitions** in `styles/themes/transitions.css`
4. All imported in correct order to prevent specificity issues

### Optimization Tips

1. Use CSS custom properties for colors (better performance than runtime JS)
2. Limit transition properties to only what changes (avoid `all`)
3. Use `will-change` sparingly and remove after transitions complete
4. Leverage GPU acceleration with `transform: translateZ(0)`

## Accessibility

### ARIA Labels

Ensure theme toggle has proper labels:

```tsx
<Button aria-label="Toggle theme" />
<span className="sr-only">Toggle theme</span>
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
<DropdownMenuItem
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleThemeChange('dark')
    }
  }}
>
  Dark
</DropdownMenuItem>
```

## Browser Support

### Full Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Graceful Degradation
- View Transition API: Falls back to CSS transitions
- Custom properties: All modern browsers supported
- Scrollbar styling: Webkit only (others get default)

## Maintenance

### Adding New Colors

1. Add to `globals.css` in both `:root` and `.dark`
2. Add to `tailwind.config.js` colors
3. Update this documentation
4. Test in both themes
5. Verify contrast ratios

### Updating Components

When creating new components:

1. Use semantic color tokens (`bg-card`, `text-foreground`)
2. Avoid hardcoded color values
3. Test in both light and dark modes
4. Add transitions for theme-switching properties
5. Ensure focus states are visible

## Common Issues

### Issue: Text not visible in dark mode
**Solution**: Use `text-foreground` instead of hardcoded colors

### Issue: Harsh shadows in dark mode
**Solution**: Shadows are automatically adjusted via `.dark` class overrides

### Issue: Flash during theme switch
**Solution**: Check that ThemeProvider has `suppressHydrationWarning` on `<html>` tag

### Issue: Focus rings invisible
**Solution**: Use `ring-ring` color and ensure sufficient contrast

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Next Themes Documentation](https://github.com/pacocoursey/next-themes)

## File Structure

```
apps/web/src/
├── app/
│   └── globals.css                    # Main CSS with theme imports
├── styles/
│   ├── themes/
│   │   ├── dark.css                   # Dark mode enhancements
│   │   └── transitions.css            # Theme transition animations
│   └── animations.css                 # Micro-interactions
├── components/
│   ├── theme-provider.tsx             # Theme context wrapper
│   ├── theme-toggle.tsx               # Enhanced theme switcher
│   └── ui/
│       ├── alert-variants.tsx         # Alert with semantic variants
│       ├── badge-variants.tsx         # Badge with semantic variants
│       └── button-variants.tsx        # Button with semantic variants
└── providers/
    └── index.tsx                      # Providers configuration
```

---

Last updated: 2025-12-05
