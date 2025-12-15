# PRISM Task: Migrate Card to GlassCard in Settings Pages

## Objective
Migrate standard Card components to GlassCard in 2 settings pages.

## Files to Edit
1. `C:\Users\grube\op\operate-fresh\apps\web\src\app\(dashboard)\settings\profile\page.tsx`
2. `C:\Users\grube\op\operate-fresh\apps\web\src\app\(dashboard)\settings\security\page.tsx`

## Migration Steps

For EACH file:

### 1. Update Import Statement
Replace:
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
```

With:
```tsx
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
```

### 2. Replace Component Usage
- Replace all `<Card>` with `<GlassCard>`
- Replace all `</Card>` with `</GlassCard>`
- Replace all `<CardContent>` with `<GlassCardContent>`
- Replace all `</CardContent>` with `</GlassCardContent>`
- Replace all `<CardDescription>` with `<GlassCardDescription>`
- Replace all `</CardDescription>` with `</GlassCardDescription>`
- Replace all `<CardHeader>` with `<GlassCardHeader>`
- Replace all `</CardHeader>` with `</GlassCardHeader>`
- Replace all `<CardTitle>` with `<GlassCardTitle>`
- Replace all `</CardTitle>` with `</GlassCardTitle>`

### 3. Preserve All Existing Props
- Keep all className props exactly as they are
- Keep all other props (id, onClick, etc.) unchanged
- Do NOT add intensity, hover, or other GlassCard-specific props (use defaults)

## Verification
After editing both files, confirm:
- [ ] All Card imports removed
- [ ] All GlassCard imports added
- [ ] All Card JSX tags replaced with GlassCard equivalents
- [ ] No syntax errors
- [ ] All existing props preserved

## Expected Result
Both settings pages should use GlassCard with default settings (medium intensity, no hover effects, animation enabled).
