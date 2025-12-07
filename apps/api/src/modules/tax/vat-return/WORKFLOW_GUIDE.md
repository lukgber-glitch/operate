# VAT Return Workflow Guide

Quick reference for using the VAT Return module.

## Complete Workflow Example

### Step 1: Generate Preview (No DB Save)

Preview what the VAT return will look like before creating it.

**Request:**
```http
GET /tax/vat-return/preview?organizationId=org_abc&period=2025-Q1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "organizationId": "org_abc",
  "period": "2025-Q1",
  "periodType": "quarterly",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-03-31T23:59:59Z",
  "outputVat": {
    "rate19": {
      "invoices": [
        {
          "id": "inv_1",
          "invoiceNumber": "INV-2025-001",
          "customerName": "ACME GmbH",
          "issueDate": "2025-01-15T00:00:00Z",
          "subtotal": 10000.00,
          "vatRate": 19,
          "vatAmount": 1900.00,
          "totalAmount": 11900.00
        }
      ],
      "subtotal": 10000.00,
      "vat": 1900.00,
      "count": 1
    },
    "rate7": {
      "invoices": [],
      "subtotal": 0,
      "vat": 0,
      "count": 0
    },
    "rate0": {
      "invoices": [],
      "subtotal": 0,
      "vat": 0,
      "count": 0
    },
    "total": 10000.00,
    "totalVat": 1900.00,
    "totalInvoices": 1
  },
  "inputVat": {
    "rate19": {
      "expenses": [
        {
          "id": "exp_1",
          "description": "Office supplies",
          "vendorName": "Office Depot",
          "date": "2025-01-20T00:00:00Z",
          "subtotal": 500.00,
          "vatRate": 19,
          "vatAmount": 95.00,
          "totalAmount": 595.00,
          "category": "OFFICE_SUPPLIES"
        }
      ],
      "subtotal": 500.00,
      "vat": 95.00,
      "count": 1
    },
    "rate7": {
      "expenses": [],
      "subtotal": 0,
      "vat": 0,
      "count": 0
    },
    "total": 500.00,
    "totalVat": 95.00,
    "totalExpenses": 1
  },
  "netVat": 1805.00,
  "dueDate": "2025-04-10T00:00:00Z",
  "status": "ready",
  "warnings": [],
  "missingData": []
}
```

### Step 2: Create Draft

Save the VAT return as a draft in the database.

**Request:**
```http
POST /tax/vat-return
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationId": "org_abc",
  "period": "2025-Q1"
}
```

**Response:**
```json
{
  "id": "vat_xyz123",
  "organisationId": "org_abc",
  "period": "2025-Q1",
  "periodType": "quarterly",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-03-31T23:59:59Z",
  "outputVat": 1900.00,
  "inputVat": 95.00,
  "netVat": 1805.00,
  "status": "DRAFT",
  "transferTicket": null,
  "receiptId": null,
  "submittedAt": null,
  "acceptedAt": null,
  "rejectedAt": null,
  "rejectionReason": null,
  "errorCode": null,
  "approvedBy": null,
  "approvedAt": null,
  "previewData": { /* Full preview object */ },
  "notes": null,
  "metadata": null,
  "createdAt": "2025-04-01T10:00:00Z",
  "updatedAt": "2025-04-01T10:00:00Z"
}
```

### Step 3: Review Draft

View the saved draft anytime.

**Request:**
```http
GET /tax/vat-return/vat_xyz123
Authorization: Bearer {token}
```

### Step 4: Update Preview (Optional)

If invoices or expenses changed, refresh the preview data.

**Request:**
```http
PUT /tax/vat-return/vat_xyz123/preview
Authorization: Bearer {token}
```

### Step 5: Submit for Approval

Move to approval workflow.

**Request:**
```http
POST /tax/vat-return/vat_xyz123/submit-for-approval
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "vat_xyz123",
  "status": "PENDING_APPROVAL",
  // ... other fields
}
```

### Step 6: Approve

Manager or owner approves the VAT return.

**Request:**
```http
POST /tax/vat-return/vat_xyz123/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_456",
  "notes": "Reviewed all invoices and expenses. Approved for submission."
}
```

**Response:**
```json
{
  "id": "vat_xyz123",
  "status": "APPROVED",
  "approvedBy": "user_456",
  "approvedAt": "2025-04-05T14:30:00Z",
  "notes": "Reviewed all invoices and expenses. Approved for submission.",
  // ... other fields
}
```

### Step 7: Submit to ELSTER

After external ELSTER submission process completes:

**Request:**
```http
POST /tax/vat-return/vat_xyz123/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "transferTicket": "TT-2025-Q1-ABC123XYZ",
  "receiptId": "REC-2025-Q1-001"
}
```

**Response:**
```json
{
  "id": "vat_xyz123",
  "status": "SUBMITTED",
  "transferTicket": "TT-2025-Q1-ABC123XYZ",
  "receiptId": "REC-2025-Q1-001",
  "submittedAt": "2025-04-05T15:00:00Z",
  // ... other fields
}
```

