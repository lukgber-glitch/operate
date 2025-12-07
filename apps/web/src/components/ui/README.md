# Operate UI Components - Quick Reference

## Updated Components (Design System v1.0)

### Button Component

**New Variants** (recommended):
```tsx
<Button variant="primary">Primary Action</Button>     // Teal brand color
<Button variant="secondary">Secondary</Button>         // White with teal border
<Button variant="ghost">Ghost</Button>                 // Transparent
```

**Legacy Variants** (Shadcn/UI):
```tsx
<Button variant="default">Default</Button>             // Blue
<Button variant="destructive">Delete</Button>          // Red
<Button variant="outline">Outline</Button>             // Outlined
<Button variant="link">Link</Button>                   // Text link
```

**Sizes**:
```tsx
<Button size="sm">Small</Button>       // 36px height
<Button size="default">Medium</Button> // 40px height
<Button size="lg">Large</Button>       // 48px height
<Button size="icon">Icon</Button>      // 40px square
```

### Card Component

**Basic Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

**Features**:
- Automatic hover effect (shadow + border color change)
- Uses `--radius-lg` (12px border radius)
- Uses `--space-6` (24px padding)
- Surface background color (#FCFEFE)

### Input Component

**Basic Usage**:
```tsx
<Input
  type="email"
  placeholder="Enter email"
/>
```

**Features**:
- Focus state with teal border and focus ring
- Uses `--radius-md` (8px border radius)
- Muted placeholder text
- Smooth transitions

## Utility Classes (components.css)

### Button Classes
```tsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-ghost">Ghost</button>

// Sizes
<button className="btn-primary btn-sm">Small</button>
<button className="btn-primary btn-lg">Large</button>
```

### Card Classes
```tsx
<div className="card">Basic Card</div>
<div className="card card-elevated">Elevated</div>
<div className="card card-interactive">Interactive (clickable)</div>
<div className="card card-suggestion">Suggestion (left border)</div>
```

### Chat Components
```tsx
<div className="chat-container">
  <div className="message-user">User message</div>
  <div className="message-assistant">Assistant response</div>
</div>

<div className="chat-input-container">
  <input className="input" placeholder="Type a message..." />
  <button className="btn-primary">Send</button>
</div>
```

### Quick Actions
```tsx
<button className="quick-action">
  <Mail size={16} />
  Send Email
</button>
```

### Suggestion Cards
```tsx
<div className="suggestion-card">
  <div className="icon">
    <FileText size={20} />
  </div>
  <div className="content">
    <div className="title">Card Title</div>
    <div className="description">Description text</div>
    <div className="actions">
      <button className="btn-primary btn-sm">Approve</button>
      <button className="btn-ghost btn-sm">Reject</button>
    </div>
  </div>
</div>
```

### Badges
```tsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-info">Info</span>
```

### Alerts
```tsx
<div className="alert alert-success">
  <CheckCircle size={20} />
  <span>Success message</span>
</div>

<div className="alert alert-warning">
  <AlertTriangle size={20} />
  <span>Warning message</span>
</div>

<div className="alert alert-error">
  <XCircle size={20} />
  <span>Error message</span>
</div>

<div className="alert alert-info">
  <Info size={20} />
  <span>Info message</span>
</div>
```

### Avatar
```tsx
<div className="avatar">JD</div>
<div className="avatar avatar-sm">JD</div>
<div className="avatar avatar-lg">JD</div>
```

### Empty State
```tsx
<div className="empty-state">
  <div className="empty-state-icon">
    <Inbox size={64} />
  </div>
  <div className="empty-state-title">No items found</div>
  <div className="empty-state-description">
    Get started by creating your first item
  </div>
</div>
```

### Other Utilities
```tsx
<div className="spinner"><!-- Loading spinner --></div>
<div className="divider"><!-- Horizontal divider --></div>
```

## Design Tokens Reference

All components use CSS variables from `globals.css`:

### Colors
- `--color-primary` - #04BDA5 (Teal)
- `--color-primary-hover` - #06BF9D
- `--color-primary-dark` - #039685
- `--color-surface` - #FCFEFE (White)
- `--color-background` - #F2F2F2 (Light gray)
- `--color-border` - #E5E7EB (Border gray)

### Spacing
- `--space-1` through `--space-16` (4px to 64px)

### Radius
- `--radius-sm` (6px)
- `--radius-md` (8px)
- `--radius-lg` (12px)
- `--radius-xl` (16px)
- `--radius-2xl` (24px)
- `--radius-full` (9999px)

### Shadows
- `--shadow-sm` - Subtle
- `--shadow-md` - Medium
- `--shadow-lg` - Large
- `--shadow-focus` - Focus ring

### Transitions
- `--transition-fast` (150ms)
- `--transition-base` (250ms)
- `--transition-slow` (350ms)

## Migration Guide

### From Old Buttons
```tsx
// Old
<Button>Submit</Button>

// New (same behavior, but teal instead of blue)
<Button variant="primary">Submit</Button>

// Keep old blue color
<Button variant="default">Submit</Button>
```

### From Custom Styled Cards
```tsx
// Old
<div className="rounded-lg border bg-white p-6 shadow-sm">
  Content
</div>

// New
<Card>
  <CardContent>Content</CardContent>
</Card>
```

### From Custom Inputs
```tsx
// Old
<input className="rounded-md border px-3 py-2" />

// New
<Input />

// Or use utility class
<input className="input" />
```

## Files

- **Components**: `apps/web/src/components/ui/`
  - `button.tsx` - Button component
  - `card.tsx` - Card component
  - `input.tsx` - Input component

- **Styles**: `apps/web/src/styles/`
  - `components.css` - Utility classes

- **Design System**: `agents/DESIGN_SYSTEM.md`
- **Tokens**: `apps/web/src/app/globals.css`
