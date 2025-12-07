# Tax Calendar - Quick Reference

## Installation
Already integrated in `/modules/tax/tax.module.ts` - No setup required!

## Import

```typescript
import { TaxCalendarService } from '@/modules/tax/calendar';
```

## Usage

### Get all deadlines
```typescript
const deadlines = await taxCalendarService.getDeadlines(orgId);
const deadlines2024 = await taxCalendarService.getDeadlines(orgId, 2024);
```

### Get upcoming deadlines
```typescript
const next30Days = await taxCalendarService.getUpcomingDeadlines(orgId, 30);
const nextWeek = await taxCalendarService.getUpcomingDeadlines(orgId, 7);
```

### Get overdue deadlines
```typescript
const overdue = await taxCalendarService.getOverdueDeadlines(orgId);
```

### Filter deadlines
```typescript
const vatDeadlines = await taxCalendarService.getDeadlinesByFilters(orgId, {
  type: 'vat_return',
  status: 'upcoming',
});
```

## API Endpoints

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `GET /tax/calendar` | All deadlines | `?year=2024` |
| `GET /tax/calendar/upcoming` | Next N days | `?days=30` |
| `GET /tax/calendar/overdue` | Overdue items | - |
| `GET /tax/calendar/filter` | Multi-filter | `?type=vat_return&status=upcoming` |
| `GET /tax/calendar/summary` | Statistics | - |

## Types

```typescript
type TaxDeadlineType = 'vat_return' | 'income_tax' | 'prepayment' | 'annual_return' | 'custom';
type TaxDeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed';
type TaxFilingFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one_time';
```

## Response Structure

```typescript
interface TaxDeadline {
  id: string;                    // "vat-2024-Q1"
  type: TaxDeadlineType;
  title: string;                 // "USt-Voranmeldung Q1 2024"
  description: string;
  dueDate: Date;
  periodStart?: Date;
  periodEnd?: Date;
  country: string;               // "DE", "AT", "GB"
  filingType: TaxFilingFrequency;
  status: TaxDeadlineStatus;
  reminderDays: number[];        // [14, 7, 3, 1]
  actionUrl?: string;            // "/tax/elster"
}
```

## Countries

| Code | Country | Deadlines/Year |
|------|---------|----------------|
| DE | Germany | 18+ (USt, ESt, GewSt) |
| AT | Austria | 14+ (UVA, ESt) |
| GB | UK | 8+ (VAT, Self Assessment) |
| * | Generic | 5+ (Basic VAT + Annual) |

## Status Logic

- **upcoming**: > 7 days until due
- **due_soon**: ≤ 7 days until due
- **overdue**: Past due date
- **completed**: ELSTER filing exists with status='submitted'

## Integration Examples

### Proactive Suggestions
```typescript
const upcoming = await taxCalendar.getUpcomingDeadlines(orgId, 7);
if (upcoming.length > 0) {
  return `You have ${upcoming.length} tax deadline(s) this week`;
}
```

### Chat Integration
```typescript
if (message.includes('tax deadline')) {
  const next = (await taxCalendar.getUpcomingDeadlines(orgId, 30))[0];
  return `Next deadline: ${next.title} on ${next.dueDate}`;
}
```

### Dashboard Widget
```typescript
const summary = await fetch('/tax/calendar/summary');
// Display: summary.dueSoon, summary.overdue, summary.nextDeadline
```

## Testing

```bash
npm test tax-calendar.service.spec.ts
```

## Documentation

See `/apps/api/src/modules/tax/calendar/README.md` for full documentation.
