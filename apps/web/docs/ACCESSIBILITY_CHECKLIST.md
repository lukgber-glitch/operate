# Accessibility Quick Reference - Developer Checklist

## Before Every Commit

- [ ] Run `npm run lint` - no accessibility errors
- [ ] Tab through your changes - keyboard works
- [ ] Check focus indicators are visible
- [ ] Test with zoom at 200%
- [ ] Verify no console errors about ARIA

---

## Images & Icons

### Images with Meaning
```tsx
<img src="/chart.png" alt="Revenue growth chart showing 23% increase" />
```

### Decorative Images
```tsx
<img src="/decoration.png" alt="" />
```

### Icon Buttons
```tsx
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

### Icon with Text
```tsx
<button>
  <PlusIcon aria-hidden="true" />
  Add Item
</button>
```

---

## Forms

### Basic Input
```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  autoComplete="email"
  required
/>
```

### Input with Error
```tsx
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-invalid={!!error}
  aria-describedby={error ? "password-error password-hint" : "password-hint"}
  autoComplete="new-password"
/>
<p id="password-hint">Must be at least 8 characters</p>
{error && (
  <p id="password-error" role="alert">
    {error}
  </p>
)}
```

### Checkbox
```tsx
<div className="flex gap-2">
  <Checkbox id="terms" />
  <label htmlFor="terms">
    I agree to the <a href="/terms">Terms</a>
  </label>
</div>
```

### Form Submission
```tsx
<Button
  type="submit"
  disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? 'Submitting...' : 'Submit'}
</Button>
```

---

## Buttons & Links

### Standard Button
```tsx
<Button onClick={handleClick}>
  Save Changes
</Button>
```

### Icon Button
```tsx
<Button
  onClick={handleEdit}
  aria-label="Edit profile"
>
  <EditIcon aria-hidden="true" />
</Button>
```

### Toggle Button
```tsx
<Button
  onClick={toggle}
  aria-pressed={isActive}
  aria-label={isActive ? 'Mute notifications' : 'Unmute notifications'}
>
  {isActive ? <BellOffIcon /> : <BellIcon />}
</Button>
```

### Link vs Button
```tsx
{/* Navigation - use Link */}
<Link href="/dashboard">Go to Dashboard</Link>

{/* Action - use Button */}
<Button onClick={handleDelete}>Delete Item</Button>
```

### Disabled Elements
```tsx
<Button disabled aria-disabled="true">
  Unavailable Action
</Button>
```

---

## Modals & Dialogs

### Basic Modal
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogTitle id="dialog-title">
      Confirm Delete
    </DialogTitle>
    <DialogDescription id="dialog-description">
      Are you sure you want to delete this item?
    </DialogDescription>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Close Button
```tsx
<DialogClose asChild>
  <Button variant="ghost" aria-label="Close dialog">
    <XIcon aria-hidden="true" />
  </Button>
</DialogClose>
```

---

## Navigation

### Main Navigation
```tsx
<nav aria-label="Main navigation">
  <ul>
    <li><Link href="/">Home</Link></li>
    <li><Link href="/about">About</Link></li>
  </ul>
</nav>
```

### Breadcrumbs
```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li><Link href="/">Home</Link></li>
    <li><Link href="/products">Products</Link></li>
    <li aria-current="page">Product Name</li>
  </ol>
</nav>
```

### Current Page
```tsx
<Link
  href="/dashboard"
  aria-current={isCurrentPage ? 'page' : undefined}
>
  Dashboard
</Link>
```

### Skip Link
```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

{/* Later in the page */}
<main id="main-content">
  ...
</main>
```

---

## Live Regions

### Status Messages
```tsx
<div role="status" aria-live="polite">
  Saving changes...
</div>
```

### Error Alerts
```tsx
<div role="alert" aria-live="assertive">
  Error: Failed to save changes
</div>
```

### Loading States
```tsx
<div role="status" aria-live="polite" aria-busy="true">
  <Spinner aria-hidden="true" />
  Loading data...
</div>
```

### Success Messages
```tsx
{saved && (
  <div role="status" aria-live="polite">
    ✓ Changes saved successfully
  </div>
)}
```

---

## Lists

### Unordered List
```tsx
<ul role="list">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Ordered List
```tsx
<ol role="list">
  <li>First step</li>
  <li>Second step</li>
</ol>
```

### Description List
```tsx
<dl>
  <dt>Name</dt>
  <dd>John Doe</dd>
  <dt>Email</dt>
  <dd>john@example.com</dd>
</dl>
```

---

## Headings

### Hierarchy
```tsx
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
    <h3>Another Subsection</h3>
  <h2>Another Section</h2>
```

### Visually Hidden Headings
```tsx
<h2 className="sr-only">Navigation Menu</h2>
<nav>...</nav>
```

---

## Tables

### Basic Table
```tsx
<table>
  <caption>Employee Directory</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col">Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">John Doe</th>
      <td>john@example.com</td>
      <td>Developer</td>
    </tr>
  </tbody>
</table>
```

### Sortable Table
```tsx
<th scope="col" aria-sort="ascending">
  <button onClick={handleSort}>
    Name
    <SortIcon aria-hidden="true" />
  </button>
</th>
```

