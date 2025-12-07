# S5-06: Tax Filing Reminders Implementation

## Overview
Successfully implemented automatic tax deadline reminders in the proactive suggestions system. The system now monitors upcoming tax deadlines and generates intelligent, urgency-based reminders with estimated VAT amounts.

## Files Modified

### 1. `apps/api/src/modules/chatbot/suggestions/proactive.scheduler.ts`
**Changes:**
- Added imports for `TaxCalendarService`, `VatService`, date formatting utilities
- Injected both services into constructor
- Modified `processOrganization()` to generate tax reminders alongside other suggestions
- Updated `storeSuggestions()` to accept and process tax reminder suggestions
- Added tax reminder storage logic with deduplication

**New Methods Added:**
- `generateTaxReminders(orgId)` - Main method to generate tax deadline reminders
  - Fetches upcoming deadlines within 14 days from TaxCalendarService
  - Skips completed deadlines
  - Determines priority based on urgency (critical, high, medium, low)
  - Estimates VAT amounts for VAT returns
  - Sends escalation notifications for urgent deadlines

- `getTaxMessages(deadline, daysUntil)` - German tax message generator
  - Comprehensive message templates for all tax types:
    - Monthly/Quarterly/Yearly VAT returns (USt-Voranmeldung)
    - Income tax prepayments (ESt-Vorauszahlung)
    - Annual tax returns (Einkommensteuererklärung)
  - Messages adapted to urgency level (urgent/soon/week/early)
  - Proper German date formatting (dd.MM.yyyy)

- `estimateVatAmount(orgId, deadline)` - VAT estimation calculator
  - Calculates output VAT from invoices in the period
  - Calculates input VAT from expenses in the period
  - Returns net VAT owed (output - input)

- `sendTaxNotifications(orgId, notification)` - Notification dispatcher
  - Sends notifications to organization admins (OWNER/ADMIN roles)
  - Supports both push and email notification types
  - High and medium priority notifications

- `mapTaxPriorityToDb(priority)` - Priority mapper
  - Maps tax-specific priorities to database enum values

## Priority & Urgency Logic

| Days Until Due | Priority | Action Type | Action Label |
|----------------|----------|-------------|--------------|
| 0-1 days | Critical | OPEN_TAX_WIZARD | "Jetzt einreichen" |
| 2-3 days | High | OPEN_TAX_WIZARD | "Vorbereiten" |
| 4-7 days | Medium | VIEW_TAX_PREVIEW | "Vorschau anzeigen" |
| 8-14 days | Low | DISMISS | "OK" |

## Notification Escalation

| Days Until Due | Notification Type | Priority |
|----------------|-------------------|----------|
| 0-1 days | Push Notification | High |
| 2-3 days | Email | Medium |
| 4+ days | None (suggestion only) | - |

### 2. `apps/api/src/modules/chatbot/suggestions/suggestion.types.ts`
**Changes:**
- Added `TaxSuggestion` interface extending `Suggestion`
- Includes tax-specific fields:
  - `estimatedAmount?: number` - Estimated VAT payment
  - `dueDate: Date` - Tax deadline date
  - `action` - Typed action with TAX_WIZARD, TAX_PREVIEW, or DISMISS

### 3. `apps/api/src/modules/chatbot/chatbot.module.ts`
**Changes:**
- Imported `TaxCalendarModule` and `VatModule`
- Added both modules to `imports` array
- Enables dependency injection of TaxCalendarService and VatService

## German Tax Message Templates

The system includes comprehensive German tax messages for:

### VAT Returns (Umsatzsteuer-Voranmeldung)
- **Monthly**: "USt-Voranmeldung für [Monat] ist HEUTE fällig!"
- **Quarterly**: "USt-Voranmeldung Q[1-4] [Jahr] ist in [X] Tagen fällig"
- **Yearly**: "Umsatzsteuerjahreserklärung [Jahr] nächste Woche"

### Income Tax Prepayments (Einkommensteuer-Vorauszahlung)
- "ESt-Vorauszahlung Q[1-4] ist HEUTE fällig!"
- "ESt-Vorauszahlung Q[1-4] fällig am [Datum]"

