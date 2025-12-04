# W-4 & I-9 Document System - Quick Reference

## Setup

### 1. Run Migration
```bash
cd packages/database
npx prisma migrate dev --name add_employee_documents
npx prisma generate
```

### 2. Environment Variables
```env
# Add to .env
STORAGE_PATH=./storage/documents
STORAGE_USE_S3=false
DOCUMENT_ENCRYPTION_KEY=your-32-char-secure-key-here
```

### 3. Create Storage Directory
```bash
mkdir -p storage/documents
```

## Common API Calls

### Upload Document
```bash
curl -X POST http://localhost:3000/hr/employees/{employeeId}/documents/upload \
  -H "x-org-id: org-123" \
  -F "file=@document.pdf" \
  -F "documentType=W4_FORM" \
  -F "issueDate=2024-01-15"
```

### Create W-4 Form
```bash
curl -X POST http://localhost:3000/hr/employees/{employeeId}/documents/w4 \
  -H "Content-Type: application/json" \
  -H "x-org-id: org-123" \
  -d '{
    "taxYear": 2024,
    "firstName": "John",
    "lastName": "Doe",
    "ssn": "123-45-6789",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "filingStatus": "SINGLE",
    "multipleJobsOrSpouseWorks": false,
    "numberOfDependentsUnder17": 2,
    "numberOfOtherDependents": 0,
    "otherIncome": 0,
    "deductions": 0,
    "extraWithholding": 0
  }'
```

### Sign W-4 Form
```bash
curl -X POST http://localhost:3000/hr/employees/{employeeId}/documents/w4/{w4FormId}/sign \
  -H "Content-Type: application/json" \
  -H "x-org-id: org-123" \
  -d '{"confirmAccuracy": true}'
```

### Create I-9 Section 1
```bash
curl -X POST http://localhost:3000/hr/employees/{employeeId}/documents/i9/section1 \
  -H "Content-Type: application/json" \
  -H "x-org-id: org-123" \
  -d '{
    "lastName": "Doe",
    "firstName": "John",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "dateOfBirth": "1990-05-15",
    "ssn": "123-45-6789",
    "email": "john.doe@example.com",
    "citizenOfUS": true,
    "nonCitizenNational": false,
    "lawfulPermanentResident": false,
    "alienAuthorizedToWork": false
  }'
```

### Complete I-9 Section 2
```bash
curl -X POST http://localhost:3000/hr/employees/{employeeId}/documents/i9/{i9FormId}/section2 \
  -H "Content-Type: application/json" \
  -H "x-org-id: org-123" \
  -d '{
    "firstDayOfEmployment": "2024-01-15",
    "documentListA": "LIST_A",
    "documentListATitle": "US Passport",
    "documentListAIssuer": "US Department of State",
    "documentListANumber": "P123456789",
    "documentListAExpiry": "2029-01-15",
    "employerName": "Acme Corp",
    "employerAddress": "456 Business Blvd",
    "employerCity": "New York",
    "employerState": "NY",
    "employerZipCode": "10002",
    "employerRepName": "Jane Smith",
    "employerRepTitle": "HR Manager"
  }'
```

### Get Documents Requiring Attention
```bash
curl http://localhost:3000/hr/documents/attention-required \
  -H "x-org-id: org-123"
```

## Code Examples

### Service Injection
```typescript
constructor(
  private documentsService: EmployeeDocumentsService,
  private w4FormService: W4FormService,
  private i9FormService: I9FormService,
) {}
```

### Upload Document in Code
```typescript
const document = await this.documentsService.uploadDocument(
  file,
  employeeId,
  orgId,
  userId,
  {
    documentType: 'W4_FORM',
    issueDate: '2024-01-15',
  },
  req.ip,
  req.headers['user-agent'],
);
```

### Get Active W-4
```typescript
const w4Form = await this.w4FormService.getActiveForEmployee(
  employeeId,
  2024, // tax year
);
```

### Check I-9 Reverification
```typescript
const formsNeedingReverification =
  await this.i9FormService.findRequiringReverification(orgId);
```

## Key Constants

### Document Types
- `W4_FORM`
- `I9_FORM`
- `PASSPORT`
- `DRIVERS_LICENSE`
- `SOCIAL_SECURITY_CARD`
- `BIRTH_CERTIFICATE`
- `WORK_PERMIT`
- `OTHER`

### Document Status
- `PENDING` - Awaiting verification
- `VERIFIED` - Approved by HR
- `REJECTED` - Rejected with reason
- `EXPIRED` - Past expiration date

