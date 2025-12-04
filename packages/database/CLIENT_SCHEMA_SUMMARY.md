# Client/CRM Prisma Schema Summary

## Overview
Comprehensive Client/Customer Relationship Management (CRM) schema for Operate/CoachOS platform. Supports multi-tenant organizations with robust client tracking, contact management, address management, communication logging, and payment tracking.

---

## Schema Models

### 1. **Client Model** (Enhanced)
**Location:** `schema.prisma` lines 2923-3026

**Total Fields:** 43

#### Core Fields (10)
- `id` - UUID primary key
- `orgId` - Foreign key to Organisation (multi-tenant)
- `clientNumber` - Unique auto-generated identifier per org (e.g., CLT-001, CLT-002)
- `type` - Enum: INDIVIDUAL | COMPANY
- `status` - Enum: ACTIVE | INACTIVE | PROSPECT | CHURNED
- `name` - Main display name
- `displayName` - Custom display name (optional)
- `legalName` - Legal entity name for contracts
- `companyName` - Company name (for COMPANY type)
- `vatId` - VAT/Tax ID (e.g., VAT, GSTIN, EIN, TIN)

#### Contact Information (5)
- `taxId` - Additional tax identifier
- `registrationNumber` - Company registration number
- `email` - Primary email
- `phone` - Primary phone
- `website` - Company website

#### Legacy Address Fields (10)
*Kept for backward compatibility - migrate to ClientAddress model*
- `street`, `city`, `postalCode`, `state`, `countryCode`
- `billingStreet`, `billingCity`, `billingPostalCode`, `billingState`, `billingCountryCode`

#### Financial Settings (4)
- `currency` - Default currency (ISO 4217 code, default: EUR)
- `paymentTerms` - Default payment terms in days
- `creditLimit` - Credit limit (Decimal 12,2)
- `defaultPaymentTerms` - Explicit alias for paymentTerms

#### Risk Assessment (3)
- `riskLevel` - Enum: LOW | MEDIUM | HIGH | CRITICAL
- `riskScore` - Calculated risk score (Decimal 5,2)
- `lastRiskAssessment` - Timestamp of last assessment

#### Calculated Metrics (6)
- `totalRevenue` - Sum of all paid invoices (Decimal 12,2)
- `totalInvoices` - Count of all invoices
- `totalPaidInvoices` - Count of paid invoices
- `averagePaymentDays` - Average days to payment (Decimal 5,1)
- `lastInvoiceDate` - Date of most recent invoice
- `lastPaymentDate` - Date of most recent payment

#### Notes & Tags (3)
- `notes` - Public-facing notes
- `internalNotes` - Internal team notes
- `tags` - String array for categorization

#### Preferences (2)
- `language` - ISO 639-1 language code (default: en)
- `timezone` - IANA timezone (default: Europe/Berlin)

#### Flags (2)
- `isActive` - Active status (default: true)
- `isVip` - VIP client flag (default: false)

#### Metadata (2)
- `metadata` - JSON field for custom data
- `source` - Source of client (manual, import, integration)

#### Timestamps (3)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `deletedAt` - Soft delete timestamp (nullable)

#### Relations (6)
- `organisation` → Organisation (CASCADE delete)
- `contacts` → ClientContact[] (one-to-many)
- `addresses` → ClientAddress[] (one-to-many)
- `communications` → ClientCommunication[] (one-to-many)
- `payments` → ClientPayment[] (one-to-many)
- `invoices` → Invoice[] (one-to-many)

#### Indexes (13)
- `@@unique([orgId, clientNumber])` - Ensure unique client numbers per org
- `@@unique([orgId, email])` - Unique email per org
- `@@index([orgId])` - Multi-tenant queries
- `@@index([clientNumber])` - Quick lookup by client number
- `@@index([status])` - Filter by status
- `@@index([type])` - Filter by type
- `@@index([name])` - Search by name
- `@@index([email])` - Search by email
- `@@index([vatId])` - Tax ID lookup
- `@@index([taxId])` - Alternative tax ID lookup
- `@@index([riskLevel])` - Risk-based queries
- `@@index([isActive])` - Active clients filter
- `@@index([isVip])` - VIP clients filter
- `@@index([deletedAt])` - Soft delete queries

---

### 2. **ClientAddress Model** (NEW)
**Location:** `schema.prisma` lines 3028-3054

**Total Fields:** 11

#### Core Fields (3)
- `id` - UUID primary key
- `clientId` - Foreign key to Client
- `type` - Enum: BILLING | SHIPPING | REGISTERED | OTHER

#### Address Fields (6)
- `street` - Main street address
- `street2` - Additional address line (apartment, suite, etc.)
- `city` - City name
- `state` - State/Region/Province
- `postalCode` - Postal/ZIP code
- `country` - ISO 3166-1 alpha-2 country code

#### Flags (1)
- `isPrimary` - Primary address flag

#### Timestamps (2)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### Relations (1)
- `client` → Client (CASCADE delete)

#### Indexes (3)
- `@@index([clientId])` - Client lookup
- `@@index([type])` - Address type filter
- `@@index([isPrimary])` - Primary address queries

