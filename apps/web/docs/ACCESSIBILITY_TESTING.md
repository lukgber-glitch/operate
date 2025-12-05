# Accessibility Testing Guide

## Quick Start

### Run Automated Tests

```bash
# Install dependencies
npm install -D @axe-core/react eslint-plugin-jsx-a11y

# Run accessibility linter
npm run lint

# Build and test with Lighthouse
npm run build
npm run start
# In another terminal:
npx lighthouse http://localhost:3000 --only-categories=accessibility --view
```

---

## Manual Testing Procedures

### 1. Keyboard Navigation Testing

**Goal:** Ensure all functionality is accessible without a mouse.

#### Test Steps

1. **Navigate with Tab**
   ```
   - Press Tab repeatedly to move forward
   - Press Shift+Tab to move backward
   - Verify focus indicator is always visible
   - Verify tab order is logical (top-to-bottom, left-to-right)
   ```

2. **Activate Elements**
   ```
   - Press Enter on links and buttons
   - Press Space on buttons and checkboxes
   - Use Arrow keys in dropdowns and menus
   ```

3. **Skip Navigation**
   ```
   - Press Tab on page load
   - Verify "Skip to main content" appears
   - Press Enter
   - Verify focus moves to main content
   ```

4. **Modal Dialogs**
   ```
   - Open a modal
   - Press Tab - focus should stay trapped in modal
   - Press Escape - modal should close
   - Verify focus returns to trigger element
   ```

5. **Forms**
   ```
   - Tab through all form fields
   - Verify labels read correctly
   - Submit with Enter key
   - Verify errors are announced
   ```

#### Checklist

- [ ] All interactive elements reachable
- [ ] Tab order is logical
- [ ] Focus indicator always visible
- [ ] No keyboard traps
- [ ] Escape closes modals
- [ ] Enter submits forms
- [ ] Skip link works

---

### 2. Screen Reader Testing

**Goal:** Ensure content is properly announced to blind users.

#### Windows + NVDA (Free)

1. **Install NVDA**
   - Download from https://www.nvaccess.org/download/
   - Install and restart

2. **Basic Commands**
   ```
   NVDA + Q     - Quit NVDA
   Insert       - NVDA key (default)
   Caps Lock    - NVDA key (alternative)

   Tab          - Next interactive element
   Shift+Tab    - Previous interactive element
   Down Arrow   - Next line
   Up Arrow     - Previous line
   H            - Next heading
   Shift+H      - Previous heading
   L            - Next list
   I            - Next list item
   F            - Next form field
   B            - Next button
   ```

3. **Test Scenarios**
   ```
   - Navigate entire page with Down Arrow
   - Jump through headings with H key
   - Tab through interactive elements
   - Fill out a form
   - Trigger an error and listen to announcement
   - Open chat and send a message
   ```

#### macOS + VoiceOver (Built-in)

1. **Enable VoiceOver**
   ```
   Cmd+F5 - Toggle VoiceOver
   ```

2. **Basic Commands**
   ```
   VO           - Control+Option (VoiceOver key)
   VO+A         - Start reading
   VO+Left/Right - Move to previous/next item
   VO+Space     - Activate item
   VO+H         - Next heading
   VO+U         - Open rotor (navigation menu)
   ```

3. **Rotor Navigation**
   ```
   - Press VO+U to open rotor
   - Use Left/Right arrows to change category
   - Use Up/Down arrows to navigate items
   - Categories: Headings, Links, Form Controls, Landmarks
   ```

#### Testing Checklist

- [ ] Page title announced on load
- [ ] Headings announce correctly (level + text)
- [ ] Links announce as links with clear text
- [ ] Buttons announce as buttons
- [ ] Form labels announce before inputs
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Modal dialogs announce properly
- [ ] Lists announce item count
- [ ] Images have alt text or marked decorative

---

### 3. Visual Testing

**Goal:** Ensure visual presentation meets accessibility standards.

#### Zoom Testing

1. **Browser Zoom**
   ```
   - Zoom to 200% (Ctrl/Cmd + Plus)
   - Verify all content visible
   - Verify no horizontal scrolling
   - Verify text doesn't overlap
   - Zoom to 400% (maximum)
   - Verify critical content still accessible
   ```

2. **Text Resize**
   ```
   - Browser Settings > Appearance > Font Size
   - Increase to "Very Large"
   - Verify layout doesn't break
   - Verify all text readable
   ```

#### Color Contrast Testing

1. **Automated Check**
   ```bash
   # Use browser DevTools
   - Open Inspector
   - Select element with text
   - Check "Accessibility" tab
   - Look for contrast ratio
   - Should be 4.5:1 for normal text
   - Should be 3:1 for large text (18pt+)
   ```

