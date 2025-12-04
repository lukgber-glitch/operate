# Operate/CoachOS - API Integration Guide

## Overview

This document provides technical specifications for all external API integrations required for the world-class Operate app.

---

## 1. Banking APIs

### 1.1 GoCardless Bank Account Data (Recommended - Free)

**Purpose**: Account information, transaction history, balance checks for EU banks

**Coverage**: 2,300+ banks across EEA (Germany, Austria fully covered)

**Authentication**: OAuth 2.0

```typescript
// Environment Variables
GOCARDLESS_SECRET_ID=your_secret_id
GOCARDLESS_SECRET_KEY=your_secret_key
GOCARDLESS_BASE_URL=https://bankaccountdata.gocardless.com/api/v2
```

**OAuth Flow**:
```
1. POST /requisitions/ - Create requisition with redirect URL
2. User redirects to bank login
3. Bank redirects back with requisition_id
4. GET /requisitions/{id}/ - Get linked accounts
5. GET /accounts/{id}/transactions/ - Fetch transactions
```

**Key Endpoints**:
- `POST /institutions/` - List supported banks by country
- `POST /requisitions/` - Create consent requisition
- `GET /accounts/{id}/details/` - Account holder info
- `GET /accounts/{id}/balances/` - Current balance
- `GET /accounts/{id}/transactions/` - Transaction history

**Rate Limits**: Bank-imposed (typically 4 API calls/day per account)

**Implementation Notes**:
- Free tier available for development
- Store access tokens encrypted
- Implement token refresh before expiry
- Cache bank institution list (changes rarely)

---

### 1.2 Tink (Premium - Built-in Categorization)

**Purpose**: Enterprise banking with transaction categorization

**Coverage**: 6,000+ banks across 19 European countries

**Authentication**: OAuth 2.0 with Tink Link

```typescript
// Environment Variables
TINK_CLIENT_ID=your_client_id
TINK_CLIENT_SECRET=your_client_secret
TINK_BASE_URL=https://api.tink.com
```

**OAuth Flow**:
```
1. Generate Tink Link URL with client_id
2. User completes authentication in Tink widget
3. Tink redirects with authorization_code
4. Exchange code for access_token
5. Access APIs with Bearer token
```

**Key Endpoints**:
- `GET /api/v1/accounts` - List connected accounts
- `GET /api/v1/transactions` - Get transactions
- `GET /api/v1/categories` - Get categorization
- `GET /api/v1/insights` - Financial insights

**Pricing**: ~€0.50/user/month (contact for volume)

---

## 2. Email APIs

### 2.1 Microsoft Graph API (Outlook/Office 365)

**Purpose**: Read emails and attachments for invoice extraction

**Authentication**: OAuth 2.0 with Azure AD

```typescript
// Environment Variables
MICROSOFT_GRAPH_CLIENT_ID=your_azure_app_client_id
MICROSOFT_GRAPH_CLIENT_SECRET=your_azure_app_secret
MICROSOFT_GRAPH_TENANT_ID=common  // or specific tenant
MICROSOFT_GRAPH_REDIRECT_URI=https://app.operate.com/api/v1/integrations/microsoft/callback
```

**Required Scopes**:
```
Mail.Read
Mail.ReadBasic
User.Read
offline_access
```

**OAuth Flow**:
```
1. Redirect to: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
2. User grants permissions
3. Receive authorization_code
4. POST to /oauth2/v2.0/token for access_token
5. Use Bearer token for API calls
```

**Key Endpoints**:
- `GET /me/messages` - List emails
- `GET /me/messages/{id}` - Get single email
- `GET /me/messages/{id}/attachments` - Get attachments
- `POST /subscriptions` - Webhook for new emails

**Implementation Notes**:
- Refresh tokens valid for 90 days
- Implement incremental sync (deltaLink)
- Filter emails by date/sender for efficiency

---

### 2.2 Gmail API

**Purpose**: Read emails and attachments for invoice extraction

**Authentication**: OAuth 2.0 with Google Cloud

```typescript
// Environment Variables
GOOGLE_GMAIL_CLIENT_ID=your_gcp_client_id
GOOGLE_GMAIL_CLIENT_SECRET=your_gcp_secret
GOOGLE_GMAIL_REDIRECT_URI=https://app.operate.com/api/v1/integrations/google/callback
```

