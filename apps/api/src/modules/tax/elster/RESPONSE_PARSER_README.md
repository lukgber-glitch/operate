# ELSTER Response Parser

## Overview

The ELSTER Response Parser Service interprets responses from the tigerVAT API and converts them into structured, actionable information for the application and end users.

## Features

- **Parse tigerVAT Responses**: Convert raw API responses into structured format
- **Error Code Mapping**: Map ELSTER error codes to meaningful messages
- **Suggested Actions**: Provide corrective action recommendations
- **Display Formatting**: Generate user-friendly display messages
- **Retry Detection**: Determine if errors are retryable
- **Status Tracking**: Track processing status and finality

## Architecture

```
ElsterResponseParserService
├── Types (elster-response.types.ts)
│   ├── TigerVATResponse (raw)
│   ├── ParsedElsterResponse (structured)
│   └── DisplayResponse (UI-ready)
├── Constants (error-codes.ts)
│   ├── ERROR_CODE_MAP
│   ├── FIELD_LABELS
│   └── STATUS_MESSAGES
└── Service Methods
    ├── parseResponse()
    ├── formatForDisplay()
    └── getSuggestedFixes()
```

## Usage

### Basic Parsing

```typescript
import { ElsterResponseParserService } from './services/elster-response-parser.service';

// Inject service
constructor(private readonly parser: ElsterResponseParserService) {}

// Parse response
const tigerResponse = await this.tigerVATClient.submit(data);
const parsed = this.parser.parseResponse(tigerResponse);

if (parsed.success) {
  console.log('Transfer ticket:', parsed.transferTicket);
} else {
  console.log('Errors:', parsed.errors);
  console.log('Suggested actions:', parsed.suggestedActions);
}
```

### Display Formatting

```typescript
// Format for frontend display
const display = this.parser.formatForDisplay(parsed);

// Return to frontend
return {
  success: display.success,
  title: display.title,
  message: display.message,
  errors: display.errors,
  actions: display.actions,
};
```

### Configuration

```typescript
// Parse with custom configuration
const parsed = this.parser.parseResponse(response, {
  includeRawResponse: true,    // Include raw response for debugging
  translateMessages: true,      // Use localized messages
  includeHelpUrls: true,        // Include help documentation links
  detailedErrors: true,         // Include all error details
});
```

### Error Checking

```typescript
// Check if error is retryable
const isRetryable = this.parser.isRetryable(error);

// Check if response has specific error category
const hasCertError = this.parser.hasErrorCategory(
  response,
  ErrorCategory.CERTIFICATE
);

// Extract error codes
const codes = this.parser.extractErrorCodes(response);
```

## Response Types

### Successful Response

```typescript
{
  success: true,
  transferTicket: "TT-2024-123456",
  elsterReference: "ER-789012",
  summary: "Successfully submitted to ELSTER. Transfer ticket: TT-2024-123456",
  errors: [],
  warnings: [],
  displayMessages: [{
    type: "success",
    title: "Erfolgreich übermittelt",
    message: "Ihre Umsatzsteuervoranmeldung wurde erfolgreich an ELSTER übermittelt."
  }],
  suggestedActions: [],
  status: {
    code: "SUCCESS",
    message: "Successfully submitted to ELSTER",
    isRetryable: false,
    isFinal: true
  }
}
```

### Error Response

```typescript
{
  success: false,
  summary: "Submission failed with 1 error. Die Steuernummer hat ein ungültiges Format",
  errors: [{
    code: "ELSTER_VAL_001",
    field: "taxNumber",
    fieldLabel: "Steuernummer",
    message: "Invalid tax number format",
    localizedMessage: "Die Steuernummer hat ein ungültiges Format",
    isRetryable: false,
    category: "validation",
    helpUrl: "https://www.elster.de/eportal/hilfe/steuernummer"
  }],
  warnings: [],
  displayMessages: [{
    type: "error",
    title: "Steuernummer",
    message: "Die Steuernummer hat ein ungültiges Format",
    field: "taxNumber"
  }],
  suggestedActions: [{
    type: "fix_field",
    message: "Check that the tax number follows the format XXX/XXX/XXXXX",
    field: "taxNumber",
    priority: "high"
  }],
  status: {
    code: "VALIDATION_ERROR",
    message: "Data validation failed",
    isRetryable: false,
    isFinal: true
  }
}
```

## Error Codes

### Validation Errors

| Code | Field | Description | Retryable |
|------|-------|-------------|-----------|
| `ELSTER_VAL_001` | taxNumber | Invalid tax number format | No |
| `ELSTER_VAL_002` | vatId | Invalid VAT ID format | No |
| `ELSTER_VAL_010` | period | Invalid period | No |
| `ELSTER_VAL_011` | period | Period already submitted | No |
| `ELSTER_VAL_020` | domesticRevenue19 | Invalid amount | No |

### Certificate Errors

| Code | Field | Description | Retryable |
|------|-------|-------------|-----------|
| `ELSTER_CERT_001` | certificate | Certificate expired | No |
| `ELSTER_CERT_002` | certificate | Certificate invalid | No |
| `ELSTER_CERT_003` | certificate | Certificate doesn't match tax number | No |

### Technical Errors

