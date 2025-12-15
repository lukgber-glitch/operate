# Public API Routes for Client Portal

These API routes need to be implemented on the backend to support the client portal functionality.

## Invoice Routes

### GET `/api/public/invoices/:token`
Fetch invoice by public token
- **Returns**: PublicInvoice object with all details
- **Access**: No authentication required, token validates access

### POST `/api/public/invoices/:token/payment-intent`
Create a Stripe payment intent
- **Body**: `{ amount: number }`
- **Returns**: `{ clientSecret: string, paymentIntentId: string }`
- **Integration**: Stripe Payment Intent API

### POST `/api/public/invoices/:token/payment`
Record a payment on an invoice
- **Body**: `{ amount: number, paymentMethodId: string, paymentIntentId?: string }`
- **Returns**: Updated invoice with payment recorded
- **Action**: Updates invoice status, creates payment record

### GET `/api/public/invoices/:token/pdf`
Download invoice as PDF
- **Returns**: PDF file stream
- **Headers**: `Content-Type: application/pdf`

### GET `/api/public/invoices/:token/receipt`
Download payment receipt
- **Query**: `paymentId` (optional)
- **Returns**: PDF receipt
- **Headers**: `Content-Type: application/pdf`

## Quote Routes

### GET `/api/public/quotes/:token`
Fetch quote by public token
- **Returns**: PublicQuote object with all details
- **Access**: No authentication required

### POST `/api/public/quotes/:token/view`
Mark quote as viewed
- **Body**: Empty
- **Returns**: Updated quote with VIEWED status
- **Action**: Updates status from SENT to VIEWED

### POST `/api/public/quotes/:token/accept`
Accept a quote
- **Body**: `{ notes?: string }`
- **Returns**: Updated quote with ACCEPTED status
- **Action**:
  - Updates quote status to ACCEPTED
  - Sends notification to company
  - May trigger invoice creation

### POST `/api/public/quotes/:token/reject`
Reject a quote
- **Body**: `{ reason?: string }`
- **Returns**: Updated quote with REJECTED status
- **Action**: Updates status, records rejection reason

### GET `/api/public/quotes/:token/pdf`
Download quote as PDF
- **Returns**: PDF file stream
- **Headers**: `Content-Type: application/pdf`

## Implementation Notes

### Security
- Tokens should be cryptographically secure (UUID v4 or similar)
- Tokens should have expiration dates
- Rate limiting should be applied to prevent abuse
- Validate token before any operation

### Stripe Integration
- Use Stripe Payment Intents API for secure payments
- Handle 3D Secure authentication
- Store payment method IDs securely
- Create payment records in database after successful payment

### Email Notifications
When implementing these routes, trigger appropriate emails:
- Payment received → Send receipt to customer
- Quote accepted → Notify company
- Quote rejected → Notify company (optional)

### Database Schema Requirements
Ensure your database has:
- `publicToken` field on Invoice and Quote models
- `tokenExpiresAt` field for token expiration
- Payment records linked to invoices
- Status tracking for both invoices and quotes
