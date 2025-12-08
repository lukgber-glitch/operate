# Email→Bill Automation

**Automatic bill creation from incoming invoice emails**

## Overview

This module enables fully automatic bill creation from emails containing invoices. Users connect their email accounts (Gmail/Outlook), and the system automatically:

1. 📧 Monitors inbox for invoice emails
2. 🔍 Extracts invoice data using AI (GPT-4 Vision)
3. 🏢 Creates vendors automatically if they don't exist
4. 📝 Creates draft bills for user review
5. ✅ Auto-approves high-confidence bills (optional)

**Result**: Users no longer manually enter bills from emails - saving 10-15 minutes per invoice.

## Quick Start

### 1. Connect Email Account

Users connect Gmail or Outlook via OAuth (already implemented in app).

### 2. Enable Automation

```typescript
// Process all recent invoice emails
POST /organisations/{orgId}/email-automation/process-all?limit=50

// Or process specific email
POST /organisations/{orgId}/email-automation/process-email
{
  "emailId": "email-uuid",
  "autoApprove": false,
  "minConfidence": 0.7
}
```

### 3. Review Draft Bills

```typescript
// Get pending bills
GET /organisations/{orgId}/email-automation/pending-bills

// Approve a bill
POST /organisations/{orgId}/email-automation/bills/{billId}/approve

// Or reject
POST /organisations/{orgId}/email-automation/bills/{billId}/reject
{
  "reason": "Duplicate invoice"
}
```

## How It Works

```
Email Received
    ↓
Email Synced (automatic, every 15 mins)
    ↓
Invoice Detected (AI classification)
    ↓
Attachment Downloaded & Stored
    ↓
Data Extracted (GPT-4 Vision)
    ↓
Vendor Auto-Created (if needed)
    ↓
Draft Bill Created
    ↓
User Notified
    ↓
User Approves → Bill Finalized
```

## Confidence Scores

The system uses AI confidence scores to determine automation level:

| Confidence | Action |
|-----------|--------|
| **95%+** | Auto-approved (if enabled) |
| **70-94%** | Draft bill created for review |
| **Below 70%** | Skipped, user notified |

## Architecture

### Services

- **EmailBillAutomationService** - Main orchestration
- **EmailToBillProcessor** - Background queue processor
- **BillCreatorService** - Creates bills from extracted data
- **VendorAutoCreatorService** - Auto-creates vendors
- **InvoiceExtractorService** - GPT-4 Vision extraction

### Data Flow

```typescript
SyncedEmail
    → EmailAttachment (classified as INVOICE)
        → ExtractedInvoice (GPT-4 data)
            → Vendor (auto-created)
                → Bill (DRAFT)
                    → Bill (APPROVED)
```

## API Reference

### Process Email

```typescript
POST /organisations/:orgId/email-automation/process-email

Request:
{
  "emailId": "uuid",
  "autoApprove": false,    // Optional: auto-approve high-confidence
  "minConfidence": 0.7     // Optional: minimum confidence (default 0.7)
}

Response:
{
  "data": {
    "emailId": "uuid",
    "attachmentsProcessed": 1,
    "billsCreated": 1,
    "billsDuplicate": 0,
    "billsSkipped": 0,
    "vendorsCreated": 1,
    "errors": [],
    "bills": [
      {
        "billId": "uuid",
        "vendorName": "Acme Corp",
        "amount": 1500.00,
        "confidence": 0.92,
        "status": "DRAFT"
      }
    ]
  }
}
```

### Batch Process

```typescript
POST /organisations/:orgId/email-automation/process-all?since=2025-01-01&limit=100

Response:
{
  "data": {
    "processed": 45,
    "totalBillsCreated": 38,
    "totalVendorsCreated": 5,
    "errors": 2
  }
}
```

### Get Statistics

```typescript
GET /organisations/:orgId/email-automation/stats?days=30

Response:
{
  "data": {
    "period": "Last 30 days",
    "emailsProcessed": 45,
    "billsCreated": 38,
    "vendorsAutoCreated": 5,
    "billsAwaitingReview": 3,
    "automationRate": "84.4%"
  }
}
```

## Configuration

### Environment Variables

