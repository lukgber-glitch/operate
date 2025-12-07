# Minimal Design Components - Quick Reference

## Import

```tsx
import {
  AnimatedCard,
  PrimaryButton,
  MinimalInput,
  HeadlineOutside,
  IconButton,
} from '@/components/ui'
```

---

## AnimatedCard

```tsx
<AnimatedCard variant="elevated" padding="lg">
  Content here
</AnimatedCard>
```

**Variants:** `default` | `elevated` | `outlined`
**Padding:** `sm` | `md` | `lg`
**Border Radius:** `24px`

---

## PrimaryButton

```tsx
<PrimaryButton
  size="lg"
  loading={isLoading}
  onClick={handleClick}
>
  Submit
</PrimaryButton>
```

**Sizes:** `sm` (36px) | `md` (48px) | `lg` (56px)
**Props:** `loading`, `disabled`, `fullWidth`, `id`
**Border Radius:** `12px`

---

## MinimalInput

```tsx
<MinimalInput
  label="Email"
  value={email}
  onChange={setEmail}
  error={emailError}
  icon={<Mail />}
/>
```

**Props:** `label`, `placeholder`, `type`, `value`, `onChange`, `error`, `icon`
**Border Radius:** `12px`
**Features:** Floating label, error state

---

## HeadlineOutside

```tsx
<HeadlineOutside subtitle="Optional subtitle">
  Section Title
</HeadlineOutside>
```

**Props:** `subtitle`, `align` (`left` | `center`)
**Font Size:** `24px`
**Color:** Secondary text

---

## IconButton

```tsx
<IconButton
  icon={<Settings className="h-5 w-5" />}
  aria-label="Settings"
  onClick={handleClick}
  size="md"
/>
```

**Sizes:** `sm` (32px) | `md` (40px)
**Required:** `aria-label` (accessibility)
**Style:** Ghost (transparent background)

---

## Common Pattern

```tsx
<div className="space-y-6">
  <HeadlineOutside subtitle="Description">
    Page Title
  </HeadlineOutside>

  <AnimatedCard variant="elevated" padding="lg">
    <MinimalInput
      label="Field"
      value={value}
      onChange={setValue}
    />

    <PrimaryButton fullWidth onClick={handleSubmit}>
      Submit
    </PrimaryButton>
  </AnimatedCard>
</div>
```

---

## Colors (CSS Variables)

- `--color-primary`: #04BDA5 (teal)
- `--color-surface`: #FCFEFE (white)
- `--color-background`: #F2F2F2 (gray)
- `--color-text-primary`: #1A1A2E (dark)
- `--color-text-secondary`: #6B7280 (medium)
- `--color-error`: #EF4444 (red)

---

## Demo

**URL:** `/demo/minimal-design`

**File:** `apps/web/src/app/demo/minimal-design/page.tsx`
