# Email Intelligence - Entity Extractor

AI-powered entity extraction from email content for automatic business data capture.

## Overview

The Entity Extractor Service uses OpenAI GPT-4o to automatically extract structured business information from emails, including:

- **Companies** (customers, vendors, partners)
- **Contacts** (names, emails, phones, roles)
- **Financial data** (amounts, currencies, invoice/order numbers)
- **Dates** (due dates, meeting dates, deadlines)
- **References** (project names, tracking numbers)
- **Addresses**

## Features

- ✅ Multi-language support (German & English)
- ✅ Hybrid extraction (AI + regex patterns)
- ✅ Email signature parsing
- ✅ Batch processing with concurrency control
- ✅ Confidence scoring for all extracted entities
- ✅ Automatic data normalization
- ✅ Database storage with queryable fields

## Architecture

```
email-intelligence/
├── entity-extractor.service.ts      # Main service
├── types/
│   └── extracted-entities.types.ts  # TypeScript interfaces
├── prompts/
│   └── extraction-prompt.ts         # AI prompts
├── parsers/
│   └── signature-parser.ts          # Regex-based parsing
└── email-intelligence.module.ts     # NestJS module
```

## Usage

### Basic Extraction

```typescript
import { EntityExtractorService } from './email-intelligence';

// Inject service
constructor(private entityExtractor: EntityExtractorService) {}

// Extract from single email
const email = {
  subject: 'Invoice RE-2024-12345',
  from: 'billing@vendor.com',
  to: 'finance@company.com',
  body: '...',
};

const entities = await this.entityExtractor.extractEntities(email);

console.log(entities.companies);      // [{ name: 'Vendor Inc', role: 'VENDOR', ... }]
console.log(entities.contacts);       // [{ name: 'John Doe', email: '...', ... }]
console.log(entities.amounts);        // [{ value: 1500, currency: 'EUR', ... }]
console.log(entities.invoiceNumbers); // ['RE-2024-12345']
console.log(entities.dates);          // [{ date: Date, context: 'due date' }]
```

### Batch Processing

```typescript
const emails = [email1, email2, email3];
const results = await this.entityExtractor.extractBatch(emails);
// Processes with concurrency limit of 5
```

### Signature Extraction

```typescript
const signature = await this.entityExtractor.extractFromSignature(emailBody);

console.log(signature.name);    // 'Max Mustermann'
console.log(signature.company); // 'ACME Solutions GmbH'
console.log(signature.phone);   // '+49 30 12345678'
console.log(signature.email);   // 'm.mustermann@acme.de'
```

### Store in Database

```typescript
import { PrismaService } from '../../database/prisma.service';

// Extract entities
const entities = await this.entityExtractor.extractEntities(email);

// Store in database
await this.prisma.emailExtractedEntities.create({
  data: {
    emailId: syncedEmail.id,
    orgId: syncedEmail.orgId,
    userId: syncedEmail.userId,
    entities: entities as any, // Full JSON object
    companyNames: entities.companies.map(c => c.name),
    contactEmails: entities.contacts.map(c => c.email),
    invoiceNumbers: entities.invoiceNumbers,
    orderNumbers: entities.orderNumbers,
    overallConfidence: entities.overallConfidence,
    status: 'COMPLETED',
  },
});
```

### Query by Entities

```typescript
// Find emails from specific company
const emails = await this.prisma.emailExtractedEntities.findMany({
  where: {
    companyNames: { has: 'ACME Solutions' },
  },
  include: { email: true },
});

// Find emails with invoice number
const invoiceEmails = await this.prisma.emailExtractedEntities.findMany({
  where: {
    invoiceNumbers: { has: 'RE-2024-12345' },
  },
});

// Find emails from contact
const contactEmails = await this.prisma.emailExtractedEntities.findMany({
  where: {
    contactEmails: { has: 'john.doe@vendor.com' },
  },
});
```

## Extracted Entity Types

