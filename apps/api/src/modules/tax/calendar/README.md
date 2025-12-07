# Tax Calendar Module

Automatic tax deadline calendar generation based on organization country and tax obligations.

## Features

- **Automatic Calendar Generation**: Creates tax deadlines based on country-specific regulations
- **Multi-Country Support**: Germany (DE), Austria (AT), UK (GB), and generic fallback
- **Flexible Filing Frequencies**: Monthly, quarterly, or yearly VAT returns
- **Smart Status Tracking**: Automatically marks deadlines as upcoming, due soon, overdue, or completed
- **ELSTER Integration**: Syncs with ELSTER filings to mark deadlines as completed
- **Reminder System**: Configurable reminder days before each deadline

## Supported Countries

### Germany (DE)
- **USt-Voranmeldung** (VAT advance returns): Monthly or quarterly, due 10th of following month/quarter
- **Umsatzsteuerjahreserklärung** (Annual VAT return): Due July 31 of following year
- **ESt-Vorauszahlung** (Income tax prepayments): Quarterly (Mar 10, Jun 10, Sep 10, Dec 10)
- **Einkommensteuererklärung** (Annual income tax return): Due July 31 of following year
- **GewSt-Vorauszahlung** (Trade tax prepayments): Quarterly

### Austria (AT)
- **UVA** (VAT advance returns): Monthly or quarterly, due 15th of following month/quarter
- **Umsatzsteuerjahreserklärung** (Annual VAT return): Due June 30 of following year
- **ESt-Vorauszahlung** (Income tax prepayments): Quarterly (Feb 15, May 15, Aug 15, Nov 15)
- **Einkommensteuererklärung** (Annual income tax return): Due June 30 of following year

### United Kingdom (GB)
- **VAT Returns**: Quarterly, due 1 month + 7 days after quarter end
- **Self Assessment**: Annual, due January 31 of following year (for online filing)

### Generic (Other Countries)
- Quarterly VAT returns: Due 15th of month after quarter
- Annual tax return: Due April 30 of following year

## API Endpoints

### Get All Deadlines
```http
GET /tax/calendar?year=2024
```

Returns all tax deadlines for the organization's current year (or specified year).

**Response:**
```json
[
  {
    "id": "vat-2024-Q1",
    "type": "vat_return",
    "title": "USt-Voranmeldung Q1 2024",
    "description": "Quarterly VAT return for Q1 2024",
    "dueDate": "2024-04-10T00:00:00.000Z",
    "periodStart": "2024-01-01T00:00:00.000Z",
    "periodEnd": "2024-03-31T00:00:00.000Z",
    "country": "DE",
    "filingType": "quarterly",
    "status": "completed",
    "reminderDays": [14, 7, 3, 1],
    "actionUrl": "/tax/elster"
  }
]
```

### Get Upcoming Deadlines
```http
GET /tax/calendar/upcoming?days=30
```

Returns deadlines within the next N days (default: 30).

### Get Overdue Deadlines
```http
GET /tax/calendar/overdue
```

Returns all overdue, incomplete deadlines.

### Get Filtered Deadlines
```http
GET /tax/calendar/filter?type=vat_return&status=upcoming&year=2024
```

**Query Parameters:**
- `year`: Filter by year (e.g., 2024)
- `type`: Filter by deadline type (`vat_return`, `income_tax`, `prepayment`, `annual_return`, `custom`)
- `status`: Filter by status (`upcoming`, `due_soon`, `overdue`, `completed`)
- `country`: Filter by country code (e.g., `DE`, `AT`, `GB`)

### Get Summary
```http
GET /tax/calendar/summary
```

Returns a summary of deadlines by status.

**Response:**
```json
{
  "total": 24,
  "upcoming": 18,
  "dueSoon": 2,
  "overdue": 1,
  "completed": 3,
  "nextDeadline": {
    "id": "vat-2024-Q4",
    "title": "USt-Voranmeldung Q4 2024",
    "dueDate": "2025-01-10T00:00:00.000Z",
    "type": "vat_return"
  }
}
```

## Deadline Types

| Type | Description | Example |
|------|-------------|---------|
| `vat_return` | VAT/sales tax returns | USt-Voranmeldung, UVA |
| `income_tax` | Income tax filings | Einkommensteuererklärung |
| `prepayment` | Tax prepayments | ESt-Vorauszahlung, GewSt-Vorauszahlung |
| `annual_return` | Annual tax returns | Jahreserklärung |
| `custom` | Custom deadlines | Organization-specific |

## Deadline Statuses

| Status | Description | Condition |
|--------|-------------|-----------|
| `upcoming` | More than 7 days away | Due date > 7 days in future |
| `due_soon` | Within 7 days | Due date ≤ 7 days in future |
| `overdue` | Past due date | Due date in past |
| `completed` | Filing submitted | Linked ELSTER/filing record exists |

## Integration with ELSTER

The calendar automatically marks deadlines as completed when:

1. An ELSTER filing exists in the database
2. The filing status is `submitted`
3. The filing matches the deadline's tax type and period

Example mapping:
- ELSTER filing: `taxType='USt'`, `taxYear=2024`, `taxPeriod='Q1'`
- Deadline marked complete: `vat-2024-Q1`

## Usage in Code

### Service Injection
```typescript
import { TaxCalendarService } from '@/modules/tax/calendar';

@Injectable()
export class MyService {
  constructor(private taxCalendar: TaxCalendarService) {}

  async checkDeadlines(orgId: string) {
    const upcoming = await this.taxCalendar.getUpcomingDeadlines(orgId, 7);
    // Process upcoming deadlines
  }
}
```

### Types
```typescript
import { TaxDeadline, TaxDeadlineStatus } from '@/modules/tax/calendar/types';

const deadline: TaxDeadline = {
  id: 'custom-1',
  type: 'custom',
  title: 'Custom deadline',
  description: 'Custom tax deadline',
  dueDate: new Date(),
  country: 'DE',
  filingType: 'one_time',
  status: 'upcoming',
  reminderDays: [7, 3, 1],
};
```

## Reminder System

Each deadline includes `reminderDays` array indicating when to send reminders:

- **VAT Returns**: [14, 7, 3, 1] - Remind 14, 7, 3, and 1 day(s) before
- **Prepayments**: [14, 7, 3, 1] - Remind 14, 7, 3, and 1 day(s) before
- **Annual Returns**: [90, 60, 30, 14, 7] - Remind 90, 60, 30, 14, and 7 days before

This can be used by a background job to send proactive reminders.

## Future Enhancements

- [ ] Add support for more countries (US, FR, ES, IT)
- [ ] Support for custom deadlines created by users
- [ ] Estimated tax amounts based on historical data
- [ ] Integration with accounting software for auto-completion
- [ ] Email/SMS reminder notifications
- [ ] Calendar export (iCal, Google Calendar)
- [ ] Fiscal year support for non-calendar year organizations
- [ ] Tax advisor deadlines (extended filing dates)

## Testing

Run tests:
```bash
npm test tax-calendar.service.spec.ts
```

The test suite covers:
- ✅ German deadline generation
- ✅ Austrian deadline generation
- ✅ UK deadline generation
- ✅ Monthly vs quarterly VAT filing
- ✅ ELSTER completion tracking
- ✅ Upcoming deadline filtering
- ✅ Overdue deadline detection
- ✅ Multi-criteria filtering

## Database Schema

The module uses:
- `Organisation` table: `country`, `vatNumber`, `settings.taxFilingFrequency`
- `ElsterFiling` table: `taxType`, `taxYear`, `taxPeriod`, `status`

No additional tables required - deadlines are generated on-the-fly based on rules.
