# Mindee Receipt OCR Integration

This module integrates Mindee's Receipt OCR API to extract structured data from receipt images and PDFs.

## Features

- **Synchronous Parsing**: Upload and parse receipts instantly (for files < 5MB)
- **Asynchronous Parsing**: Submit larger files for background processing with job polling
- **Mock Mode**: Automatic fallback to mock data when API key is not configured
- **Comprehensive Extraction**: Merchant info, dates, totals, line items, payment methods
- **Confidence Scores**: Per-field and overall confidence metrics
- **Error Handling**: Graceful error handling with partial results
- **Type Safety**: Full TypeScript support with DTOs

## Setup

### 1. Install Dependencies

The module uses `axios` and `form-data` which should already be installed. If not:

```bash
pnpm add axios form-data
pnpm add -D @types/multer
```

### 2. Get Mindee API Key

1. Sign up at [Mindee](https://platform.mindee.com/)
2. Create a new API key in your dashboard
3. Copy your API key

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Required
MINDEE_API_KEY=your_api_key_here

# Optional (defaults shown)
MINDEE_BASE_URL=https://api.mindee.net/v1
MINDEE_TIMEOUT=30000
```

### 4. Register Module

Add to `app.module.ts`:

```typescript
import { MindeeModule } from './modules/integrations/mindee/mindee.module';

@Module({
  imports: [
    // ... other modules
    MindeeModule,
  ],
})
export class AppModule {}
```

## API Endpoints

### Parse Receipt (Sync)

Upload and parse a receipt synchronously.

**Endpoint**: `POST /integrations/mindee/parse`

**Request**:
```bash
curl -X POST http://localhost:3000/integrations/mindee/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@receipt.jpg"
```

**Response**:
```json
{
  "success": true,
  "confidence": 0.92,
  "merchant": {
    "name": "Coffee Shop",
    "address": "123 Main St, Berlin",
    "phone": "+49 30 12345678",
    "confidence": 0.95
  },
  "date": {
    "value": "2024-12-02T00:00:00.000Z",
    "confidence": 0.98
  },
  "time": "14:30",
  "totals": {
    "amount": 15.50,
    "tax": 2.48,
    "tip": 2.00,
    "currency": "EUR",
    "confidence": 0.99
  },
  "lineItems": [
    {
      "description": "Cappuccino",
      "quantity": 2,
      "unitPrice": 4.50,
      "totalPrice": 9.00,
      "confidence": 0.95
    }
  ],
  "paymentMethod": "Card",
  "receiptNumber": "RCP-2024-001234"
}
```

### Parse Receipt (Async)

Submit a receipt for asynchronous processing.

**Endpoint**: `POST /integrations/mindee/parse/async`

**Request**:
```bash
curl -X POST http://localhost:3000/integrations/mindee/parse/async \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@large-receipt.pdf"
```

**Response**:
```json
{
  "jobId": "abc123xyz789",
  "status": "pending"
}
```

### Get Async Result

Retrieve the result of an async parsing job.

**Endpoint**: `GET /integrations/mindee/parse/async/:jobId`

**Request**:
```bash
curl http://localhost:3000/integrations/mindee/parse/async/abc123xyz789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**: Same as sync parse response

### Health Check

Check Mindee API connection status.

**Endpoint**: `GET /integrations/mindee/health`

**Request**:
```bash
curl http://localhost:3000/integrations/mindee/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "available": true,
  "responseTime": 234,
  "mockMode": false
}
```

## Usage in Code

### Basic Usage

```typescript
import { MindeeService } from './modules/integrations/mindee/mindee.service';

@Injectable()
export class ReceiptsService {
  constructor(private readonly mindeeService: MindeeService) {}

  async processReceipt(file: Buffer, mimeType: string) {
    // Parse receipt
    const result = await this.mindeeService.parseReceipt(file, mimeType);

    if (!result.success) {
      throw new Error(result.errorMessage);
    }

    // Use extracted data
    console.log('Merchant:', result.merchant.name);
    console.log('Total:', result.totals.amount, result.totals.currency);
    console.log('Date:', result.date.value);

    return result;
  }
}
```

### Async Processing

```typescript
async processLargeReceipt(file: Buffer, mimeType: string) {
  // Submit for async processing
  const jobId = await this.mindeeService.parseReceiptAsync(file, mimeType);

  // Store jobId for later retrieval
  await this.saveJobId(jobId);

  // Later, retrieve result
  const result = await this.mindeeService.getParseResult(jobId);
  return result;
}
```

### With Confidence Filtering

```typescript
async extractHighConfidenceData(file: Buffer, mimeType: string) {
  const result = await this.mindeeService.parseReceipt(file, mimeType);

  // Only use fields with high confidence
  const highConfidenceThreshold = 0.8;

  const merchant = result.merchant.confidence > highConfidenceThreshold
    ? result.merchant.name
    : null;

  const total = result.totals.confidence > highConfidenceThreshold
    ? result.totals.amount
    : null;

  return { merchant, total };
}
```

## Supported File Types

- **Images**: JPEG, PNG, WebP, TIFF, HEIC
- **Documents**: PDF
- **Max Size**: 10MB

## Mock Mode

When `MINDEE_API_KEY` is not configured, the service automatically runs in **mock mode**:

- Returns realistic mock data
- No API calls are made
- Logs warning on startup
- Perfect for development and testing

**Warning log**:
```
⚠️  MINDEE_API_KEY not configured - running in MOCK MODE
Set MINDEE_API_KEY environment variable to use real API
```

## Error Handling

The service handles errors gracefully and returns partial results when possible:

```typescript
{
  "success": false,
  "confidence": 0,
  "merchant": { "confidence": 0 },
  "date": { "confidence": 0 },
  "totals": { "confidence": 0 },
  "lineItems": [],
  "errorMessage": "Request timeout"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `File is empty` | No file data | Upload a valid file |
| `File size exceeds maximum` | File > 10MB | Use async endpoint or compress file |
| `Unsupported file type` | Invalid MIME type | Use supported format (JPEG, PNG, PDF) |
| `Invalid API key` | Wrong or expired key | Check MINDEE_API_KEY |
| `Rate limit exceeded` | Too many requests | Wait and retry |
| `Request timeout` | Slow network/large file | Use async endpoint |

## Configuration

All configuration is in `mindee.config.ts`:

```typescript
export const MINDEE_CONFIG = {
  apiKey: process.env.MINDEE_API_KEY,
  baseUrl: 'https://api.mindee.net/v1',
  receiptEndpoint: '/products/mindee/expense_receipts/v5/predict',
  timeout: 30000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  polling: {
    initialDelay: 2000,
    interval: 3000,
    maxAttempts: 20,
  },
  confidence: {
    minimum: 0.5,
    high: 0.8,
  },
};
```

## Testing

### Manual Testing

1. **Without API Key (Mock Mode)**:
```bash
# Don't set MINDEE_API_KEY
pnpm dev

# Test endpoint
curl -X POST http://localhost:3000/integrations/mindee/parse \
  -F "file=@test-receipt.jpg"
```

2. **With API Key (Real API)**:
```bash
# Set API key
export MINDEE_API_KEY=your_key_here
pnpm dev

# Test endpoint
curl -X POST http://localhost:3000/integrations/mindee/parse \
  -F "file=@test-receipt.jpg"
```

### Unit Tests

```typescript
describe('MindeeService', () => {
  it('should parse receipt in mock mode', async () => {
    const service = new MindeeService(configService);
    const result = await service.parseReceipt(buffer, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.merchant.name).toBeDefined();
  });
});
```

## API Documentation

Full API docs available at: https://developers.mindee.com/docs/receipt-ocr

## Troubleshooting

### Mock mode always active
- Check `MINDEE_API_KEY` is set in `.env`
- Restart the application
- Check logs for warning message

### Parse fails with timeout
- Use async endpoint for larger files
- Increase `MINDEE_TIMEOUT` in config
- Check network connection

### Low confidence scores
- Use higher quality images
- Ensure receipt is clearly visible
- Avoid blurry or dark images
- Use PDF for scanned documents

### Rate limiting
- Implement request queuing
- Add retry logic with exponential backoff
- Upgrade Mindee plan for higher limits

## Next Steps

Potential enhancements:

1. **Redis caching** for duplicate receipts
2. **Webhook support** for async results
3. **Batch processing** for multiple receipts
4. **Image preprocessing** to improve OCR accuracy
5. **Integration with expense tracking** module

## Support

- **Mindee Docs**: https://developers.mindee.com
- **API Status**: https://status.mindee.com
- **Support**: support@mindee.com