### Companies

```typescript
{
  name: string;
  confidence: number;
  role: 'CUSTOMER' | 'VENDOR' | 'PARTNER' | 'UNKNOWN';
  normalizedName?: string;  // Without GmbH, Inc, etc.
  vatId?: string;           // Tax ID
  domain?: string;          // Email domain
}
```

### Contacts

```typescript
{
  name: string;
  email: string;
  phone?: string;           // Normalized to E.164
  role?: string;            // Job title
  company?: string;
  confidence: number;
}
```

### Amounts

```typescript
{
  value: number;
  currency: string;         // ISO 4217 (EUR, USD, etc.)
  context: string;          // 'invoice total', 'payment', etc.
  confidence: number;
}
```

### Dates

```typescript
{
  date: Date;
  context: string;          // 'due date', 'meeting', etc.
  confidence: number;
}
```

## Supported Patterns

### German Formats
- Dates: `31.12.2024`, `31. Dezember 2024`
- Amounts: `1.234,56 €`, `1234,56 EUR`
- Tax IDs: `DE123456789`, `ATU12345678`
- Phone: `+49 30 12345678`, `(030) 12345-678`

### English Formats
- Dates: `Dec 31, 2024`, `2024-12-31`
- Amounts: `$1,234.56`, `1234.56 USD`
- Phone: `+1 (555) 123-4567`

### Invoice/Order Numbers
- `RE-2024-12345`
- `INV-001`
- `Rechnung Nr. 12345`
- `PO-12345`
- `Order #12345`

## Database Schema

```prisma
model EmailExtractedEntities {
  id                String   @id @default(cuid())
  emailId           String   @unique
  orgId             String
  userId            String

  // Full entities as JSON
  entities          Json

  // Quick access fields (denormalized)
  companyNames      String[]
  contactEmails     String[]
  invoiceNumbers    String[]
  orderNumbers      String[]

  overallConfidence Float
  extractedAt       DateTime @default(now())
  status            String   @default("PENDING")

  email             SyncedEmail @relation(fields: [emailId], references: [id])

  @@index([companyNames])
  @@index([contactEmails])
  @@index([invoiceNumbers])
}
```

## Configuration

Required environment variable:

```env
OPENAI_API_KEY=sk-...
```

Optional configuration in service initialization:

```typescript
const entities = await service.extractEntities(email, {
  maxRetries: 3,              // Retry on failure
  timeout: 30000,             // 30 second timeout
  useSignatureParser: true,   // Enable regex signature parsing
});
```

## Performance

- **Single extraction**: ~2-5 seconds
- **Batch processing**: Concurrent with limit of 5
- **Signature parsing**: <100ms (regex fallback)

## Error Handling

Service handles errors gracefully:

```typescript
try {
  const entities = await service.extractEntities(email);
} catch (error) {
  // Logs error and returns empty entities structure
  // Does not throw in batch mode
}
```

In batch mode, failed extractions return empty entities with confidence 0 instead of failing the entire batch.

## Confidence Scoring

- **1.0**: Explicitly stated and unambiguous
- **0.8-0.9**: Clear with minor ambiguity
- **0.6-0.7**: Inferred from context
- **0.4-0.5**: Uncertain or incomplete
- **0.0-0.3**: Highly speculative

Overall confidence is weighted average based on quantity and importance of extracted entities.

## Testing

```bash
# Unit tests
npm test entity-extractor.service.spec.ts

# Integration tests (requires API key)
npm test -- --testPathPattern=entity-extractor --runInBand
```

## Examples

See `entity-extractor.example.ts` for complete usage examples.

## Future Enhancements

- [ ] Support for additional languages (French, Spanish, Italian)
- [ ] Custom entity types per organization
- [ ] Learning from user corrections
- [ ] Relationship detection between entities
- [ ] Document attachment analysis integration
- [ ] Real-time extraction during email sync

## License

Private - Operate Project