**Required Scopes**:
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.labels
```

**OAuth Flow**:
```
1. Redirect to: https://accounts.google.com/o/oauth2/v2/auth
2. User grants permissions
3. Receive authorization_code
4. POST to /token for access_token
5. Use Bearer token for API calls
```

**Key Endpoints**:
- `GET /users/me/messages` - List messages
- `GET /users/me/messages/{id}` - Get message with parts
- `GET /users/me/messages/{id}/attachments/{attachmentId}` - Get attachment
- `POST /users/me/watch` - Push notifications via Pub/Sub

**Implementation Notes**:
- Access tokens expire in 1 hour
- Refresh tokens don't expire unless revoked
- Use history.list for incremental sync

---

## 3. Document OCR APIs

### 3.1 Mindee (Invoice/Receipt OCR)

**Purpose**: Extract structured data from invoice/receipt images

**Authentication**: API Key

```typescript
// Environment Variables
MINDEE_API_KEY=your_api_key
MINDEE_BASE_URL=https://api.mindee.net/v1
```

**Key Endpoints**:
```
POST /products/mindee/invoices/v4/predict
POST /products/mindee/expense_receipts/v5/predict
```

**Request Example**:
```typescript
const response = await fetch('https://api.mindee.net/v1/products/mindee/invoices/v4/predict', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${MINDEE_API_KEY}`,
  },
  body: formData // multipart with 'document' file
});
```

**Response Fields (Invoice)**:
- `invoice_number`
- `invoice_date`
- `due_date`
- `supplier_name`
- `supplier_address`
- `customer_name`
- `total_amount`
- `total_tax`
- `line_items[]`

**Pricing**: Free tier (250 pages/month), then pay-per-use

---

### 3.2 Azure Document Intelligence (Alternative)

**Purpose**: Enterprise OCR with high accuracy

**Authentication**: API Key

```typescript
// Environment Variables
AZURE_DOCUMENT_ENDPOINT=https://<resource>.cognitiveservices.azure.com
AZURE_DOCUMENT_KEY=your_api_key
```

**Key Endpoints**:
```
POST /formrecognizer/documentModels/prebuilt-invoice:analyze
GET /formrecognizer/documentModels/prebuilt-invoice/analyzeResults/{resultId}
```

**Pricing**: $1.50 per 1000 pages

---

## 4. Tax Software APIs

### 4.1 lexoffice API

**Purpose**: Accounting integration for German SMEs

**Authentication**: API Key (Bearer token)

```typescript
// Environment Variables
LEXOFFICE_API_KEY=your_api_key
LEXOFFICE_BASE_URL=https://api.lexoffice.io/v1
```

**Key Endpoints**:
- `GET /contacts` - List customers/suppliers
- `POST /invoices` - Create invoice
- `GET /invoices/{id}` - Get invoice
- `GET /vouchers` - List vouchers/receipts
- `POST /event-subscriptions` - Webhooks

**Rate Limit**: 2 requests/second

**Implementation Notes**:
- Token bucket rate limiting on client
- Webhook events: invoice.created, payment.received, etc.

---

### 4.2 sevDesk API

**Purpose**: Alternative accounting integration

**Authentication**: API Token

```typescript
// Environment Variables
SEVDESK_API_TOKEN=your_api_token
SEVDESK_BASE_URL=https://my.sevdesk.de/api/v1
```

**Key Endpoints**:
- `GET /Contact` - List contacts
- `POST /Invoice` - Create invoice
- `GET /CheckAccount` - Bank accounts
- `GET /CheckAccountTransaction` - Transactions

**Implementation Notes**:
- Check bookkeeping version first
- Use new tax rules (v2.0)

---

## 5. VAT Validation

### 5.1 VIES (EU VAT Validation)

**Purpose**: Validate EU VAT numbers for B2B transactions

**Authentication**: None (public SOAP service)

```typescript
// Endpoint (SOAP)
VIES_ENDPOINT=http://ec.europa.eu/taxation_customs/vies/services/checkVatService
```

**SOAP Request**:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>DE</urn:countryCode>
      <urn:vatNumber>123456789</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>
```

**Implementation Notes**:
- Cache valid results (VAT numbers rarely change)
- Handle service downtime gracefully
- Log all validations for audit

---

## 6. AI Services

### 6.1 Claude API (Anthropic)

**Purpose**: Advanced classification, chatbot, suggestions

**Already Configured**:
```typescript
ANTHROPIC_API_KEY=your_key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**New Use Cases**:
- Chatbot conversations
- Email content analysis
- Proactive suggestions
- Report generation

---

### 6.2 OpenAI API

**Purpose**: Backup/alternative AI, embeddings

**Already Configured**:
```typescript
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4-turbo-preview
```

**New Use Cases**:
- Transaction categorization
- Document understanding
- Semantic search (embeddings)

---

## 7. Notification Services

### 7.1 Firebase Cloud Messaging (Push)

**Purpose**: Mobile push notifications

```typescript
// Environment Variables
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
```

**Implementation**:
```typescript
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

// Send notification
await admin.messaging().send({
  token: userDeviceToken,
  notification: {
    title: 'Tax Deadline Reminder',
    body: 'Your VAT return is due in 3 days',
  },
});
```

---

## 8. Payment Processing

### 8.1 Stripe (Already Configured)

```typescript
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Use Cases**:
- SaaS subscription billing
- Invoice payment links
- Customer payment methods

---

## Authorization Flow Summary

| Service | Auth Type | Token Refresh | User Action |
|---------|-----------|---------------|-------------|
| GoCardless | OAuth 2.0 | 90 days | Bank login |
| Tink | OAuth 2.0 | Varies | Bank login |
| Microsoft Graph | OAuth 2.0 | 90 days | Consent screen |
| Gmail | OAuth 2.0 | Unlimited | Consent screen |
| Mindee | API Key | N/A | None (backend) |
| lexoffice | API Key | N/A | Enter in settings |
| sevDesk | API Token | N/A | Enter in settings |
| VIES | None | N/A | None |
| ELSTER | Certificate | 3 years | Upload cert |

---

## Security Best Practices

1. **Store tokens encrypted** (AES-256 in database)
2. **Rotate API keys periodically** (quarterly)
3. **Implement token refresh** before expiry
4. **Use webhooks** instead of polling where available
5. **Log all API calls** for audit (GoBD compliance)
6. **Rate limit outgoing requests** to prevent blocks
7. **Handle errors gracefully** with user-friendly messages
8. **Test in sandbox** before production
