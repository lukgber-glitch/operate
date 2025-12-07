# CustomerCard Component Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│ CustomerCard                                 [ACTIVE ✓] │ <- Status Badge
│ ┌────────────────────────────────────────────────────┐  │
│ │ CardHeader                                         │  │
│ │ ┌──┐  John Smith                                   │  │
│ │ │JS│  🏢 Acme Corporation                          │  │ <- Avatar + Info
│ │ └──┘  ✉️  john.smith@acme.com                      │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ CardContent                                        │  │
│ │ ┌──────────────────┬──────────────────┐           │  │
│ │ │ 💵 Total Revenue │ 📄 Invoices      │           │  │ <- Metrics Grid
│ │ │ $125,000.00      │ 24               │           │  │
│ │ └──────────────────┴──────────────────┘           │  │
│ │                                                    │  │
│ │ ┌──────────────────────┐ ┌───────────────────┐   │  │
│ │ │ 👤 View Profile  →   │ │ ✉️  Send Email    │   │  │ <- Actions
│ │ └──────────────────────┘ └───────────────────┘   │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
CustomerCard (Main Container)
├── Card (max-w-md, hover:shadow-lg)
    ├── CardHeader (pb-3)
    │   └── Flex Container (justify-between)
    │       ├── Avatar Section (flex-1)
    │       │   ├── Avatar (h-12 w-12)
    │       │   │   └── AvatarFallback (initials)
    │       │   └── Customer Details (flex-1)
    │       │       ├── Name (h3)
    │       │       ├── Company (optional)
    │       │       │   ├── Building2 Icon
    │       │       │   └── Company Name
    │       │       └── Email (optional)
    │       │           ├── Mail Icon
    │       │           └── Email Address
    │       └── Badge (status)
    │           ├── StatusIcon (CheckCircle/XCircle)
    │           └── Status Label
    └── CardContent (space-y-4)
        ├── Metrics Grid (grid-cols-2)
        │   ├── Revenue Column
        │   │   ├── Icon + Label
        │   │   └── Formatted Amount
        │   └── Invoices Column
        │       ├── Icon + Label
        │       └── Invoice Count
        └── Actions Row (flex gap-2)
            ├── View Profile Button (optional)
            │   ├── User Icon
            │   ├── Text
            │   └── ExternalLink Icon
            └── Send Email Button (optional)
                ├── Mail Icon
                └── Text
```

## State Variations

### Full Data (All Props)
- Shows avatar with initials
- Displays name, company, email
- Shows status badge
- Displays revenue and invoice count
- Both action buttons visible

### Minimal Data
- Shows avatar with initials
- Displays name only
- Shows status badge
- Shows 'N/A' for revenue
- Shows '0' for invoices
- No action buttons

### Partial Data
- Conditionally renders company
- Conditionally renders email
- Conditionally renders View Profile button
- Conditionally renders Send Email button (requires email)

## Responsive Behavior

### Desktop (≥768px)
```
┌─────────────────────────────────────┐
│ [Avatar] Name          [Badge]      │
│          Company                    │
│          Email                      │
│ ┌──────────┬──────────┐            │
│ │ Revenue  │ Invoices │            │
│ └──────────┴──────────┘            │
│ [View Profile] [Send Email]        │
└─────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────┐
│ [Av] Name  [Badge]  │
│      Company        │
│      Email          │
│ ┌─────┬───────┐    │
│ │ Rev │ Inv   │    │
│ └─────┴───────┘    │
│ [View] [Email]     │
└─────────────────────┘
```

## Icon Legend

- 👤 User Icon - View Profile
- ✉️  Mail Icon - Email
- 🏢 Building2 Icon - Company
- 💵 DollarSign Icon - Revenue
- 📄 FileText Icon - Invoices
- → ExternalLink Icon - External link indicator
- ✓ CheckCircle Icon - Active status
- ✗ XCircle Icon - Inactive status

## Color Scheme

### Status - ACTIVE
- Background: `bg-green-100` (light) / `bg-green-900` (dark)
- Text: `text-green-800` (light) / `text-green-300` (dark)
- Icon: CheckCircle

### Status - INACTIVE
- Background: `bg-gray-100` (light) / `bg-gray-900` (dark)
- Text: `text-gray-800` (light) / `text-gray-300` (dark)
- Icon: XCircle

### Avatar
- Background: `bg-primary/10`
- Text: `text-primary`

### Metrics Background
- Background: `bg-muted/50`
- Rounded: `rounded-md`
- Padding: `p-3`

## Interaction States

### Hover
- Card: Increased shadow (`hover:shadow-lg`)
- Buttons: Background color change
- Transition: All transitions smooth

### Focus
- Buttons: Visible focus ring
- Keyboard accessible

### Active
- Buttons: Pressed state with visual feedback