---

### 3. **ClientContact Model** (Enhanced)
**Location:** `schema.prisma` lines 3056-3092

**Total Fields:** 16

#### Core Fields (2)
- `id` - UUID primary key
- `clientId` - Foreign key to Client

#### Contact Information (6)
- `firstName` - First name
- `lastName` - Last name
- `fullName` - Full name (computed or manually set)
- `email` - Email address
- `phone` - Phone number
- `mobile` - Mobile number

#### Position Information (3)
- `position` - Job title/position
- `jobTitle` - Alias for position (backward compatibility)
- `department` - Department name

#### Flags (3)
- `isPrimary` - Primary contact flag
- `isActive` - Active status
- `isBilling` - Billing contact flag

#### Notes (1)
- `notes` - Contact-specific notes

#### Timestamps (2)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### Relations (1)
- `client` → Client (CASCADE delete)

#### Indexes (4)
- `@@index([clientId])` - Client lookup
- `@@index([email])` - Email search
- `@@index([isPrimary])` - Primary contact queries
- `@@index([isActive])` - Active contacts filter

---

### 4. **ClientCommunication Model** (Existing)
**Purpose:** Activity log / ClientNote functionality

**Location:** `schema.prisma` lines 3094-3146

**Total Fields:** 15

#### Core Fields (3)
- `id` - UUID primary key
- `clientId` - Foreign key to Client
- `userId` - User who logged the communication

#### Communication Details (5)
- `type` - Enum: CALL | EMAIL | PHONE | MEETING | NOTE | CHAT | OTHER
- `direction` - Enum: INBOUND | OUTBOUND | INTERNAL
- `subject` - Communication subject
- `content` - Full content/notes
- `summary` - Brief summary

#### References (2)
- `relatedEntityType` - Related entity (invoice, payment, etc.)
- `relatedEntityId` - Related entity ID

#### Email Specific (2)
- `emailMessageId` - Email message ID
- `emailThreadId` - Email thread ID

#### Metadata (1)
- `metadata` - JSON field for additional data

#### Timestamps (3)
- `occurredAt` - When the communication occurred
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### Relations (1)
- `client` → Client (CASCADE delete)

#### Indexes (3)
- `@@index([clientId])` - Client lookup
- `@@index([type])` - Communication type filter
- `@@index([occurredAt])` - Date-based queries

---

### 5. **ClientPayment Model** (Existing)
**Location:** `schema.prisma` lines 3148-3193

**Total Fields:** 15

#### Core Fields (2)
- `id` - UUID primary key
- `clientId` - Foreign key to Client

#### Payment Details (3)
- `amount` - Payment amount (Decimal 12,2)
- `currency` - Currency code (default: EUR)
- `status` - Enum: PENDING | COMPLETED | FAILED | REFUNDED | CANCELLED

#### Reference Fields (3)
- `invoiceId` - Related invoice ID
- `invoiceNumber` - Invoice number reference
- `reference` - Payment reference

#### Method & Transaction (2)
- `paymentMethod` - Payment method (bank_transfer, credit_card, etc.)
- `transactionId` - External transaction ID

#### Dates (3)
- `dueDate` - Payment due date
- `paidAt` - When payment was received
- `processedAt` - When payment was processed

#### Notes (1)
- `notes` - Payment notes

#### Timestamps (2)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### Relations (1)
- `client` → Client (CASCADE delete)

#### Indexes (4)
- `@@index([clientId])` - Client lookup
- `@@index([status])` - Status filter
- `@@index([invoiceId])` - Invoice lookup
- `@@index([paidAt])` - Payment date queries

---

## Enums

### ClientStatus
```prisma
enum ClientStatus {
  ACTIVE      // Current customer
  INACTIVE    // Temporarily inactive
  PROSPECT    // Potential customer
  CHURNED     // Lost customer
}
```

### ClientType
```prisma
enum ClientType {
  INDIVIDUAL  // Person/freelancer
  COMPANY     // Business entity
}
```

### RiskLevel
```prisma
enum RiskLevel {
  LOW         // Low risk
  MEDIUM      // Medium risk
  HIGH        // High risk
  CRITICAL    // Critical risk
}
```

### AddressType (NEW)
```prisma
enum AddressType {
  BILLING     // Billing address
  SHIPPING    // Shipping/delivery address
  REGISTERED  // Registered office address
  OTHER       // Other address type
}
```

### CommunicationType (Enhanced)
```prisma
enum CommunicationType {
  CALL        // Phone call (new)
  EMAIL       // Email communication
  PHONE       // Alias for CALL (backward compatibility)
  MEETING     // In-person or virtual meeting
  NOTE        // General note
  CHAT        // Chat message
  OTHER       // Other communication type
}
```

### CommunicationDirection
```prisma
enum CommunicationDirection {
  INBOUND     // From client to us
  OUTBOUND    // From us to client
  INTERNAL    // Internal team note
}
```

### PaymentStatus
```prisma
enum PaymentStatus {
  PENDING     // Awaiting payment
  COMPLETED   // Payment received
  FAILED      // Payment failed
  REFUNDED    // Payment refunded
  CANCELLED   // Payment cancelled
}
```