### Annual Tax Returns (Einkommensteuererklärung)
- "Einkommensteuererklärung [Jahr] ist in [X] Tagen fällig"
- "Einkommensteuererklärung [Jahr] fällig am [dd.MM.yyyy]"

All messages use proper German date formatting and include estimated amounts when available.

## Integration Points

### Tax Calendar Service
- `getUpcomingDeadlines(orgId, 14)` - Fetches deadlines within 14 days
- Automatically handles:
  - German tax deadlines (ELSTER)
  - Austrian tax deadlines (FinanzOnline)
  - UK tax deadlines (MTD VAT, Self Assessment)
  - Completion status from database

### VAT Service
- Integrated for future enhancements
- Can be used for more detailed VAT calculations

### Notifications Service
- `createNotification()` - Creates in-app notifications
- Supports priority levels (1-5)
- Stores notification metadata for tracking

## Daily Scheduler Integration

The tax reminders are generated as part of the daily proactive suggestions scan:
- **Schedule**: 8:00 AM Europe/Berlin timezone
- **Frequency**: Daily via `@Cron('0 8 * * *')`
- **Batch Size**: 10 organizations at a time
- **Deduplication**: Checks for existing suggestions within 24 hours

## Database Storage

Tax reminders are stored in the `Suggestion` table with:
- **Type**: `TAX_DEADLINE`
- **Priority**: `HIGH`, `MEDIUM`, or `LOW`
- **Status**: `PENDING`
- **ExpiresAt**: Set to the tax deadline date
- **Data**: Includes dueDate, estimatedAmount, deadlineType

## Amount Formatting

Estimated VAT amounts are formatted using German locale:
```typescript
new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
}).format(estimatedAmount)
```

Example: `1.234,56 €`

## API Endpoints

The existing suggestions API already supports tax reminders:
- `GET /suggestions/deadlines` - Returns all deadline reminders (including tax)
- `GET /suggestions` - Returns all suggestions (includes tax reminders)
- `POST /suggestions/:id/dismiss` - Dismiss a tax reminder
- `POST /suggestions/refresh` - Force refresh (invalidate cache)

## Testing

To test the implementation:

1. **Manual Trigger**: Call the manual trigger endpoint
```bash
POST /suggestions/trigger-manual
```

2. **Check Tax Calendar**: Ensure organization has upcoming tax deadlines
```bash
GET /tax/calendar/upcoming?days=14
```

3. **Verify Suggestions**: Check that tax reminders appear
```bash
GET /suggestions/deadlines
```

4. **Test Notifications**: Verify admins receive notifications for urgent deadlines

## Future Enhancements

1. **User Preferences**: Allow users to set custom reminder thresholds
2. **Multi-language**: Support for English, French, etc.
3. **Smart Estimates**: Use ML to improve VAT estimates based on historical patterns
4. **Calendar Integration**: Sync tax deadlines to Google Calendar / Outlook
5. **Submission Tracking**: Update suggestions when tax returns are filed

## Dependencies

- `date-fns` - Date formatting and manipulation
- `@prisma/client` - Database access
- Tax Calendar Service - Tax deadline generation
- VAT Service - VAT calculations
- Notifications Service - Alert delivery

## Performance Considerations

- Tax reminders cached for 1 hour (via ProactiveSuggestionsService)
- VAT estimation queries optimized with proper indexes
- Batch processing prevents system overload
- Deduplication prevents duplicate suggestions

## Compliance Notes

- All German tax terms use official abbreviations (USt, ESt, GewSt)
- Date formats comply with German standards (dd.MM.yyyy)
- Deadline dates based on official German tax calendar
- Supports Austrian and UK tax systems as well

## Implementation Status

✅ **Completed**
- Tax reminder generation
- German message templates
- VAT amount estimation
- Notification escalation
- Database integration
- Module dependencies
- Daily scheduler integration

## Code Quality

- Comprehensive error handling
- Detailed logging for debugging
- TypeScript type safety
- Follows existing code patterns
- Properly documented with JSDoc comments
