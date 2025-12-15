# VERIFY Agent Task: Onboarding Dark Theme Validation

## Mission
Test ALL onboarding step files against the dark theme specification to ensure compliance with the UI beautification dark mode standards.

## Context
The UI_BEAUTIFICATION_STATE.json contains strict dark theme guidelines. All onboarding components must:
- Use white text colors (NEVER text-primary or text-muted-foreground on dark backgrounds)
- Use gradient headlines (text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500)
- Use white icons (NEVER blue icons like text-blue-* or text-primary)
- Use glass containers (bg-white/5 border border-white/10)
- NO emojis in JSX
- NO Material Blue backgrounds (bg-muted, bg-primary/5, etc.)

## Files to Test

### Step Files (8 primary):
1. apps/web/src/components/onboarding/steps/WelcomeStep.tsx
2. apps/web/src/components/onboarding/steps/CompanyInfoStep.tsx
3. apps/web/src/components/onboarding/steps/BankingStep.tsx
4. apps/web/src/components/onboarding/steps/EmailStep.tsx
5. apps/web/src/components/onboarding/steps/TaxStep.tsx
6. apps/web/src/components/onboarding/steps/AccountingStep.tsx
7. apps/web/src/components/onboarding/steps/PreferencesStep.tsx
8. apps/web/src/components/onboarding/steps/CompletionStep.tsx

### Supporting Files (2):
9. apps/web/src/components/onboarding/OnboardingWizard.tsx
10. apps/web/src/components/onboarding/OnboardingProgress.tsx

## Dark Theme Spec Rules

### ❌ FORBIDDEN (Report with line numbers):
- text-primary (blue text on blue background)
- text-muted-foreground (blue text)
- bg-muted (light blue background)
- bg-primary/5 or bg-primary/10 (blue backgrounds)
- border-primary (blue borders)
- Emoji characters
- Blue icon colors: text-blue-* on icons
- text-primary on icon elements

### ✅ REQUIRED (Report if missing):
1. Headlines: text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500
2. Text: text-white, text-white/70, text-white/60, text-white/50
3. Icons: text-white/50 or text-white/70 (white only)
4. Containers: bg-white/5 backdrop-blur-xl border border-white/10
5. Badges: bg-white/10 text-white/80 border-white/20

## Output Requirements
Create: ONBOARDING_DARK_THEME_AUDIT.md in project root

Include:
- Executive summary
- Per-file analysis with line numbers
- Summary table
- Priority fix list
- Recommendations

## Success Criteria
1. All 10 files analyzed
2. Every forbidden pattern documented with line numbers
3. Every missing required pattern identified
4. Comprehensive report created
5. Priority fix list provided