---

## Relations to Other Models

### Organisation → Client
**Type:** One-to-many
**Cascade:** Delete clients when organisation is deleted
**Index:** `orgId` indexed for multi-tenant queries

### Invoice → Client
**Type:** Many-to-one
**Field:** `clientId` (optional, nullable)
**Index:** `clientId` indexed
**Note:** Backward compatible with existing `customerId` field

---

## Migration Notes

### Schema Changes Summary
1. **Added to Client model:**
   - `clientNumber` field (unique per org)
   - `legalName` field
   - `language` and `timezone` fields
   - `isVip` flag
   - `defaultPaymentTerms` alias
   - `deletedAt` soft delete field
   - Organisation relation
   - Invoice relation
   - ClientAddress relation

2. **New model:** ClientAddress
   - Separate address management
   - Multiple addresses per client
   - Address types (billing, shipping, registered, other)

3. **Enhanced ClientContact:**
   - Added `fullName` field
   - Added `position` field

4. **Enhanced CommunicationType enum:**
   - Added CALL type

5. **Updated Invoice model:**
   - Added `clientId` field
   - Added Client relation
   - Added index on `clientId`

### Backward Compatibility
- Legacy address fields preserved in Client model
- `customerId` in Invoice model still functional
- Existing enums unchanged (only additions)

---

## Seed Data

### Seed File Location
`packages/database/prisma/seeds/clients.seed.ts`

### Sample Data Created
- **5 Clients** with varying profiles:
  1. TechCorp Solutions GmbH (VIP, Company, Germany)
  2. Design Studio Berlin (Company, Germany)
  3. Hans Schneider (Individual, Freelancer, Germany)
  4. Future Industries AG (Prospect, Switzerland)
  5. Alpine Solutions GmbH (Company, Austria)

- **6+ Contacts** across all clients
- **6+ Addresses** (billing, registered, shipping)
- Various client types, statuses, and configurations

### Running Seeds
```bash
cd packages/database
npm run db:seed
```

---

## Performance Optimizations

### Indexes Summary
**Total Indexes:** 31 across all CRM models

1. **Client model:** 13 indexes
2. **ClientAddress model:** 3 indexes
3. **ClientContact model:** 4 indexes
4. **ClientCommunication model:** 3 indexes
5. **ClientPayment model:** 4 indexes
6. **Invoice model:** 1 new index (clientId)
7. **Organisation model:** 1 new relation

### Query Optimization Strategies
- Multi-tenant isolation via `orgId` index
- Fast client lookup via `clientNumber` index
- Email-based search via `email` index
- Tax ID lookups via `vatId` and `taxId` indexes
- Status and type filtering
- Soft delete queries via `deletedAt` index
- VIP client filtering via `isVip` index

---

## Field Count Summary

| Model | Total Fields | Relations | Indexes |
|-------|--------------|-----------|---------|
| Client | 43 | 6 | 13 |
| ClientAddress | 11 | 1 | 3 |
| ClientContact | 16 | 1 | 4 |
| ClientCommunication | 15 | 1 | 3 |
| ClientPayment | 15 | 1 | 4 |
| **TOTAL** | **100** | **10** | **27** |

---

## Implementation Checklist

- [x] Client model enhanced with all required fields
- [x] ClientAddress model created
- [x] ClientContact model enhanced
- [x] ClientCommunication model (existing)
- [x] ClientPayment model (existing)
- [x] AddressType enum created
- [x] CommunicationType enum enhanced
- [x] Organisation → Client relation added
- [x] Invoice → Client relation added
- [x] All indexes created
- [x] Soft delete support added
- [x] Multi-tenant support via orgId
- [x] Seed file created with sample data
- [x] Backward compatibility maintained

---

## Next Steps

1. **Generate Prisma Client:**
   ```bash
   cd packages/database
   npx prisma generate
   ```

2. **Create Migration:**
   ```bash
   npx prisma migrate dev --name add-crm-enhancements
   ```

3. **Run Seeds:**
   ```bash
   npm run db:seed
   ```

4. **Update API Layer:**
   - Create ClientService
   - Add CRUD endpoints
   - Implement client number auto-generation
   - Add soft delete middleware
   - Create DTOs for all models

5. **Frontend Integration:**
   - Client list view
   - Client detail view
   - Contact management UI
   - Address management UI
   - Communication log UI

---

## Technical Notes

### Auto-generated Client Numbers
Implement in service layer:
```typescript
async generateClientNumber(orgId: string): Promise<string> {
  const count = await prisma.client.count({ where: { orgId } });
  return `CLT-${String(count + 1).padStart(3, '0')}`;
}
```

### Soft Delete Implementation
```typescript
// Middleware or service method
async softDelete(id: string) {
  return prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}
```

### Risk Score Calculation
Implement periodic job to calculate:
- Payment history
- Credit utilization
- Invoice aging
- Dispute frequency

---

**Document Version:** 1.0
**Last Updated:** 2025-12-03
**Author:** VAULT Agent (Database Specialist)
