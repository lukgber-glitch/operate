# Tax Deadline Service

Comprehensive tax deadline tracking and reminder generation system supporting multiple countries.

## Features

- **Multi-country support**: DE, AT, UK/GB, US
- **Smart deadline calculation**: Handles monthly, quarterly, and annual tax obligations
- **Proactive reminders**: Generates alerts at 30, 14, 7, 3, and 1 day intervals
- **Priority-based notifications**: HIGH/MEDIUM/LOW based on urgency
- **Configurable filing frequency**: Monthly, quarterly, or annual
- **VAT registration awareness**: Only shows VAT deadlines if organization is VAT registered

## Supported Countries & Deadlines

### Germany (DE)
- **USt-Voranmeldung (VAT Advance)**: Monthly (10th) or Quarterly (10th after quarter)
- **Umsatzsteuerjahreserklärung (Annual VAT)**: July 31
- **Jahreserklärung (Annual Tax Return)**: July 31

### Austria (AT)
- **UVA (VAT Advance)**: Monthly (15th) or Quarterly (15th after quarter)
- **Umsatzsteuerjahreserklärung (Annual VAT)**: June 30
- **Einkommensteuererklärung (Annual Income Tax)**: June 30

### United Kingdom (UK/GB)
- **VAT Return**: Quarterly, due 37 days after quarter end (1 month + 7 days)
- **Self Assessment**: Annual, due January 31

### United States (US)
- **Quarterly Estimated Tax**: April 15, June 15, September 15, January 15
- **Annual Tax Return**: April 15

## API Endpoints

### Get Upcoming Deadlines
```http
GET /api/v1/tax/calendar/upcoming?days=30
```

Returns all deadlines within the next N days using the existing TaxCalendarService.

### Get Tax Reminders
```http
GET /api/v1/tax/calendar/reminders
```

Returns active reminders (only for deadlines at 30, 14, 7, 3, or 1 day intervals).

**Response Example:**
```json
[
  {
    "type": "TAX_DEADLINE",
    "priority": "HIGH",
    "title": "USt-Voranmeldung due in 3 days",
    "description": "Monthly VAT advance return due by the 10th of following month",
    "dueDate": "2025-01-10T00:00:00Z",
    "actionUrl": "/tax/vat-return",
    "daysRemaining": 3
  }
]
```

### Get Deadline Statistics
```http
GET /api/v1/tax/calendar/stats
```

Returns summary statistics about tax deadlines.

**Response Example:**
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

## Usage

### In a Background Job

```typescript
import { TaxDeadlineService } from './modules/tax/deadlines';

// In DailyInsightJob or similar
async generateDailyInsights(orgId: string) {
  const reminders = await this.taxDeadlineService.generateReminders(orgId);

  // Send reminders via email, push notification, or in-app notification
  for (const reminder of reminders) {
    await this.notificationService.send({
      organizationId: orgId,
      type: 'tax_deadline',
      priority: reminder.priority,
      title: reminder.title,
      message: reminder.description,
      actionUrl: reminder.actionUrl,
    });
  }
}
```

### In a Dashboard Widget

```typescript
import { TaxDeadlineService } from './modules/tax/deadlines';

// Get summary for dashboard
async getDashboardData(orgId: string) {
  const summary = await this.taxDeadlineService.getDeadlineSummary(orgId);

  return {
    taxDeadlines: {
      total: summary.total,
      urgent: summary.urgent,
      nextDeadline: summary.nextDeadline,
    }
  };
}
```

## Reminder Priority Levels

- **HIGH** (≤3 days): Critical - immediate action needed
- **MEDIUM** (4-7 days): Important - action needed soon
- **LOW** (8-30 days): Informational - plan ahead

## Configuration

Deadlines are automatically configured based on:

1. **Organization country**: Determined from `organisation.country` field
2. **VAT registration**: Checked via `organisation.vatNumber`
3. **Filing frequency**: Read from `organisation.settings.taxFilingFrequency`

### Setting Filing Frequency

```typescript
// Update organization settings
await prisma.organisation.update({
  where: { id: orgId },
  data: {
    settings: {
      ...existingSettings,
      taxFilingFrequency: 'monthly', // or 'quarterly', 'yearly'
    }
  }
});
```

## Integration with Existing Systems

This service integrates with:

- **TaxCalendarService**: Uses existing calendar for detailed deadline information
- **TaxDeadlineReminder** (DB): Can be integrated with the database-based deadline system
- **Notification System**: Provides structured data for multi-channel notifications
- **Daily Jobs**: Designed to be called from scheduled background jobs

## Testing

Run tests:
```bash
npm test -- tax-deadline.service.spec.ts
```

## Future Enhancements

- [ ] Support for more countries (FR, ES, IT, CA, AU)
- [ ] Custom deadline creation via API
- [ ] Deadline completion tracking
- [ ] Historical deadline analytics
- [ ] Email/SMS reminder scheduling
- [ ] Integration with calendar systems (iCal, Google Calendar)
- [ ] Tax authority holiday awareness
- [ ] Extension deadline tracking

## Related Files

- `tax-deadline.service.ts` - Main service implementation
- `types.ts` - TypeScript type definitions
- `dto/` - API request/response DTOs
- `tax-deadline.service.spec.ts` - Unit tests
- `../calendar/tax-calendar.service.ts` - Complementary calendar service
