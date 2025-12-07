# TransactionInsight Component - Visual Guide

## Component Layout

```
┌─────────────────────────────────────────────────────────────┐
│ TransactionInsight Card                        │ Red Border │ <- Debit
├─────────────────────────────────────────────────────────────┤
│ HEADER                                                       │
│ ┌──────┐ ┌──────────────────────────┐ ┌──────────────────┐│
│ │ [↓]  │ │ -€234.50                 │ │ [UNMATCHED]      ││
│ │ Red  │ │ Amazon Web Services      │ │ Yellow Badge     ││
│ │ Icon │ │ [🏢] AWS EMEA SARL       │ │                  ││
│ └──────┘ └──────────────────────────┘ └──────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ CONTENT                                                      │
│                                                              │
│ Transaction Details:                                         │
│ ┌───────────────────┐ ┌─────────────────────────────────┐  │
│ │ [📅] Jan 15, 2024 │ │ [🏷️] Cloud Services          │  │
│ └───────────────────┘ └─────────────────────────────────┘  │
│                                                              │
│ Tax Category:                                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Tax Category                  [Operating Expenses]    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ AI Classification Confidence:                                │
│ AI Classification Confidence              High (92%)        │
│ ████████████████████████░░░░░░  92%       [Green]           │
│                                                              │
│ Quick Actions:                                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Categorize   │ │ Match        │ │ Ignore       │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## State Variations

### 1. Unmatched Debit Transaction (Expense)

```
┌─────────────────────────────────────────────────────┐
│ RED BORDER                                          │
│ ┌──────┐                                            │
│ │  ↓   │ -€234.50                   [UNMATCHED]    │
│ │ RED  │ Amazon Web Services        Yellow         │
│ └──────┘ AWS EMEA SARL                              │
│                                                      │
│ [📅] Jan 15, 2024    [🏷️] Cloud Services         │
│ Tax Category: Operating Expenses                    │
│ Confidence: ████████████ 92% (High/Green)          │
│ [Categorize] [Match] [Ignore]                      │
└─────────────────────────────────────────────────────┘
```

### 2. Unmatched Credit Transaction (Income)

```
┌─────────────────────────────────────────────────────┐
│ GREEN BORDER                                         │
│ ┌──────┐                                             │
│ │  ↑   │ +$1,500.00                 [UNMATCHED]     │
│ │GREEN │ Client Payment             Yellow          │
│ └──────┘ Acme Corp                                   │
│                                                       │
│ [📅] Jan 16, 2024    [🏷️] Client Payments        │
│ Tax Category: Revenue                                │
│ Confidence: ██████████░░ 88% (High/Green)           │
│ [Match]                                              │
└──────────────────────────────────────────────────────┘
```

### 3. Matched Transaction (Reconciled)

```
┌─────────────────────────────────────────────────────┐
│ RED BORDER                                          │
│ ┌──────┐                                            │
│ │  ↓   │ -€450.00                   [MATCHED]      │
│ │ RED  │ Office Supplies            Green          │
│ └──────┘ Staples Inc.                               │
│                                                      │
│ [📅] Jan 14, 2024    [🏷️] Office Expenses        │
│ Tax Category: Deductible Expenses                   │
│ Confidence: █████████████ 95% (High/Green)         │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ✓ This transaction has been matched and     │    │
│ │   reconciled                                 │    │
│ │ [Green background]                           │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 4. Ignored Transaction

