# Tax Deadline Service - Quick Reference

## API Endpoints

### Get Tax Reminders
```http
GET /api/v1/tax/calendar/reminders
Authorization: Bearer {token}
```

Returns reminders at key intervals: 30, 14, 7, 3, 1 days before deadlines.

### Get Deadline Statistics
```http
GET /api/v1/tax/calendar/stats
Authorization: Bearer {token}
```

Returns summary: total, upcoming, urgent, nextDeadline.

### Get Upcoming Deadlines
```http
GET /api/v1/tax/calendar/upcoming?days=30
Authorization: Bearer {token}
```

Returns all deadlines within next N days (existing endpoint).

## Service Methods

```typescript
import { TaxDeadlineService } from './modules/tax/deadlines';

// Get upcoming deadlines
const deadlines = await taxDeadlineService.getUpcomingDeadlines(orgId, 30);

// Generate reminders (only at specific intervals)
const reminders = await taxDeadlineService.generateReminders(orgId);

// Get summary statistics
const summary = await taxDeadlineService.getDeadlineSummary(orgId);

// Get deadlines by country
const germanDeadlines = taxDeadlineService.getDeadlinesByCountry('DE');
```

## Supported Countries

| Code | Country | VAT Due | Annual Tax |
|------|---------|---------|------------|
| DE | Germany | 10th of month | July 31 |
| AT | Austria | 15th of month | June 30 |
| UK/GB | United Kingdom | 37 days after quarter | Jan 31 |
| US | United States | Quarterly (Apr, Jun, Sep, Jan) | Apr 15 |

## Priority Levels

- **HIGH** (🔴): ≤3 days - Immediate action required
- **MEDIUM** (🟡): 4-7 days - Action needed soon
- **LOW** (ℹ️): 8-30 days - Plan ahead

## Configuration

### Organization Setup
```typescript
// Set country
organisation.country = 'DE'; // Required

// Set VAT registration
organisation.vatNumber = 'DE123456789'; // Optional

// Set filing frequency
organisation.settings = {
  taxFilingFrequency: 'monthly', // or 'quarterly', 'yearly'
};
```

## Integration Pattern

```typescript
// Daily job at 7:00 AM
@Cron('0 7 * * *')
async generateDailyReminders() {
  const orgs = await prisma.organisation.findMany();

  for (const org of orgs) {
    const reminders = await taxDeadlineService.generateReminders(org.id);

    for (const reminder of reminders) {
      await notificationService.send({
        type: 'TAX_REMINDER',
        priority: reminder.priority,
        title: reminder.title,
        message: reminder.description,
        actionUrl: reminder.actionUrl,
      });
    }
  }
}
```

## Response Examples

### Reminders Response
```json
[
  {
    "type": "TAX_DEADLINE",
    "priority": "HIGH",
    "title": "USt-Voranmeldung due in 3 days",
    "description": "Monthly VAT advance return due by the 10th",
    "dueDate": "2025-01-10T00:00:00Z",
    "actionUrl": "/tax/vat-return",
    "daysRemaining": 3
  }
]
```

### Summary Response
```json
{
  "total": 5,
  "upcoming": 3,
  "urgent": 2,
  "nextDeadline": {
    "type": "VAT_ADVANCE",
    "name": "USt-Voranmeldung",
    "dueDate": "2025-01-10T00:00:00Z",
    "daysRemaining": 7
  }
}
```

## Files

```
apps/api/src/modules/tax/deadlines/
├── tax-deadline.service.ts      # Core service
├── types.ts                      # Type definitions
├── dto/tax-reminder.dto.ts      # API DTOs
├── __tests__/*.spec.ts          # Tests
├── README.md                     # Full documentation
├── INTEGRATION_EXAMPLE.md        # Integration examples
└── IMPLEMENTATION_SUMMARY.md     # Implementation details
```

## Testing

```bash
# Run tests
npm test -- tax-deadline.service.spec

# Test manually
curl -H "Authorization: Bearer TOKEN" \
  https://operate.guru/api/v1/tax/calendar/reminders
```

## Common Issues

**No deadlines returned?**
- Check `organisation.country` is set
- Verify within 30-day window

**VAT deadlines not showing?**
- Ensure `organisation.vatNumber` is set

**Wrong filing frequency?**
- Set `organisation.settings.taxFilingFrequency`

## Related

- [Full Documentation](./README.md)
- [Integration Examples](./INTEGRATION_EXAMPLE.md)
- [Tax Calendar Service](../calendar/README.md)