### Step 8a: Mark as Accepted (Success Path)

When ELSTER confirms acceptance:

**Request:**
```http
POST /tax/vat-return/vat_xyz123/accept
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "vat_xyz123",
  "status": "ACCEPTED",
  "acceptedAt": "2025-04-06T09:00:00Z",
  // ... other fields
}
```

### Step 8b: Mark as Rejected (Error Path)

If ELSTER rejects the submission:

**Request:**
```http
POST /tax/vat-return/vat_xyz123/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Invalid tax number format. Please verify organization tax ID.",
  "errorCode": "ERR_TAX_NUMBER_INVALID"
}
```

**Response:**
```json
{
  "id": "vat_xyz123",
  "status": "REJECTED",
  "rejectedAt": "2025-04-06T09:00:00Z",
  "rejectionReason": "Invalid tax number format. Please verify organization tax ID.",
  "errorCode": "ERR_TAX_NUMBER_INVALID",
  // ... other fields
}
```

## Period Formats

### Quarterly Return
```json
{
  "period": "2025-Q1"  // Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
}
```

### Monthly Return
```json
{
  "period": "2025-01"  // January 2025
}
```

### Yearly Return
```json
{
  "period": "2025"  // Full year
}
```

## Common Operations

### Get History for Organization

**All returns:**
```http
GET /tax/vat-return/history?organizationId=org_abc
Authorization: Bearer {token}
```

**Specific year:**
```http
GET /tax/vat-return/history?organizationId=org_abc&year=2025
Authorization: Bearer {token}
```

### Check if Period Already Filed

```http
GET /tax/vat-return/period/org_abc/2025-Q1
Authorization: Bearer {token}
```

Returns:
- VAT return object if exists
- 404 if not found

### Delete Draft

Only allowed for DRAFT or REJECTED status:

```http
DELETE /tax/vat-return/vat_xyz123
Authorization: Bearer {token}
```

## Status Transitions

### Allowed Transitions

```
DRAFT → PENDING_APPROVAL
  ↓
PENDING_APPROVAL → APPROVED
  ↓
APPROVED → SUBMITTED
  ↓
SUBMITTED → ACCEPTED or REJECTED
```

### Blocked Transitions

- Cannot approve from DRAFT (must submit for approval first)
- Cannot submit to ELSTER from PENDING_APPROVAL (must approve first)
- Cannot change status after ACCEPTED
- Can only delete DRAFT or REJECTED returns

## Error Handling

### 409 Conflict - Duplicate Period
```json
{
  "statusCode": 409,
  "message": "VAT return for period 2025-Q1 already exists with ID vat_xyz123",
  "error": "Conflict"
}
```

### 400 Bad Request - Invalid Status Transition
```json
{
  "statusCode": 400,
  "message": "VAT return must be in PENDING_APPROVAL status to approve. Current status: DRAFT",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "VAT return with ID vat_xyz123 not found",
  "error": "Not Found"
}
```

## Preview Warnings

The system generates warnings for:

1. **Invoices without VAT rate**
   ```
   "5 invoice(s) have no VAT rate set: INV-2025-001, INV-2025-002, ..."
   ```

2. **Expenses without VAT**
   ```
   "3 expense(s) have no VAT recorded - verify if VAT is deductible"
   ```

3. **Unusual VAT rates**
   ```
   "2 invoice(s) with unusual VAT rates (not 19% or 7%)"
   ```

4. **High-value invoices without customer VAT ID**
   ```
   "4 high-value invoice(s) without customer VAT ID"
   ```

## Integration with ELSTER

The VAT return data is ready for ELSTER XML generation:

```typescript
// Example integration
const vatReturn = await vatReturnService.getById('vat_xyz123');
const elsterXml = await elsterService.generateXml(vatReturn);

// Submit to ELSTER
const result = await elsterService.submit(elsterXml);

// Update VAT return with result
await vatReturnService.markSubmitted(vatReturn.id, {
  transferTicket: result.transferTicket,
  receiptId: result.receiptId
});
```

## Best Practices

1. **Always preview before creating** - Check warnings and validate data
2. **Update preview if data changes** - Before moving to approval
3. **Include approval notes** - Document review process
4. **Store ELSTER tickets** - For audit trail
5. **Handle rejections gracefully** - Fix issues and create new return
6. **Keep history** - Don't delete accepted/submitted returns

## Due Dates Reference

| Period Type | Due Date |
|-------------|----------|
| Monthly | 10th of following month |
| Quarterly | 10th of month after quarter end |
| Yearly | May 31st of following year |

Example:
- 2025-Q1 (Jan-Mar) → Due: April 10, 2025
- 2025-01 (January) → Due: February 10, 2025
- 2025 (Full year) → Due: May 31, 2026