```
┌─────────────────────────────────────────────────────┐
│ RED BORDER                                          │
│ ┌──────┐                                            │
│ │  ↓   │ -€5.00                     [IGNORED]      │
│ │ RED  │ Bank Fee                   Gray           │
│ └──────┘                                            │
│                                                      │
│ [📅] Jan 01, 2024    [🏷️] Bank Fees              │
│ Confidence: ██████████████ 99% (High/Green)        │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ ⊗ This transaction has been marked as       │    │
│ │   ignored                                    │    │
│ │ [Gray background]                            │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 5. Low Confidence Transaction

```
┌─────────────────────────────────────────────────────┐
│ RED BORDER                                          │
│ ┌──────┐                                            │
│ │  ↓   │ -£89.99                    [UNMATCHED]    │
│ │ RED  │ POS Purchase               Yellow         │
│ └──────┘                                            │
│                                                      │
│ [📅] Jan 17, 2024    [🏷️] Miscellaneous          │
│ Confidence: ████░░░░░░░░░ 45% (Low/Red)            │
│ [Categorize]                                        │
└─────────────────────────────────────────────────────┘
```

## Color Scheme

### Border Colors (Left 4px Border)

- **Debit**: `border-l-red-500`
- **Credit**: `border-l-green-500`

### Amount Colors

- **Debit**: Red text (`text-red-600 dark:text-red-400`)
- **Credit**: Green text (`text-green-600 dark:text-green-400`)

### Status Badge Colors

| Status    | Background | Text Color | Icon        |
|-----------|------------|------------|-------------|
| UNMATCHED | Yellow-100 | Yellow-700 | TrendingUp  |
| MATCHED   | Green-100  | Green-700  | CheckCircle |
| IGNORED   | Gray-100   | Gray-700   | XCircle     |

### Confidence Levels

| Level      | Range    | Progress Color | Text Color  |
|------------|----------|----------------|-------------|
| High       | ≥80%     | Green (500)    | Green       |
| Medium     | 60-79%   | Yellow (500)   | Yellow      |
| Low        | <60%     | Red (500)      | Red         |

## Icon Usage

### Transaction Type Icons (Header)
- **Debit (Expense)**: `ArrowDownCircle` - Red background
- **Credit (Income)**: `ArrowUpCircle` - Green background

### Detail Icons (Content)
- **Date**: `Calendar`
- **Category**: `Tag`
- **Merchant**: `Building2`

### Status Icons (Badges)
- **Matched**: `CheckCircle`
- **Unmatched**: `TrendingUp`
- **Ignored**: `XCircle`

### Action Icons (Buttons)
- **Categorize**: `Tag`
- **Match**: `CheckCircle`
- **Ignore**: `XCircle`

## Typography

```
Amount:       text-lg font-bold
Description:  text-sm font-medium
Merchant:     text-xs text-muted-foreground
Date/Category: text-xs/text-sm
Confidence:   text-xs
Badge text:   text-xs font-semibold
```

## Spacing & Layout

```
Card Padding: p-6 (CardHeader) / p-6 pt-0 (CardContent)
Icon Background: p-2 rounded-lg
Badge Padding: px-2.5 py-0.5
Button Size: sm (h-9 px-4)
Progress Height: h-2
Border: border-l-4
Gaps: gap-2, gap-3
```

## Responsive Behavior

### Desktop (≥1024px)
```
Full layout with all details visible
Grid: 2 columns for date/category
All action buttons in a row
```

### Tablet (768px - 1023px)
```
Grid adapts to available space
Action buttons may wrap
Text truncation for long descriptions
```

### Mobile (< 768px)
```
Single column layout
Vertical stacking
Action buttons stack vertically
Amount prominently displayed
```

## Dark Mode

All colors automatically adapt using Tailwind's dark mode:

- `dark:bg-red-950` instead of `bg-red-100`
- `dark:text-red-400` instead of `text-red-600`
- `dark:border-red-700` instead of `border-red-300`

## Component Hierarchy

```
Card (border-l-4 with transaction type color)
└─ CardHeader (pb-3)
   └─ Flex Container (items-start justify-between)
      ├─ Flex Container (gap-3)
      │  ├─ Icon Container (p-2 rounded-lg)
      │  │  └─ AmountIcon (h-5 w-5)
      │  └─ Content Container
      │     ├─ CardTitle (amount)
      │     ├─ Description (text-sm)
      │     └─ Merchant (text-xs with Building2 icon)
      └─ Status Badge
└─ CardContent (space-y-4)
   ├─ Details Grid (2 columns)
   │  ├─ Date (with Calendar icon)
   │  └─ Category (with Tag icon)
   ├─ Tax Category Section (if present)
   ├─ Confidence Section (if present)
   │  ├─ Label Row
   │  └─ Progress Bar
   ├─ Quick Actions (if unmatched)
   │  ├─ Categorize Button
   │  ├─ Match Button
   │  └─ Ignore Button
   └─ Status Message (if matched/ignored)
```

## Best Practices

1. **Always provide currency code** for proper formatting
2. **Use absolute amounts** (component handles sign display)
3. **Provide optional fields** when available for richer display
4. **Include action handlers** only for unmatched transactions
5. **Test with various amounts** (small, large, decimal)
6. **Test with long text** to verify truncation
7. **Verify dark mode** appearance
8. **Test all status states** in your implementation

## Example Usage in Context

```tsx
// In a chat message flow
<div className="space-y-2">
  <div className="bg-muted p-3 rounded-lg">
    <p>I found 3 unmatched transactions from last week.</p>
  </div>

  <TransactionInsight transaction={transaction1} {...handlers} />
  <TransactionInsight transaction={transaction2} {...handlers} />
  <TransactionInsight transaction={transaction3} {...handlers} />
</div>
```

## Accessibility Notes

- Icons are paired with text labels
- Color coding is supplemented with icons
- Buttons have clear text labels
- Status is conveyed through multiple visual cues
- Keyboard accessible via standard button navigation
- Screen readers can navigate the card structure

---

**Component File**: `apps/web/src/components/chat/TransactionInsight.tsx`
**Lines of Code**: 310
**Created**: 2024-12-07
**Agent**: PRISM (Frontend Specialist)
