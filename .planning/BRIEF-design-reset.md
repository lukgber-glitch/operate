# Design System Reset

**One-liner**: Strip all custom styling, animations, and design artifacts to create a clean slate for a new design system.

## Problem

The previous design overhaul attempts failed multiple times, leaving behind:
- Inconsistent styling across components
- Multiple conflicting animation systems (GSAP, Framer Motion, CSS)
- Duplicated design tokens (globals.css AND design-tokens.css)
- 121+ documentation files cluttering the codebase
- Custom UI variants that don't follow a cohesive pattern
- Heavy Tailwind customizations that conflict with each other

The codebase needs a complete style reset while preserving all business logic, APIs, and functionality.

## Success Criteria

- [ ] All animation directories deleted (`lib/gsap/`, `lib/animation/`, `components/animation/`)
- [ ] All custom CSS stripped (animations.css, components.css, gradient-background.css empty)
- [ ] Design tokens reduced to minimal variables
- [ ] globals.css contains only Tailwind base imports
- [ ] Tailwind config reset to near-default (keep shadcn compatibility)
- [ ] Custom UI variants removed (keep base shadcn components)
- [ ] Style-related .md documentation deleted
- [ ] Demo pages deleted
- [ ] App still builds successfully
- [ ] App still runs (functional, just unstyled/minimal)
- [ ] All business logic intact (hooks, API, stores)

## Constraints

- **Zero functionality loss**: All APIs, hooks, forms, and business logic must work
- **Keep i18n**: RTL support, locale provider, arabic fonts stay
- **Keep accessibility**: a11y CSS helpers stay
- **Keep shadcn base**: Standard shadcn/ui components stay (they'll be restyled later)
- **Keep skeletons**: Loading state components are functional, keep them
- **Build must pass**: After cleanup, `npm run build` must succeed

## Out of Scope

- Creating new design system (that's the next project)
- Styling components (we're just stripping styles)
- Changing component structure/props
- Touching API layer or backend
- Database changes

## Current State

Based on analysis (see STYLE_INVENTORY.md):
- 190+ style-related files identified
- 3 animation directories to delete
- 6 CSS files to strip
- 13 custom UI variants to remove
- 121 .md files to clean up
- Heavy Tailwind customization to reset

## Desired End State

A minimal, functional app with:
- Basic Tailwind utilities only
- Standard shadcn/ui components (unstyled beyond defaults)
- No animations
- No custom design tokens
- No gradient backgrounds
- No demo pages
- Clean, minimal codebase ready for fresh design system
