# Gusto Integration - Quick Start Guide

Get started with Gusto Embedded Payroll in 5 minutes.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Gusto Developer Account (https://dev.gusto.com/)

## Step 1: Get Gusto Credentials

1. Sign up at https://dev.gusto.com/
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Configure redirect URI: `http://localhost:3000/api/integrations/gusto/callback`
5. Set up webhooks: `http://localhost:3000/api/integrations/gusto/webhooks`
6. Copy webhook secret

## Step 2: Configure Environment

```bash
# Copy example environment file
cp apps/api/src/modules/integrations/gusto/.env.example .env.local

# Generate encryption key
openssl rand -base64 32

# Edit .env.local with your values:
GUSTO_CLIENT_ID=your_client_id
GUSTO_CLIENT_SECRET=your_client_secret
GUSTO_REDIRECT_URI=http://localhost:3000/api/integrations/gusto/callback
GUSTO_WEBHOOK_SECRET=your_webhook_secret
GUSTO_ENCRYPTION_KEY=your_generated_key
GUSTO_ENVIRONMENT=sandbox
```

## Step 3: Database Setup

```bash
# Add Prisma models from prisma-schema.prisma to your main schema
# Then run migration
cd packages/database
pnpm prisma migrate dev --name add-gusto-integration

# Generate Prisma client
pnpm prisma generate
```

## Step 4: Import Module

Add to your `app.module.ts`:

```typescript
import { GustoModule } from './modules/integrations/gusto';

@Module({
  imports: [
    // ... existing modules
    GustoModule,
  ],
})
export class AppModule {}
```

## Step 5: Test OAuth Flow

### 5.1 Start Your Application

```bash
pnpm dev
```

### 5.2 Initiate OAuth

```bash
curl -X POST http://localhost:3000/api/integrations/gusto/oauth/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "organisationId": "your-org-id"
  }'
```

Response:
```json
{
  "authorizationUrl": "https://api.gusto-demo.com/oauth/authorize?...",
  "state": "abc123..."
}
```

### 5.3 Complete Authorization

1. Open `authorizationUrl` in browser
2. Log in with Gusto test account
3. Authorize the application
4. You'll be redirected to callback URL
5. Connection is automatically established

## Step 6: Provision a Test Company

```bash
curl -X POST http://localhost:3000/api/integrations/gusto/provision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@test.com"
    },
    "company": {
      "name": "Test Company Inc",
      "locations": [
        {
          "street_1": "123 Test St",
          "city": "San Francisco",
          "state": "CA",
          "zip": "94105"
        }
      ]
    }
  }'
```

Response:
```json
{
  "companyUuid": "comp_abc123",
  "accessToken": "eyJ...",
  "status": "ACTIVE",
  "expiresAt": "2024-12-03T10:00:00Z"
}
```

## Step 7: Create a Test Employee

```bash
curl -X POST http://localhost:3000/api/integrations/gusto/company/comp_abc123/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@test.com",
    "date_of_birth": "1990-01-15",
    "ssn": "123-45-6789",
    "home_address": {
      "street_1": "456 Test Ave",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    },
    "jobs": [
      {
        "location_uuid": "loc_xyz789",
        "hire_date": "2024-01-01",
        "title": "Software Engineer",
        "rate": "100000",
        "payment_unit": "Year"
      }
    ]
  }'
```

## Step 8: Test Webhooks (Optional)

### 8.1 Use ngrok for local testing

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Expose local server
ngrok http 3000

# Update webhook URL in Gusto dashboard to:
# https://your-subdomain.ngrok.io/api/integrations/gusto/webhooks
```

### 8.2 Trigger a test webhook

1. Go to Gusto dashboard
2. Make a change (e.g., update employee)
3. Check your application logs for webhook processing

## Common Test Scenarios

### List All Employees

```bash
curl http://localhost:3000/api/integrations/gusto/company/comp_abc123/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Company Details

```bash
curl http://localhost:3000/api/integrations/gusto/company/comp_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Sync Employees from Gusto

```bash
curl -X POST http://localhost:3000/api/integrations/gusto/company/comp_abc123/employees/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Connection Status

```bash
curl http://localhost:3000/api/integrations/gusto/status/comp_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Test Data for Sandbox

Use these test values in sandbox mode:

### Valid Test EINs
- `12-3456789`
- `98-7654321`

### Valid Test SSNs
- `123-45-6789`
- `987-65-4321`

### Valid Test States
- CA (California)
- NY (New York)
- TX (Texas)
- FL (Florida)

## Troubleshooting

### "Invalid OAuth state" Error
- State expires after 10 minutes
- Don't reuse old authorization URLs
- Generate a new authorization URL

### "Webhook signature verification failed"
- Check `GUSTO_WEBHOOK_SECRET` matches Gusto dashboard
- Ensure raw body is used (not parsed JSON)
- Verify webhook URL is correct

### "Token expired" Error
- Tokens refresh automatically 5 minutes before expiration
- Check database connection
- Verify `GUSTO_ENCRYPTION_KEY` hasn't changed

### "Rate limit exceeded"
- Sandbox: 100 requests per minute
- Production: Contact Gusto for limits
- Implement caching for frequently accessed data

## Next Steps

1. **Read Full Documentation**: See `README.md` for complete API reference
2. **Review Security**: Understand token encryption and webhook verification
3. **Test Payroll**: Create and process test payrolls
4. **Production Setup**: Follow production checklist in `.env.example`
5. **Monitor**: Set up logging and error tracking

## Need Help?

- 📚 [Gusto API Docs](https://docs.gusto.com/embedded-payroll/)
- 🎓 [Gusto Developer Portal](https://dev.gusto.com/)
- 📖 [Full README](./README.md)

## Production Checklist

Before going live:

- [ ] Set `GUSTO_ENVIRONMENT=production`
- [ ] Update redirect URI to production domain
- [ ] Configure production webhook URL
- [ ] Test OAuth flow end-to-end
- [ ] Verify webhook signatures
- [ ] Set up monitoring and alerts
- [ ] Review rate limits
- [ ] Test error handling
- [ ] Document incident response procedures
- [ ] Train support team

Happy coding! 🚀
