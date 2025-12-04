# FinanzOnline UVA Service

Austrian VAT Advance Return (Umsatzsteuervoranmeldung) Integration

## Overview

The UVA service handles the submission of Austrian VAT advance returns to FinanzOnline. This includes:

- **Preparation**: Calculate UVA from invoices and expenses
- **Submission**: Submit UVA declarations to FinanzOnline via SOAP
- **Status Tracking**: Monitor submission status
- **History**: Retrieve past submissions
- **Validation**: Comprehensive data validation

## Austrian VAT Rates

| Rate | Description | Code |
|------|-------------|------|
| 20% | Standard rate (Normalsteuersatz) | STANDARD |
| 13% | Reduced rate (ermäßigter Steuersatz) | REDUCED_13 |
| 10% | Reduced rate (ermäßigter Steuersatz) | REDUCED_10 |
| 0% | Tax-free (steuerfrei) | ZERO |

## UVA Kennzahlen (Form Fields)

Key Austrian VAT form fields:

### Sales (Lieferungen)
- **KZ 000**: Total tax base
- **KZ 001**: Tax-free with input tax deduction
- **KZ 011**: Tax-free without input tax deduction
- **KZ 020**: Exports
- **KZ 021**: Intra-community deliveries
- **KZ 022**: Sales at 20% (tax base)
- **KZ 029**: VAT at 20%
- **KZ 006**: Sales at 13% (tax base)
- **KZ 037**: VAT at 13%
- **KZ 007**: Sales at 10% (tax base)
- **KZ 008**: VAT at 10%

### Intra-Community Acquisitions
- **KZ 070**: IC acquisitions at 20% (tax base)
- **KZ 071**: VAT on IC acquisitions at 20%
- **KZ 072**: IC acquisitions at 13% (tax base)
- **KZ 073**: VAT on IC acquisitions at 13%

### Reverse Charge
- **KZ 048**: Reverse charge base
- **KZ 088**: Reverse charge VAT

### Input VAT (Vorsteuer)
- **KZ 060**: Total input VAT
- **KZ 083**: Input VAT from IC acquisitions
- **KZ 065**: Input VAT from reverse charge
- **KZ 066**: Input VAT from imports

### Payment
- **KZ 095**: Advance payment due (positive)
- **KZ 096**: Credit/refund (negative)

## Period Types

Austrian businesses must file UVA based on annual turnover:

- **Monthly**: Required for turnover > €100,000
- **Quarterly**: Allowed for turnover ≤ €100,000
- **Annual**: Special cases only

## Usage Examples

### 1. Prepare UVA

```typescript
import { FinanzOnlineUVAService } from './finanzonline-uva.service';

const uvaService = // ... injected

const uvaData = await uvaService.prepareUVA({
  organizationId: 'org_123',
  taxYear: 2024,
  taxPeriod: 'Q1',
  periodType: UVAPeriodType.QUARTERLY,
  includeDrafts: false,
  applyCorrections: true,
  autoCalculate: true,
});

console.log('Total VAT:', uvaData.totalVAT);
console.log('Kennzahlen:', uvaData.kennzahlen);
```

### 2. Submit UVA

```typescript
const result = await uvaService.submitUVA({
  organizationId: 'org_123',
  taxYear: 2024,
  taxPeriod: 'Q1',
  periodType: UVAPeriodType.QUARTERLY,
  teilnehmerId: '123456789',
  taxNumber: '12-345/6789',
  vatId: 'ATU12345678',
  kennzahlen: {
    kz022: 100000,  // Sales at 20%
    kz029: 20000,   // VAT at 20%
    kz060_vorsteuer: 15000, // Input VAT
    kz095: 5000,    // Payment due
  },
  totalVAT: 5000,
  testSubmission: false,
}, 'user_123');

console.log('Submission ID:', result.submissionId);
console.log('Status:', result.status);
```

### 3. Check Status

```typescript
const status = await uvaService.getUVAStatus({
  identifier: 'sub_123',
  organizationId: 'org_123',
});

console.log('Status:', status.status);
console.log('Transfer Ticket:', status.transferTicket);
console.log('Receipt Number:', status.receiptNumber);
```

### 4. Get History

```typescript
const history = await uvaService.getUVAHistory({
  organizationId: 'org_123',
  taxYear: 2024,
  limit: 10,
  offset: 0,
});

history.forEach(entry => {
  console.log(`${entry.taxPeriod}: ${entry.totalVAT} EUR - ${entry.status}`);
});
```

## Validation

The service performs comprehensive validation:

### Field Validation
- VAT amounts match tax bases (20%, 13%, 10%)
- No negative values (except corrections)
- Required fields present
- Format validation (tax number, VAT ID)

### Business Logic Validation
- Total VAT calculation matches
- Period type matches organization requirements
- Turnover thresholds respected

### Period Validation
- Monthly filing required for high-turnover businesses
- Quarterly allowed for low-turnover businesses
- Period format validation (Q1-Q4 or 01-12)

## Async Processing

UVA submissions are processed asynchronously using BullMQ:

1. **Queue**: `finanzonline-uva`
2. **Processor**: `UVASubmissionProcessor`
3. **Retry**: 3 attempts with exponential backoff
4. **Status**: Track via submission ID

## Error Handling

The service handles various error scenarios:

- **Invalid credentials**: No active FinanzOnline session
- **Validation errors**: Business logic or field validation failures
- **SOAP errors**: FinanzOnline service unavailable
- **Network errors**: Connection timeouts, retries

## Integration Points

### Required Services
- `FinanzOnlineSessionService`: Session management
- `PrismaService`: Database operations
- `BullMQ`: Async job processing

### External Dependencies
- Invoice data (for calculation)
- Expense data (for calculation)
- Organization data (tax numbers, turnover)

## Database Schema

The service expects the following tables (to be implemented):

```sql
-- UVA submissions
CREATE TABLE uva_submissions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  tax_period TEXT NOT NULL,
  period_type TEXT NOT NULL,
  kennzahlen JSONB NOT NULL,
  total_vat DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL,
  transfer_ticket TEXT,
  receipt_number TEXT,
  submitted_at TIMESTAMP,
  submitted_by TEXT,
  response JSONB,
  errors JSONB,
  warnings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uva_org_year ON uva_submissions(organization_id, tax_year);
CREATE INDEX idx_uva_status ON uva_submissions(status);
CREATE INDEX idx_uva_transfer_ticket ON uva_submissions(transfer_ticket);
```

## Testing

Test submission mode is available:

```typescript
const result = await uvaService.submitUVA({
  // ... other fields
  testSubmission: true, // Use test environment
}, userId);
```

## References

- [BMF FinanzOnline Documentation](https://www.bmf.gv.at/egovernment/fon/fon.html)
- [Austrian VAT Rates](https://www.bmf.gv.at/themen/steuern/umsatzsteuer.html)
- [UVA Form U30](https://www.bmf.gv.at/formulare/umsatzsteuer.html)

## TODO

- [ ] Implement actual invoice/expense data fetching
- [ ] Implement database schema and operations
- [ ] Implement UVA XML builder (BMF U30 schema)
- [ ] Implement SOAP submission endpoint
- [ ] Add comprehensive unit tests
- [ ] Add integration tests with FinanzOnline test environment
- [ ] Implement error recovery mechanisms
- [ ] Add audit logging
- [ ] Implement notification system for submission status
