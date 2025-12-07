# SuggestionCard Entity Navigation Flow

## Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Suggestion Received                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │ Has actionUrl?             │
         └────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
       YES                 NO
        │                   │
        ▼                   ▼
┌──────────────────┐  ┌──────────────────────┐
│ Parse actionUrl  │  │ Scan title +         │
│ for entity       │  │ description for      │
│ type & ID        │  │ entity patterns      │
└─────┬────────────┘  └──────┬───────────────┘
      │                      │
      │         ┌────────────┴─────────────┐
      │         │                          │
      │       MATCH                    NO MATCH
      │         │                          │
      ▼         ▼                          ▼
┌────────────────────────┐         ┌──────────────┐
│ Entity Reference       │         │ No entity    │
│ - type: invoice/etc    │         │ - type: null │
│ - id: "123"            │         │ - id: null   │
│ - url: "/invoices/123" │         │ - url: null  │
└─────────┬──────────────┘         └──────┬───────┘
          │                               │
          └───────────┬───────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Render Card   │
              └───────────────┘
```

## Rendering Flow

```
┌────────────────────────────────────────────────────────┐
│                   SuggestionCard                       │
└─────────────────────┬──────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
      COMPACT                      FULL
        │                           │
        ▼                           ▼
┌─────────────────┐        ┌─────────────────┐
│ Compact Card    │        │ Full Card       │
│ ┌─────────────┐ │        │ ┌─────────────┐ │
│ │ Icon + Badge│ │        │ │ Icon + Title│ │
│ │ Title       │ │        │ │ + Badge     │ │
│ │ Description │ │        │ │ Entity Type │ │
│ │ Chevron →   │ │        │ │ Description │ │
│ └─────────────┘ │        │ │ Show More   │ │
│                 │        │ │ Actions     │ │
│ (280px fixed)   │        │ └─────────────┘ │
└─────────────────┘        └─────────────────┘
```

## Click Interaction Flow

```
┌─────────────────────────────────────────────────┐
│              User Click Event                   │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┴──────────────────┐
    │                                │
    │ Where did user click?          │
    │                                │
┌───┴────────┐  ┌──────────┐  ┌─────┴──────┐
│ Dismiss    │  │ Action   │  │ Card       │
│ Button     │  │ Button   │  │ Background │
└───┬────────┘  └──────┬───┘  └─────┬──────┘
    │                  │            │
    │                  │            │
    ▼                  ▼            ▼
┌──────────┐    ┌────────────┐   ┌──────────────┐
│ Stop     │    │ Stop       │   │ Is entity    │
│ Propagate│    │ Propagate  │   │ url set?     │
└────┬─────┘    └─────┬──────┘   └──────┬───────┘
     │                │                 │
     ▼                ▼           ┌─────┴─────┐
┌──────────┐    ┌────────────┐  YES         NO
│ Call     │    │ Has onApply│   │           │
│ onDismiss│    │ handler?   │   ▼           ▼
└──────────┘    └─────┬──────┘  ┌────────┐  ┌────┐
                      │         │Navigate│  │None│
                ┌─────┴────┐    └────────┘  └────┘
               YES        NO
                │          │
                ▼          ▼
          ┌──────────┐  ┌─────────┐
          │ Execute  │  │Navigate │
          │ onApply  │  │ to URL  │
          └──────────┘  └─────────┘
```

## Navigation Decision Tree

```
┌────────────────────────────────────┐
│     Entity URL to Navigate         │
└─────────────┬──────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ URL starts with     │
    │ http:// or https:// │
    └─────────┬───────────┘
              │
    ┌─────────┴─────────┐
   YES                 NO
    │                   │
    ▼                   ▼
┌───────────────┐  ┌──────────────────┐
│ External URL  │  │ Internal Route   │
└───────┬───────┘  └─────────┬────────┘
        │                    │
        ▼                    ▼
