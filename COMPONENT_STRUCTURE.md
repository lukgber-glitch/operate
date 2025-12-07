# Email Intelligence Dashboard - Component Structure

## Page Hierarchy

```
/intelligence (Main Intelligence Overview)
└── /intelligence/email (Email Intelligence Dashboard)
    ├── <SuggestionsPanel />
    │   ├── Tabs (All, Urgent, High)
    │   └── SuggestionItem[] (individual suggestions)
    │       ├── Priority badge
    │       ├── Action buttons (Complete, Dismiss)
    │       └── Entity info
    │
    ├── <EmailActivityFeed />
    │   └── EmailActivityItem[] (recent email activity)
    │       ├── Category icon
    │       ├── Subject & sender
    │       ├── Action taken badge
    │       └── Amount (if applicable)
    │
    ├── <RelationshipHealthCard />
    │   ├── Health status bars (Excellent, Good, Needs Attention, At Risk, Dormant)
    │   └── At-risk relationship list
    │       ├── Name & type
    │       ├── Days since contact
    │       └── Health score badge
    │
    └── <AutoCreatedEntities />
        ├── Date range filter (Week, Month, All)
        ├── Summary stats (Customers, Vendors)
        └── Entity list
            ├── Entity icon & name
            ├── Creation date
            └── Link to view/edit
```

## Component Props

### EmailActivityFeed
```typescript
{
  limit?: number; // Default: 20
}
```

### RelationshipHealthCard
```typescript
{} // No props, auto-fetches data
```

### SuggestionsPanel
```typescript
{} // No props, manages own state
```

### AutoCreatedEntities
```typescript
{
  limit?: number; // Default: 10
}
```

## Data Flow

```
Backend Services
    ↓
Prisma Database
    ↓
EmailIntelligenceController (REST API)
    ↓
intelligenceApi (TypeScript client)
    ↓
React Query (caching & state)
    ↓
React Components
```

## API Endpoints Used

| Component               | Endpoint                                             | Method |
|------------------------|------------------------------------------------------|--------|
| EmailActivityFeed      | `/organisations/:orgId/intelligence/email/activity` | GET    |
| RelationshipHealthCard | `/organisations/:orgId/intelligence/email/relationships/summary` | GET |
| RelationshipHealthCard | `/organisations/:orgId/intelligence/email/relationships/at-risk` | GET |
| SuggestionsPanel       | `/organisations/:orgId/intelligence/email/suggestions` | GET |
| SuggestionsPanel       | `/organisations/:orgId/intelligence/email/suggestions/:id/dismiss` | PATCH |
| SuggestionsPanel       | `/organisations/:orgId/intelligence/email/suggestions/:id/complete` | PATCH |
| AutoCreatedEntities    | `/organisations/:orgId/intelligence/email/auto-created` | GET |

## State Management

- **React Query** for server state (queries, mutations, caching)
- **useState** for local UI state (filters, tabs)
- **QueryClient** for cache invalidation after mutations

## Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for pre-built accessible components
- **Dark mode** support via next-themes
- **Responsive** design with mobile-first approach

## Icons

| Component               | Icon Library | Icons Used |
|------------------------|--------------|------------|
| All                    | lucide-react | Mail, FileText, Users, Building2, etc. |
| EmailActivityFeed      | lucide-react | Mail, FileText, CreditCard, DollarSign |
| RelationshipHealthCard | lucide-react | Heart, AlertCircle |
| SuggestionsPanel       | lucide-react | Lightbulb, CheckCircle2, X |
| AutoCreatedEntities    | lucide-react | Users, Building2, ExternalLink |
