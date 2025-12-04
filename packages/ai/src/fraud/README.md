# Fraud Prevention System

Conservative fraud detection for tax deduction claims. Designed to protect users from accidental fraud while maintaining usability.

## Philosophy

**Better to flag for review than miss fraud.** The system uses conservative thresholds and prefers false positives over false negatives to protect users during tax audits.

## Components

### Core Detectors

#### 1. Duplicate Detector
Identifies exact and near-duplicate transactions to prevent double-claiming.

**Checks:**
- Exact matches (amount, date, description, counterparty)
- Near matches (similar amounts within 5%, dates within 7 days)
- Levenshtein distance for text similarity

**Scoring:**
- 0.95+ = Critical (almost certain duplicate)
- 0.75-0.94 = High (probable duplicate)
- 0.60-0.74 = Warning (possible duplicate)

#### 2. Threshold Monitor
Monitors spending against category-specific legal limits.

**Limits Tracked:**
- Daily limits
- Monthly limits
- Annual limits
- Per-transaction limits

**German Examples:**
- Home Office: €1,260/year (legal limit)
- Business Meals: €250/transaction, €5,000/year
- Work Equipment: €800/transaction (GWG limit)

#### 3. Pattern Analyzer
Detects suspicious behavioral patterns.

**Patterns Detected:**
- Round amount clustering (>50% round amounts)
- Year-end spending spikes (>15% in last 14 days)
- End-of-month clustering (>30% in last 5 days)
- Weekend transaction concentration (>40%)
- Merchant concentration (>80% single merchant)

#### 4. Anomaly Detector
Statistical analysis for unusual transactions.

**Methods:**
- Z-score analysis (2 standard deviations)
- Amount anomalies by category
- Frequency anomalies
- Category usage anomalies

#### 5. Velocity Checker
Monitors transaction rate changes.

**Metrics:**
- Transactions per day
- Acceleration rate (current vs. historical)
- Burst detection (>5 transactions/hour)
- Momentum calculation

## Fraud Rules

Rules are evaluated for every transaction. Matching rules generate alerts with appropriate severity.

### Alert Severities

1. **CRITICAL** - Auto-block, requires approval
   - Duplicate score ≥95%
   - Threshold exceeded

2. **HIGH** - Block until reviewed
   - Duplicate score ≥75%
   - Year-end spike + acceleration >2x
   - High anomaly score (>0.8)

3. **WARNING** - Allow but flag for review
   - Duplicate score ≥60%
   - Threshold approaching
   - Pattern anomalies

4. **INFO** - Informational only
   - Weekend transactions
   - Category usage notes

## Thresholds

### Germany (DE)

| Category | Per Transaction | Daily | Monthly | Annual | Warning % |
|----------|----------------|-------|---------|--------|-----------|
| Business Meals | €250 | - | - | €5,000 | 80% |
| Home Office | - | - | - | €1,260 | 100% |
| Work Equipment | €800 | - | - | - | 90% |
| Vehicle Business | - | - | €2,000 | €24,000 | 85% |
| Travel Accommodation | €300 | - | €2,000 | - | 80% |

### Austria (AT)

Similar structure with country-specific limits.

### Unknown Countries

Conservative defaults applied automatically.

## Conservative Configuration

```typescript
{
  duplicateScoreThreshold: 0.6,        // Lower = more sensitive
  anomalyStdDeviationThreshold: 2,     // 2 sigma = flag
  velocityIncreaseThreshold: 1.5,      // 50% increase = flag
  autoBlockDuplicateScore: 0.95,       // Very high confidence
  autoBlockSeverity: 'critical',
  requireReviewAbove: 100000,          // €1,000
  requireReviewForCategories: [
    'VEHICLE_BUSINESS',
    'TRAVEL_BUSINESS'
  ],
  logAllChecks: true,
  retainAlertsForYears: 10             // Tax compliance
}
```

## Usage

### Basic Check

```typescript
import { FraudDetector } from '@operate/ai';

const detector = new FraudDetector();

const result = await detector.checkTransaction(
  transaction,
  historicalTransactions,
  'DE'
);

if (result.blockedBySystem) {
  // Transaction blocked - requires review
  console.log('Blocked:', result.alerts);
}
```

### Batch Check

```typescript
const results = await detector.checkBatch(
  transactions,
  history,
  'DE'
);

const blocked = results.filter(r => r.blockedBySystem);
```

### Custom Configuration

