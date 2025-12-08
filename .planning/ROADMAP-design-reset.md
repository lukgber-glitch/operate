# Roadmap: Design System Reset

## Overview

Strip all custom styling to prepare for a fresh design system. App functionality preserved, styles removed.

## Phases

- [ ] **Phase 1: Delete Animation System** - Remove all animation directories and files
- [ ] **Phase 2: Strip CSS Files** - Empty/reset all custom CSS
- [ ] **Phase 3: Remove UI Variants** - Delete custom component variants
- [ ] **Phase 4: Reset Tailwind** - Strip custom config back to basics
- [ ] **Phase 5: Clean Documentation** - Remove style-related .md files
- [ ] **Phase 6: Fix Imports & Build** - Update imports, verify build passes

## Phase Details

### Phase 1: Delete Animation System
**Goal**: Remove all animation libraries and components
**Plans**: 2 plans

Plans:
- [ ] 01-01: Delete animation directories (lib/gsap, lib/animation, components/animation)
- [ ] 01-02: Remove animation hook and utility files

### Phase 2: Strip CSS Files
**Goal**: Reset all CSS to minimal state
**Plans**: 2 plans

Plans:
- [ ] 02-01: Strip animations.css, components.css, gradient-background.css, globals-custom.css
- [ ] 02-02: Reset globals.css and design-tokens.css to minimal

### Phase 3: Remove UI Variants
**Goal**: Delete custom UI component variants, keep base shadcn
**Plans**: 2 plans

Plans:
- [ ] 03-01: Delete animated UI components (AnimatedButton, animated-card, etc.)
- [ ] 03-02: Delete variant files (button-variants, badge-variants, etc.)

### Phase 4: Reset Tailwind Config
**Goal**: Strip Tailwind to near-default with shadcn compatibility
**Plans**: 1 plan

Plans:
- [ ] 04-01: Remove custom keyframes, animations, colors (keep shadcn vars and RTL utils)

### Phase 5: Clean Documentation
**Goal**: Remove style-related .md clutter
**Plans**: 2 plans

Plans:
- [ ] 05-01: Delete animation/design .md files in components/
- [ ] 05-02: Delete demo pages and their directories

### Phase 6: Fix Imports & Build
**Goal**: Update broken imports and verify build
**Plans**: 2 plans

Plans:
- [ ] 06-01: Fix broken imports across codebase (remove animation imports)
- [ ] 06-02: Run build, fix any remaining errors

## Progress

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Delete Animation System | 0/2 | Not started |
| 2. Strip CSS Files | 0/2 | Not started |
| 3. Remove UI Variants | 0/2 | Not started |
| 4. Reset Tailwind Config | 0/1 | Not started |
| 5. Clean Documentation | 0/2 | Not started |
| 6. Fix Imports & Build | 0/2 | Not started |

## Plan Files

All plans in `.planning/phases/design-reset/`

## Key References

- `.planning/STYLE_INVENTORY.md` - Full analysis of files to remove
- `.planning/BRIEF-design-reset.md` - Project scope and constraints