| Code | Description | Retryable |
|------|-------------|-----------|
| `ELSTER_TECH_001` | ELSTER system unavailable | Yes |
| `ELSTER_TECH_002` | Connection timeout | Yes |
| `ELSTER_TECH_004` | ELSTER server error | Yes |

## Status Codes

| Status | Description | Is Final | Is Retryable |
|--------|-------------|----------|--------------|
| `SUCCESS` | Successfully submitted | Yes | No |
| `ACCEPTED` | Accepted by ELSTER | Yes | No |
| `PENDING` | Being processed | No | No |
| `REJECTED` | Rejected by ELSTER | Yes | No |
| `VALIDATION_ERROR` | Validation failed | Yes | No |
| `CERTIFICATE_ERROR` | Certificate error | Yes | No |
| `TECHNICAL_ERROR` | System error | No | Yes |
| `TIMEOUT` | Request timeout | No | Yes |

## Suggested Actions

### Action Types

- **`fix_field`**: Fix a specific field value
- **`retry`**: Retry the submission
- **`check_certificate`**: Verify certificate validity
- **`verify_tax_number`**: Verify tax number with office
- **`contact_support`**: Contact support for help
- **`review_data`**: Review all submitted data

### Example Actions

```typescript
// Certificate error
{
  type: "check_certificate",
  message: "Check and update your ELSTER certificate",
  priority: "high"
}

// Field validation error
{
  type: "fix_field",
  message: "Check that the tax number follows the format XXX/XXX/XXXXX",
  field: "taxNumber",
  priority: "high"
}

// Technical error
{
  type: "retry",
  message: "Try submitting again",
  priority: "medium"
}
```

## Integration with VAT Service

```typescript
import { ElsterVatService } from './elster-vat.service';
import { ElsterResponseParserService } from './elster-response-parser.service';

@Injectable()
export class ElsterVatService {
  constructor(
    private readonly parser: ElsterResponseParserService,
  ) {}

  async submitUStVA(data: UStVAData): Promise<ElsterSubmissionResult> {
    try {
      // Submit to tigerVAT
      const response = await this.tigerVATClient.submit(data);

      // Parse response
      const parsed = this.parser.parseResponse(response);

      // Store in database
      await this.prisma.elsterFiling.create({
        data: {
          status: parsed.status.code,
          transferTicket: parsed.transferTicket,
          errors: parsed.errors,
          warnings: parsed.warnings,
        },
      });

      // Return structured result
      return {
        success: parsed.success,
        submissionId: filing.id,
        transferTicket: parsed.transferTicket,
        errors: parsed.errors.map(e => e.localizedMessage),
        warnings: parsed.warnings.map(w => w.localizedMessage),
      };

    } catch (error) {
      this.logger.error('Submission failed', error);
      throw error;
    }
  }
}
```

## Frontend Integration

### Display Errors to User

```typescript
// In frontend component
const submitVAT = async (data: VATData) => {
  const result = await api.submitVAT(data);

  if (!result.success) {
    // Show errors
    result.errors.forEach(error => {
      toast.error(error.title, {
        description: error.message,
        action: error.action ? {
          label: error.action.message,
          onClick: () => handleAction(error.action)
        } : undefined
      });
    });
  } else {
    toast.success('Erfolgreich übermittelt', {
      description: `Transfer-Ticket: ${result.transferTicket}`
    });
  }
};
```

## Testing

Run tests:

```bash
npm test elster-response-parser.service.spec.ts
```

### Test Coverage

- ✅ Parse successful responses
- ✅ Parse validation errors
- ✅ Parse certificate errors
- ✅ Parse technical errors
- ✅ Handle multiple errors
- ✅ Generate suggested actions
- ✅ Format for display
- ✅ Check retry eligibility
- ✅ Map error codes to fields
- ✅ Extract error categories

## Adding New Error Codes

1. Add to `ERROR_CODE_MAP` in `constants/error-codes.ts`:

```typescript
ELSTER_VAL_030: {
  field: 'newField',
  fieldLabel: 'Neues Feld',
  message: 'English message',
  localizedMessage: 'Deutsche Nachricht',
  category: ErrorCategory.VALIDATION,
  isRetryable: false,
  helpUrl: 'https://...',
  suggestedFix: 'How to fix this',
}
```

2. Add field label to `FIELD_LABELS`:

```typescript
newField: 'Neues Feld',
```

3. Parser will automatically use the new mapping

## Best Practices

1. **Always parse responses**: Don't work with raw tigerVAT responses
2. **Show suggested actions**: Help users fix errors quickly
3. **Log raw responses**: Include raw response in logs for debugging
4. **Handle retries**: Check `isRetryable` before retrying
5. **Categorize errors**: Use error categories to group related errors
6. **Localize messages**: Use German messages for user display

## Troubleshooting

### Unknown Error Codes

If you encounter unknown error codes:
1. Check tigerVAT documentation
2. Add to `ERROR_CODE_MAP`
3. Default handler will still work

### Missing Field Labels

Add missing field labels to `FIELD_LABELS` constant.

### Status Not Detected

Check `mapStatusCode()` method - may need to add new status mappings.

## Future Enhancements

- [ ] Support for multiple languages beyond German
- [ ] More granular error categorization
- [ ] Context-aware suggested fixes
- [ ] Machine learning for error patterns
- [ ] Webhook response parsing
- [ ] Batch response parsing