### Filing Status (W-4)
- `SINGLE`
- `MARRIED_FILING_JOINTLY`
- `MARRIED_FILING_SEPARATELY`
- `HEAD_OF_HOUSEHOLD`

### I-9 Document Lists
- `LIST_A` - Identity + Work Authorization
- `LIST_B` - Identity only
- `LIST_C` - Work Authorization only

### Upload Constraints
- Max file size: 10 MB
- Allowed types: PDF, JPEG, PNG, TIFF
- Extensions: .pdf, .jpg, .jpeg, .png, .tiff, .tif

### Retention Periods
- W-4 forms: 4 years
- I-9 forms: 3 years after termination
- General documents: 7 years

## Dependent Amounts (2024)
- Child under 17: $2,000
- Other dependent: $500

## Standard Deductions (2024)
- Single: $13,850
- Married filing jointly: $27,700
- Married filing separately: $13,850
- Head of household: $20,800

## Important Notes

1. **SSN Encryption**: All SSNs are automatically encrypted before storage
2. **Document Encryption**: All uploaded files are encrypted at rest
3. **Audit Logging**: Every document access is logged for compliance
4. **Soft Deletes**: Documents are never hard-deleted
5. **One Active W-4**: Only one W-4 can be active per employee per tax year
6. **I-9 Timeline**: Section 2 must be completed within 3 business days
7. **Reverification**: System alerts 90 days before work authorization expires

## Troubleshooting

### "Document not found" Error
- Check if document was soft-deleted (deletedAt field)
- Verify orgId matches the document's organization

### "Access denied" Error
- Verify employee belongs to the organization
- Check authentication headers (x-org-id)

### Encryption Errors
- Ensure DOCUMENT_ENCRYPTION_KEY is set in .env
- Key must be at least 32 characters

### File Upload Fails
- Check file size (< 10MB)
- Verify file type is allowed
- Ensure storage directory exists and is writable

## Security Checklist

- [ ] Encryption key stored in environment variables
- [ ] Storage directory has restricted permissions
- [ ] HTTPS enabled in production
- [ ] Authentication guards enabled
- [ ] Role-based access control configured
- [ ] Audit logs monitored
- [ ] Backup strategy in place
- [ ] S3 encryption enabled (production)

## Testing

### Unit Test Example
```typescript
describe('W4FormService', () => {
  it('should calculate withholding correctly', async () => {
    const w4Form = await service.create(employeeId, orgId, {
      // ... W-4 data
      numberOfDependentsUnder17: 2,
    });

    await service.sign(w4Form.id, userId, { confirmAccuracy: true });
    const updated = await service.findById(w4Form.id);

    expect(updated.calculatedWithholding).toBeGreaterThan(0);
  });
});
```

### Integration Test Example
```typescript
describe('Document Upload Flow', () => {
  it('should upload, verify, and download document', async () => {
    // Upload
    const doc = await documentsService.uploadDocument(/* ... */);
    expect(doc.status).toBe('PENDING');

    // Verify
    await documentsService.verifyDocument(doc.id, orgId, userId, {});
    const verified = await documentsService.getDocument(doc.id, orgId, userId);
    expect(verified.status).toBe('VERIFIED');

    // Download
    const { buffer } = await documentsService.downloadDocument(
      doc.id, orgId, userId
    );
    expect(buffer).toBeDefined();
  });
});
```

## Monitoring Queries

### Documents Expiring Soon
```sql
SELECT e.firstName, e.lastName, d.documentType, d.expirationDate
FROM "EmployeeDocument" d
JOIN "Employee" e ON e.id = d.employeeId
WHERE d.orgId = 'org-123'
  AND d.deletedAt IS NULL
  AND d.expirationDate BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY d.expirationDate ASC;
```

### Pending Verifications
```sql
SELECT COUNT(*) as pending_count
FROM "EmployeeDocument"
WHERE orgId = 'org-123'
  AND status = 'PENDING'
  AND deletedAt IS NULL;
```

### I-9 Compliance Check
```sql
SELECT e.firstName, e.lastName, i.section1CompletedAt, i.section2CompletedAt
FROM "I9Form" i
JOIN "Employee" e ON e.id = i.employeeId
WHERE i.orgId = 'org-123'
  AND i.isActive = true
  AND i.section2CompletedAt IS NULL
  AND i.section1CompletedAt < NOW() - INTERVAL '3 days';
```

---

**Quick Links:**
- [Full Implementation Report](./TASK_W21-T6_COMPLETION_REPORT.md)
- [Prisma Schema](./packages/database/prisma/schema.prisma)
- [API Documentation](http://localhost:3000/api-docs) (after starting server)
