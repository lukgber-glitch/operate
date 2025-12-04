# Mindee Receipt OCR - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Get API Key
```bash
# Sign up at https://platform.mindee.com/
# Create API key in dashboard
# Copy your API key
```

### 2. Configure
```bash
# Add to .env
echo "MINDEE_API_KEY=your_key_here" >> .env
```

### 3. Use
```bash
# Start server
pnpm dev

# Test endpoint
curl -X POST http://localhost:3000/integrations/mindee/parse \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "file=@receipt.jpg"
```

## 📋 Quick Examples

### Upload Receipt
```typescript
// In your service
constructor(private mindeeService: MindeeService) {}

async processReceipt(file: Buffer, mimeType: string) {
  const result = await this.mindeeService.parseReceipt(file, mimeType);
  console.log('Total:', result.totals.amount);
  return result;
}
```

### Check Status
```bash
curl http://localhost:3000/integrations/mindee/health
```

## ⚡ Common Operations

| Task | Endpoint | Method |
|------|----------|--------|
| Parse receipt | `/integrations/mindee/parse` | POST |
| Parse async | `/integrations/mindee/parse/async` | POST |
| Get result | `/integrations/mindee/parse/async/:jobId` | GET |
| Health check | `/integrations/mindee/health` | GET |

## 🧪 Development Mode

No API key? No problem! The service runs in **MOCK MODE**:

```bash
# Just don't set MINDEE_API_KEY
pnpm dev

# You'll see:
# ⚠️  MINDEE_API_KEY not configured - running in MOCK MODE
```

Mock mode returns realistic test data for development.

## 📦 Supported Files

- **Images**: JPEG, PNG, WebP, TIFF, HEIC
- **Docs**: PDF
- **Max Size**: 10MB

## ⚙️ Configuration

```env
# Required (or run in mock mode)
MINDEE_API_KEY=your_key

# Optional
MINDEE_BASE_URL=https://api.mindee.net/v1
MINDEE_TIMEOUT=30000
```

## 🔍 What You Get

```json
{
  "success": true,
  "confidence": 0.92,
  "merchant": {
    "name": "Coffee Shop",
    "confidence": 0.95
  },
  "totals": {
    "amount": 15.50,
    "tax": 2.48,
    "currency": "EUR"
  },
  "lineItems": [...]
}
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Always mock mode | Set `MINDEE_API_KEY` in `.env` |
| File too large | Use async endpoint or compress |
| Timeout | Use async endpoint for large files |
| Invalid type | Use JPEG, PNG, or PDF |

## 📚 Full Docs

See [README.md](./README.md) for complete documentation.

## ✅ Ready to Deploy?

1. Set production API key
2. Register module in `app.module.ts`
3. Configure monitoring
4. Set up error alerts
5. Test with real receipts

---

**Need Help?**
- Mindee Docs: https://developers.mindee.com/docs/receipt-ocr
- API Status: https://status.mindee.com