2. **Manual Tools**
   - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - Measure foreground and background colors
   - Verify AA compliance (4.5:1 minimum)

#### Color Blindness Testing

1. **Browser Extensions**
   - [Colorblinding](https://chrome.google.com/webstore/detail/colorblinding) (Chrome)
   - Test with different types:
     - Protanopia (Red-blind)
     - Deuteranopia (Green-blind)
     - Tritanopia (Blue-blind)

2. **Checklist**
   - [ ] Status not indicated by color alone
   - [ ] Error messages include icons/text
   - [ ] Charts have patterns in addition to colors
   - [ ] Links distinguishable from text (underlined)

#### Focus Indicator Testing

1. **Visual Check**
   ```
   - Tab through all interactive elements
   - Verify outline visible on each
   - Should be minimum 2px solid
   - Should contrast 3:1 with background
   - Should have offset from element
   ```

2. **Custom Focus Styles**
   ```css
   /* All elements should have this or similar */
   :focus-visible {
     outline: 2px solid hsl(var(--ring));
     outline-offset: 2px;
   }
   ```

#### Checklist

- [ ] Content reflows at 200% zoom
- [ ] No horizontal scrolling at 200%
- [ ] Text readable at 400% zoom
- [ ] Contrast ratios meet AA (4.5:1)
- [ ] Color not sole indicator
- [ ] Focus indicators visible and clear
- [ ] Works with color blindness simulation

---

### 4. Mobile Accessibility Testing

**Goal:** Ensure touch and mobile screen reader accessibility.

#### iOS + VoiceOver

1. **Enable VoiceOver**
   ```
   Settings > Accessibility > VoiceOver > On
   Or: Triple-click side button (if configured)
   ```

2. **Basic Gestures**
   ```
   Single tap            - Select item
   Double tap           - Activate item
   Swipe right          - Next item
   Swipe left           - Previous item
   Two-finger tap       - Activate/pause
   Two-finger Z         - Undo
   Rotor                - Rotate two fingers
   ```

3. **Test Scenarios**
   ```
   - Swipe through entire page
   - Use rotor to navigate by headings
   - Fill out form
   - Open and close modal
   - Use chat interface
   ```

#### Android + TalkBack

1. **Enable TalkBack**
   ```
   Settings > Accessibility > TalkBack > On
   Or: Volume up + down buttons (hold 3 sec)
   ```

2. **Basic Gestures**
   ```
   Single tap           - Speak item
   Double tap          - Activate item
   Swipe right         - Next item
   Swipe left          - Previous item
   Swipe down-then-up  - Read from top
   ```

#### Touch Target Testing

1. **Minimum Size**
   ```
   - Touch targets should be 44x44 CSS pixels minimum
   - Ideally 48x48px for better accessibility
   - Check buttons, links, checkboxes, radio buttons
   ```

2. **Spacing**
   ```
   - At least 8px spacing between touch targets
   - Prevents accidental activation
   ```

#### Checklist

- [ ] All touch targets 44x44px minimum
- [ ] Adequate spacing between targets
- [ ] Gestures don't require precise timing
- [ ] No path-based gestures required
- [ ] VoiceOver announces all content
- [ ] TalkBack announces all content
- [ ] Forms work with screen reader
- [ ] Modals work with screen reader

---

### 5. Cognitive Accessibility Testing

**Goal:** Ensure content is understandable and usable.

#### Content Clarity

1. **Reading Level**
   ```
   - Copy page text
   - Paste into readability checker
   - Target: Grade 8-10 reading level
   - Tools: Hemingway Editor, Readable
   ```

2. **Instructions**
   ```
   - Are instructions clear and concise?
   - Are examples provided?
   - Is help available when needed?
   ```

#### Error Prevention

1. **Form Validation**
   ```
   - Submit form with errors
   - Verify errors are clear
   - Verify errors suggest solutions
   - Verify errors don't just say "Error"
   ```

2. **Confirmation**
   ```
   - Attempt destructive action (delete, etc.)
   - Verify confirmation dialog appears
   - Verify can undo/cancel
   ```

#### Time Limits

1. **Session Timeout**
   ```
   - Wait for session timeout
   - Verify warning appears
   - Verify can extend session
   - Verify data is not lost
   ```

2. **Auto-advancing Content**
   ```
   - Check for carousels, slideshows
   - Verify can pause/stop
   - Verify can control timing
   ```

#### Checklist

- [ ] Language is simple and clear
- [ ] Instructions are easy to follow
- [ ] Error messages are helpful
- [ ] Confirmation for destructive actions
- [ ] No unexpected time limits
- [ ] Can extend timeouts
- [ ] Auto-advancing content controllable

---

## Automated Testing Tools

### Browser Extensions

1. **axe DevTools**
   - [Chrome Extension](https://chrome.google.com/webstore/detail/axe-devtools-web-accessibility/lhdoppojpmngadmnindnejefpokejbdd)
   - Scans page for accessibility issues
   - Provides detailed reports with fixes

2. **WAVE**
   - [Chrome Extension](https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh)
   - Visual feedback on accessibility
   - Shows landmarks, headings, ARIA

3. **Lighthouse**
   ```bash
   # Built into Chrome DevTools
   # Or via CLI:
   npm install -g lighthouse
   lighthouse https://operate.guru --only-categories=accessibility
   ```

### Code Linters

1. **eslint-plugin-jsx-a11y**
   ```bash
   # Install
   npm install -D eslint-plugin-jsx-a11y

   # Add to .eslintrc
   {
     "extends": ["plugin:jsx-a11y/recommended"]
   }
   ```

2. **Run Linter**
   ```bash
   npm run lint
   ```

### CI/CD Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run start &
      - run: npx wait-on http://localhost:3000
      - run: npx @axe-core/cli http://localhost:3000
```

---

## Test Cases by Component

### Forms (Register, Login)

- [ ] All inputs have labels
- [ ] Labels associated with inputs (htmlFor)
- [ ] Required fields marked (aria-required or required)
- [ ] Error messages announced (role="alert")
- [ ] Invalid inputs marked (aria-invalid)
- [ ] Error descriptions linked (aria-describedby)
- [ ] Submit button has clear label
- [ ] Form submits with Enter key
- [ ] Loading state announced (aria-busy)

### Navigation (Sidebar)

- [ ] Navigation landmark (role="navigation")
- [ ] Descriptive label (aria-label)
- [ ] All links keyboard accessible
- [ ] Current page indicated (aria-current)
- [ ] Icons decorative (aria-hidden)
- [ ] Expand/collapse announced (aria-expanded)
- [ ] Logical tab order

### Modals (Chat, Dialogs)

- [ ] Dialog role (role="dialog")
- [ ] Modal attribute (aria-modal="true")
- [ ] Labeled (aria-labelledby or aria-label)
- [ ] Focus trapped in modal
- [ ] Escape closes modal
- [ ] Focus returns to trigger on close
- [ ] Backdrop click closes (optional)

### Lists (Tasks, Activity)

- [ ] List landmark (role="list")
- [ ] List items (role="listitem")
- [ ] Proper heading hierarchy
- [ ] Interactive items keyboard accessible
- [ ] Status indicators not color-only

### Buttons & Links

- [ ] Accessible name (text or aria-label)
- [ ] Correct role (button vs link)
- [ ] Icons decorative (aria-hidden)
- [ ] Disabled state announced (aria-disabled)
- [ ] Loading state announced (aria-busy)
- [ ] Keyboard activatable (Enter/Space)

---

## Common Issues & Fixes

### Missing Alt Text

❌ Bad:
```tsx
<img src="/logo.png" />
```

✅ Good:
```tsx
<img src="/logo.png" alt="Operate Logo" />
```

### Icon-only Buttons

❌ Bad:
```tsx
<button>
  <SearchIcon />
</button>
```

✅ Good:
```tsx
<button aria-label="Search">
  <SearchIcon aria-hidden="true" />
</button>
```

### Form Without Labels

❌ Bad:
```tsx
<input type="email" placeholder="Email" />
```

✅ Good:
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" placeholder="you@example.com" />
```

### Error Not Announced

❌ Bad:
```tsx
{error && <div>{error}</div>}
```

✅ Good:
```tsx
{error && (
  <div role="alert" aria-live="assertive">
    {error}
  </div>
)}
```

### Missing Skip Link

❌ Bad:
```tsx
<body>
  <nav>...</nav>
  <main>...</main>
</body>
```

✅ Good:
```tsx
<body>
  <a href="#main" className="skip-link">Skip to main content</a>
  <nav>...</nav>
  <main id="main">...</main>
</body>
```

---

## Resources

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Hemingway Editor](http://www.hemingwayapp.com/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Windows, free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, paid)
- VoiceOver (macOS/iOS, built-in)
- TalkBack (Android, built-in)

### Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

### Courses
- [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891)
- [Digital Accessibility Foundations](https://www.w3.org/WAI/fundamentals/foundations-course/)