---

## Components

### Card Region
```tsx
<Card role="region" aria-labelledby="card-title">
  <CardHeader>
    <CardTitle id="card-title">Statistics</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Accordion
```tsx
<Accordion>
  <AccordionItem>
    <AccordionTrigger aria-expanded={isOpen}>
      Section Title
    </AccordionTrigger>
    <AccordionContent>
      Section content...
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList aria-label="Settings tabs">
    <TabsTrigger value="tab1">General</TabsTrigger>
    <TabsTrigger value="tab2">Security</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">General settings...</TabsContent>
  <TabsContent value="tab2">Security settings...</TabsContent>
</Tabs>
```

---

## Screen Reader Only Content

### Helper Text
```tsx
<span className="sr-only">
  (opens in new window)
</span>
```

### Form Hints
```tsx
<input aria-describedby="password-hint" />
<span id="password-hint" className="sr-only">
  Press Ctrl+H to generate a strong password
</span>
```

---

## Common Patterns

### Loading Button
```tsx
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner aria-hidden="true" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Search Input
```tsx
<form role="search">
  <label htmlFor="search">Search</label>
  <input
    id="search"
    type="search"
    placeholder="Search..."
    aria-label="Search content"
  />
  <button type="submit">
    <SearchIcon aria-hidden="true" />
    <span className="sr-only">Submit search</span>
  </button>
</form>
```

### Status Badge
```tsx
<span
  className={statusClass}
  role="status"
  aria-label={`Status: ${status}`}
>
  {status}
</span>
```

### Pagination
```tsx
<nav aria-label="Pagination">
  <button aria-label="Previous page">Previous</button>
  <button aria-label="Page 1">1</button>
  <button aria-current="page" aria-label="Page 2, current page">2</button>
  <button aria-label="Page 3">3</button>
  <button aria-label="Next page">Next</button>
</nav>
```

---

## ARIA Attributes Quick Reference

### States
- `aria-busy` - Element is loading/updating
- `aria-checked` - Checkbox/radio state
- `aria-current` - Current item in set (page, step, etc.)
- `aria-disabled` - Element is disabled
- `aria-expanded` - Expandable element state
- `aria-hidden` - Hide from screen readers
- `aria-invalid` - Form field has error
- `aria-pressed` - Toggle button state
- `aria-selected` - Selected item in list

### Properties
- `aria-label` - Accessible name
- `aria-labelledby` - Reference to label element
- `aria-describedby` - Reference to description element
- `aria-required` - Field is required

### Relationships
- `aria-controls` - Element controls another
- `aria-owns` - Element owns another
- `aria-activedescendant` - Active child element

### Live Regions
- `aria-live="polite"` - Announce when convenient
- `aria-live="assertive"` - Announce immediately
- `aria-atomic` - Announce entire region vs changes
- `role="status"` - Status message
- `role="alert"` - Important alert

---

## Don'ts

### ❌ Don't Do This

```tsx
// Missing label
<input type="text" placeholder="Email" />

// Icon without label
<button><TrashIcon /></button>

// Using div as button
<div onClick={handleClick}>Click me</div>

// Color-only indicator
<span style={{ color: 'red' }}>Error</span>

// Auto-focus without reason
<input autoFocus />

// Missing alt
<img src="/photo.jpg" />

// Nested buttons
<button>
  <button>Inner</button>
</button>

// Invalid ARIA
<div role="button" href="/link">Click</div>
```

### ✅ Do This Instead

```tsx
// With label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Icon with label
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>

// Semantic button
<button onClick={handleClick}>Click me</button>

// Error with icon and text
<div role="alert">
  <AlertIcon aria-hidden="true" />
  Error: Invalid email
</div>

// Focus management
useEffect(() => {
  if (modalOpen) inputRef.current?.focus()
}, [modalOpen])

// Descriptive alt
<img src="/photo.jpg" alt="Team photo from 2024 retreat" />

// Separate buttons
<div>
  <button>Outer</button>
  <button>Inner</button>
</div>

// Semantic HTML
<a href="/link">Navigate</a>
<button onClick={handleClick}>Action</button>
```

---

## Testing Shortcuts

### Quick Tests

1. **Keyboard**: Tab through page
2. **Zoom**: Ctrl/Cmd + to 200%
3. **Screen Reader**: Turn on and navigate
4. **DevTools**: Check Accessibility panel
5. **Axe**: Run browser extension

### Red Flags

- ⚠️ Elements with no accessible name
- ⚠️ Missing form labels
- ⚠️ Low color contrast
- ⚠️ No focus indicator
- ⚠️ Keyboard trap
- ⚠️ Auto-playing media
- ⚠️ Time limits without controls

---

## Resources

- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Custom Hooks

### useAccessibility
```tsx
const { reducedMotion, highContrast } = useAccessibility()
```

### useKeyboardNavigation
```tsx
useKeyboardNavigation({
  onEscape: handleClose,
  onEnter: handleSubmit,
})
```

### useAnnounce
```tsx
const { announce, AnnouncementRegion } = useAnnounce()
announce('Changes saved successfully')
```

---

**Remember:** When in doubt, use semantic HTML first!