┌───────────────┐  ┌──────────────────┐
│ window.open(  │  │ router.push(url) │
│   url,        │  │                  │
│   '_blank',   │  │ Next.js Client   │
│   'noopener,  │  │ Side Navigation  │
│   noreferrer' │  │                  │
│ )             │  │ No page reload   │
└───────────────┘  └──────────────────┘
```

## Visual State Indicators

```
┌─────────────────────────────────────────────────────────┐
│                   Card Visual States                    │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
   HAS ENTITY                  NO ENTITY
        │                           │
        ▼                           ▼
┌─────────────────┐          ┌─────────────────┐
│ INTERACTIVE     │          │ STATIC          │
│                 │          │                 │
│ ✓ cursor:pointer│          │ ✗ cursor:default│
│ ✓ hover:shadow  │          │ ✗ no hover      │
│ ✓ border 4→6px  │          │ ✗ border 4px    │
│ ✓ chevron icon  │          │ ✗ no chevron    │
│ ✓ entity badge  │          │ ✗ no badge      │
│ ✓ clickable     │          │ ✗ not clickable │
└─────────────────┘          └─────────────────┘
```

## Entity URL Patterns

```
┌────────────────────────────────────────────────────────────┐
│                    Entity Type → URL                       │
└────────────────────────────────────────────────────────────┘

Invoice         : /invoices/{invoiceId}
                  Example: /invoices/INV-001

Customer        : /customers/{entityId}
                  Example: /customers/cust-abc-123
                  Note: Requires suggestion.entityId

Expense         : /expenses/{expenseId}
                  Example: /expenses/EXP-789

Bill            : /bills/{billId}
                  Example: /bills/BILL-456

Employee        : /hr/employees/{entityId}
                  Example: /hr/employees/emp-xyz-789
                  Note: Requires suggestion.entityId

External        : https://example.com/...
                  Opens in new tab
```

## Component Props Flow

```
┌──────────────────────────────────────────────────────┐
│            SuggestionCard Props                      │
└─────────────────────┬────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │suggestion│  │ onApply? │  │onDismiss?│
  │          │  │          │  │          │
  │ Required │  │ Optional │  │ Optional │
  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │             │             │
       ▼             ▼             ▼
  ┌──────────────────────────────────────┐
  │   Extract Entity Reference           │
  │   - type                             │
  │   - id                               │
  │   - url                              │
  └─────────┬────────────────────────────┘
            │
            ▼
  ┌──────────────────────────────────────┐
  │   Configure Handlers                 │
  │   - handleCardClick                  │
  │   - handleApply                      │
  │   - handleDismiss                    │
  └─────────┬────────────────────────────┘
            │
            ▼
  ┌──────────────────────────────────────┐
  │   Render with Conditional Styles     │
  │   - isClickable determines cursor    │
  │   - entityRef determines navigation  │
  └──────────────────────────────────────┘
```

## Event Propagation Control

```
┌──────────────────────────────────────────────────────┐
│               Click Event Hierarchy                  │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │     Card (Parent)     │
          │   onClick: navigate   │
          └───────┬───────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    │             │             │              │
    ▼             ▼             ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Dismiss │  │ Action   │  │Show More │  │ Content  │
│Button  │  │ Button   │  │ Button   │  │  Area    │
└───┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
    │            │             │             │
    │            │             │             │
    ▼            ▼             ▼             ▼
stopProp    stopProp     stopProp       propagate
    │            │             │             │
    ▼            ▼             ▼             ▼
onDismiss    onApply      setExpanded    handleCard
                                           Click
```

## State Management

```
┌──────────────────────────────────────────────────────┐
│              Component State                         │
└─────────────────────┬────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │isExpanded│  │entityRef │  │isClickable│
  │          │  │          │  │           │
  │ boolean  │  │{type,id, │  │ boolean   │
  │ useState │  │ url}     │  │ computed  │
  └──────────┘  └──────────┘  └──────────┘
                      │
                      ▼
              Used for rendering:
              - Navigation onClick
              - Hover styles
              - Visual indicators
              - Entity type badge
```