Uses existing configuration:
- `OPENAI_API_KEY` - For GPT-4 Vision
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`
- `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`
- `REDIS_HOST`, `REDIS_PORT`

### Confidence Thresholds

Configurable per request or set defaults:

```typescript
const DEFAULT_MIN_CONFIDENCE = 0.7;
const AUTO_APPROVE_THRESHOLD = 0.95;
```

## Example Use Cases

### Scenario 1: Standard Invoice Processing

**Email Received**: Invoice from "ABC Supplies" for €1,234.56

**System Actions**:
1. ✅ Email synced automatically
2. ✅ Invoice PDF detected and downloaded
3. ✅ Data extracted (confidence: 92%)
4. ✅ Vendor "ABC Supplies" already exists → matched
5. ✅ Draft bill created (status: DRAFT)
6. 📬 User notified: "New bill awaiting review"
7. ✅ User approves via UI
8. ✅ Bill finalized

**Time Saved**: ~12 minutes vs manual entry

### Scenario 2: New Vendor

**Email Received**: First invoice from "New Vendor Ltd"

**System Actions**:
1. ✅ Email synced
2. ✅ Invoice extracted (confidence: 88%)
3. 🆕 Vendor "New Vendor Ltd" auto-created
4. ✅ Draft bill created
5. 📬 User notified: "New vendor + bill created"
6. ✅ User reviews and approves

**Time Saved**: ~15 minutes (vendor creation + bill entry)

### Scenario 3: High Confidence Auto-Approval

**Email Received**: Monthly invoice from known vendor

**System Actions**:
1. ✅ Email synced
2. ✅ Invoice extracted (confidence: 97%)
3. ✅ Vendor matched (existing)
4. ✅ Bill auto-approved (confidence above threshold)
5. 📬 User notified: "Bill auto-approved"

**Time Saved**: ~15 minutes (zero user interaction)

## Error Handling

### Graceful Failures

The system handles errors without breaking:

| Error | System Response |
|-------|----------------|
| Low confidence extraction | Skip bill creation, notify user |
| Vendor creation fails | Skip bill, report error |
| Duplicate invoice | Skip, link to existing bill |
| Extraction timeout | Retry 3x, then fail gracefully |

### Error Response

```typescript
{
  "data": {
    "emailId": "uuid",
    "attachmentsProcessed": 2,
    "billsCreated": 1,
    "billsSkipped": 1,
    "errors": [
      "Low confidence (62%) for invoice_2.pdf",
      "Vendor 'Unknown' could not be created: missing required data"
    ]
  }
}
```

## Performance

### Processing Times

| Operation | Time |
|-----------|------|
| Email sync | ~2s per email |
| Attachment download | ~1-3s |
| Invoice extraction (1 page) | ~10-20s |
| Invoice extraction (multi-page) | ~30-60s |
| Vendor creation | ~500ms |
| Bill creation | ~1-2s |

**Total**: ~15-65 seconds per invoice (all background)

### Scalability

- Processes up to 100 emails in parallel
- Rate limits respect provider constraints
- Queue-based for reliability
- Redis-backed for high throughput

## Monitoring

### Key Metrics

Track these metrics in production:

1. **Automation Rate**: % emails → bills created
2. **Processing Time**: Email received → bill created
3. **Confidence Distribution**: High vs low confidence
4. **Error Rate**: Failed extractions
5. **Approval Rate**: Draft → approved

### Logs

All operations are logged:

```typescript
✓ Bill created: bill-123 for Acme Corp - €1,500.00 EUR
✗ Failed to process email email-456: Low confidence
⚠ Duplicate bill found for invoice INV-789
```

## Roadmap

### Phase 1: Current (✅ Complete)
- Basic email→bill automation
- Vendor auto-creation
- Confidence-based processing
- Draft bill workflow

### Phase 2: Planned
- Smart learning from corrections
- Invoice→PO matching
- Bank transaction matching
- Anomaly detection

### Phase 3: Future
- Multi-currency support
- Custom extraction rules per vendor
- Scheduled batch processing
- Advanced approval workflows

## Files

| File | Purpose |
|------|---------|
| `email-bill-automation.service.ts` | Main service |
| `email-bill-automation.controller.ts` | API endpoints |
| `email-to-bill.processor.ts` | Background processor |
| `EMAIL_BILL_AUTOMATION_INTEGRATION.md` | Integration guide |
| `README_EMAIL_BILL_AUTOMATION.md` | This file |

## Support

- 📖 Full Documentation: `audits/fixes/p1-h001-email-bill-automation.md`
- 🔧 Integration Guide: `EMAIL_BILL_AUTOMATION_INTEGRATION.md`
- 💬 Questions: Contact BRIDGE agent

---

**Status**: ✅ Ready for Production
**Last Updated**: 2025-12-08
**Version**: 1.0.0
