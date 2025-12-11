# VERIFY Agent - UI Beautification Audit

## Mission
Audit files against dark theme spec. FAIL any file with ANY violation.

## MANDATORY: Read Spec First
Read `onboardingDarkThemeSpec` from `.planning/UI_BEAUTIFICATION_STATE.json`

## Audit Checklist - Check EVERY item

### 1. Headline Check
- [ ] Size is `text-3xl md:text-4xl` (NOT text-2xl, NOT text-xl)
- [ ] Has gradient span with `from-blue-400 to-purple-500`
- [ ] Base text is `text-white`
- [ ] Has proper spacing (`mb-6` or similar)

FAIL if: headline is too small, missing gradient, wrong color

### 2. Forbidden Text Patterns (grep each)
```bash
grep -n "text-primary" file.tsx
grep -n "text-muted-foreground" file.tsx
grep -n "text-blue-[0-9]" file.tsx
grep -n "text-foreground" file.tsx
```
FAIL if: ANY match found (except in comments)

### 3. Forbidden Background Patterns
```bash
grep -n "bg-muted" file.tsx
grep -n "bg-primary" file.tsx
grep -n "bg-blue-[0-9]" file.tsx
grep -n "bg-secondary" file.tsx
```
FAIL if: ANY match found (except in comments)

### 4. Forbidden Border Patterns
```bash
grep -n "border-primary" file.tsx
grep -n "border-blue-[0-9]" file.tsx
```
FAIL if: ANY match found

### 5. Icon Color Check
- All non-success/error icons must be `text-white/70` or `text-white/50`
- Success icons can be `text-green-400` or `text-green-500`
- Error icons can be `text-red-400` or `text-red-500`

FAIL if: icons use `text-primary`, `text-blue-*`, or missing color class

### 6. Emoji Check
```bash
grep -P "[\x{1F300}-\x{1F9FF}]" file.tsx
```
FAIL if: ANY emoji found (flags, symbols, etc.)

### 7. Badge Check
- Must not have `text-primary` or `bg-primary/10`
- Must use `text-white/80` or success/error colors

## Output Format

```
## FILE: [filename]

### Headline
- Size: [PASS/FAIL] - found: [actual size]
- Gradient: [PASS/FAIL]
- Color: [PASS/FAIL]

### Forbidden Patterns
- text-primary: [PASS/FAIL] - [count] found at lines [...]
- text-muted-foreground: [PASS/FAIL] - [count] found
- text-blue-*: [PASS/FAIL]
- bg-muted: [PASS/FAIL]
- bg-primary: [PASS/FAIL]
- border-primary: [PASS/FAIL]

### Icons
- [PASS/FAIL] - [issues if any]

### Emojis
- [PASS/FAIL] - [emojis found if any]

### VERDICT: [PASS/FAIL]
- Total violations: [count]
- Lines to fix: [list]
```

## Rules
1. ONE violation = FAIL the entire file
2. Do NOT say "mostly compliant" or "minor issues"
3. List EVERY violation with line number
4. Green/red for success/error states are ALLOWED - don't flag these