```typescript
const detector = new FraudDetector({
  duplicateScoreThreshold: 0.5,  // More sensitive
  requireReviewAbove: 50000,     // €500
});
```

## API Endpoints

### Check Transaction
```http
POST /api/v1/tax/fraud/check
Content-Type: application/json

{
  "transactionId": "txn-123",
  "countryCode": "DE"
}
```

### Get Alerts
```http
GET /api/v1/tax/fraud/alerts?status=pending&severity=high
```

### Review Alert
```http
POST /api/v1/tax/fraud/alerts/:id/review
Content-Type: application/json

{
  "decision": "dismiss",
  "note": "False positive - legitimate expense"
}
```

### Get Statistics
```http
GET /api/v1/tax/fraud/statistics?startDate=2025-01-01&endDate=2025-01-31
```

## Audit Trail

Every fraud check is logged with:
- All checks performed
- Alert details and evidence
- User decisions and review notes
- Immutable audit log (append-only)
- 10-year retention (tax compliance)

### Audit Log Structure

```typescript
{
  orgId: string,
  userId: string,
  action: 'fraud_check' | 'review_alert',
  transactionId?: string,
  alertId?: string,
  metadata: {
    checksPerformed: string[],
    alertCount: number,
    recommendedAction: string,
    blockedBySystem: boolean,
    countryCode: string
  },
  createdAt: Date
}
```

## Evidence Collection

Each alert includes detailed evidence:

```typescript
{
  type: 'same_amount' | 'same_date' | 'pattern' | 'anomaly',
  value: '€100.00',
  explanation: 'Transaction has identical amount to previous transaction'
}
```

## Recommended Actions

1. **BLOCK** - Transaction blocked, requires approval
2. **REVIEW** - Allow but requires review
3. **WARN** - Show warning to user
4. **ALLOW** - No action needed

## Best Practices

### For Developers

1. **Always log checks** - Enable `logAllChecks: true`
2. **Store all alerts** - Even dismissed ones (audit trail)
3. **Retain for 10 years** - Tax compliance requirement
4. **Conservative thresholds** - Better false positives than false negatives
5. **Batch processing** - Use `checkBatch()` for multiple transactions

### For Users

1. **Review alerts promptly** - Don't ignore warnings
2. **Document decisions** - Add notes when dismissing alerts
3. **Spread expenses** - Avoid year-end/month-end clustering
4. **Vary amounts** - Avoid too many round amounts
5. **Keep receipts** - Always maintain documentation

## Testing

Run tests:
```bash
cd packages/ai
npm test
```

Example test:
```typescript
describe('Duplicate Detection', () => {
  it('should detect exact duplicates', async () => {
    const transaction = {
      id: 'txn-1',
      amount: 10000,
      date: new Date('2025-01-15'),
      description: 'Coffee',
    };

    const duplicate = { ...transaction, id: 'txn-2' };

    const result = await detector.checkTransaction(
      transaction,
      [duplicate],
      'DE'
    );

    expect(result.duplicateCheck.isDuplicate).toBe(true);
    expect(result.duplicateCheck.duplicateScore).toBeGreaterThan(0.9);
  });
});
```

## Performance

- Single check: ~10-50ms
- Batch (100 transactions): ~1-5 seconds
- Pattern analysis: O(n log n)
- Duplicate detection: O(n) per transaction

## Security

- All checks logged to audit trail
- Immutable audit log (append-only)
- RBAC enforced on API endpoints
- No PII in fraud detection (only transaction metadata)
- Evidence stored securely in database

## Compliance

- **GoBD** - Complete audit trail
- **Tax retention** - 10-year alert retention
- **GDPR** - No unnecessary PII storage
- **Conservative** - Protects users from tax issues

## Troubleshooting

### High False Positive Rate

Adjust configuration:
```typescript
{
  duplicateScoreThreshold: 0.7,  // Less sensitive
  anomalyStdDeviationThreshold: 2.5,
  velocityIncreaseThreshold: 2.0
}
```

### Missing Duplicates

Lower threshold:
```typescript
{
  duplicateScoreThreshold: 0.5  // More sensitive
}
```

### Performance Issues

Use batch processing and limit history:
```typescript
const history = await getRecentHistory(orgId, categoryCode, 500);
```

## Future Enhancements

- Machine learning for pattern detection
- Cross-organizational pattern analysis
- Real-time fraud detection webhooks
- Automated test case generation
- Category-specific anomaly models
