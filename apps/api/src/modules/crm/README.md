# CRM Module

The CRM (Customer Relationship Management) module provides comprehensive client management functionality for the Operate/CoachOS platform.

## Architecture

### Files Created

1. **crm.module.ts** - NestJS module configuration
2. **crm.repository.ts** - Prisma database access layer
3. **clients.controller.ts** - Client management endpoints
4. **clients.service.ts** - Client business logic
5. **contacts.controller.ts** - Contact management endpoints
6. **contacts.service.ts** - Contact management logic
7. **communications.controller.ts** - Communication tracking endpoints
8. **communications.service.ts** - Communication tracking logic
9. **dto/index.ts** - Data Transfer Objects and validation

## Data Model

### Client

The main entity for managing customers and prospects.

**Schema:** `Client` from Prisma

**Fields:**
- `id` - Unique identifier
- `orgId` - Organization reference
- `type` - INDIVIDUAL or COMPANY
- `status` - ACTIVE, INACTIVE, PROSPECT, CHURNED
- `name` - Client name
- `displayName` - Optional display name
- `companyName` - Company name (for COMPANY type)
- `vatId`, `taxId`, `registrationNumber` - Tax identifiers
- `email`, `phone`, `website` - Contact information
- `street`, `city`, `postalCode`, `state`, `countryCode` - Primary address
- `billingStreet`, `billingCity`, etc. - Billing address (if different)
- `currency` - Default currency (default: EUR)
- `paymentTerms` - Payment terms in days (default: 30)
- `creditLimit` - Optional credit limit
- `riskLevel` - LOW, MEDIUM, HIGH, CRITICAL
- `riskScore` - Calculated risk score
- `totalRevenue` - Calculated total revenue from payments
- `totalInvoices` - Count of invoices
- `totalPaidInvoices` - Count of paid invoices
- `averagePaymentDays` - Average days to payment
- `lastInvoiceDate`, `lastPaymentDate` - Activity tracking
- `notes`, `internalNotes` - Notes
- `tags` - String array for categorization
- `metadata` - JSON for additional data
- `source` - manual, import, integration

### ClientContact

Contact persons associated with a client.

**Schema:** `ClientContact` from Prisma

**Fields:**
- `id` - Unique identifier
- `clientId` - Reference to Client
- `firstName`, `lastName` - Contact name
- `email`, `phone`, `mobile` - Contact details
- `jobTitle`, `department` - Position information
- `isPrimary` - Primary contact flag (only one per client)
- `isActive` - Active status
- `isBilling` - Billing contact flag
- `notes` - Additional notes

### ClientCommunication

Communication history with clients.

**Schema:** `ClientCommunication` from Prisma

**Fields:**
- `id` - Unique identifier
- `clientId` - Reference to Client
- `userId` - User who logged the communication
- `type` - EMAIL, PHONE, MEETING, NOTE, CHAT, OTHER
- `direction` - INBOUND, OUTBOUND, INTERNAL
- `subject` - Optional subject
- `content` - Communication content
- `summary` - Optional summary
- `relatedEntityType`, `relatedEntityId` - Link to related entities
- `emailMessageId`, `emailThreadId` - Email tracking
- `occurredAt` - When the communication occurred
- `metadata` - JSON for additional data

### ClientPayment

Payment tracking (referenced but not managed by this module).

**Schema:** `ClientPayment` from Prisma

Used for calculating client metrics:
- `totalRevenue`
- `totalPaidInvoices`
- `averagePaymentDays`
- `lastPaymentDate`

## API Endpoints

### Client Endpoints

**Base URL:** `/clients`

#### Create Client
```
POST /clients
Body: CreateClientDto
Response: ClientResponseDto
```

#### List Clients
```
GET /clients?status=ACTIVE&type=COMPANY&search=acme&page=1&pageSize=50
Query Parameters:
  - status?: ClientStatus
  - type?: ClientType
  - riskLevel?: RiskLevel
  - search?: string (searches name, email, phone, VAT ID)
  - page?: number (default: 1)
  - pageSize?: number (default: 50, max: 100)
Response: { clients: ClientResponseDto[], total: number, page: number, pageSize: number }
```

#### Get Client Details
```
GET /clients/:id
Response: ClientResponseDto (includes contacts, recent communications, payments)
```

#### Update Client
```
PUT /clients/:id
Body: UpdateClientDto
Response: ClientResponseDto
```

#### Archive Client
```
DELETE /clients/:id
Response: ClientResponseDto (status changed to CHURNED)
```

#### Get Client Statistics
```
GET /clients/stats
Response: {
  totalClients: number,
  activeClients: number,
  prospectClients: number,
  highRiskClients: number,
  recentCommunications: number
}
```

#### Get Top Clients by Revenue
```
GET /clients/top-revenue?limit=10
Response: ClientResponseDto[]
```

#### Get Clients Requiring Attention
```
GET /clients/requiring-attention
Response: ClientResponseDto[] (high risk or no recent communication)
```

#### Update Client Metrics
```
POST /clients/:id/update-metrics
Response: ClientResponseDto (with updated metrics)
```

#### Assess Client Risk
```
POST /clients/:id/assess-risk
Response: { riskLevel: RiskLevel, riskScore: number }
```

### Contact Endpoints

**Base URL:** `/clients/:clientId/contacts`

#### Add Contact
```
POST /clients/:clientId/contacts
Body: CreateContactDto
Response: ContactResponseDto
```

#### List Contacts
```
GET /clients/:clientId/contacts
Response: ContactResponseDto[]
```

#### Get Contact
```
GET /clients/:clientId/contacts/:id
Response: ContactResponseDto
```

#### Update Contact
```
PUT /clients/:clientId/contacts/:id
Body: UpdateContactDto
Response: ContactResponseDto
```

#### Remove Contact
```
DELETE /clients/:clientId/contacts/:id
Response: ContactResponseDto (isActive set to false)
```

#### Set Primary Contact
```
POST /clients/:clientId/contacts/:id/set-primary
Response: ContactResponseDto
```

### Communication Endpoints

**Base URL:** `/clients/:clientId/communications`

#### Log Communication
```
POST /clients/:clientId/communications
Body: LogCommunicationDto
Response: CommunicationResponseDto
```

#### Get Communication History
```
GET /clients/:clientId/communications?type=EMAIL&page=1&pageSize=50
Query Parameters:
  - type?: CommunicationType
  - direction?: CommunicationDirection
  - page?: number (default: 1)
  - pageSize?: number (default: 50, max: 100)
Response: { communications: CommunicationResponseDto[], total: number, page: number, pageSize: number }
```

#### Get Recent Activity
```
GET /clients/:clientId/communications/recent-activity?days=30
Response: {
  communications: CommunicationResponseDto[],
  total: number,
  days: number
}
```

#### Get Communication
```
GET /clients/:clientId/communications/:id
Response: CommunicationResponseDto
```

#### Update Communication
```
PUT /clients/:clientId/communications/:id
Body: UpdateCommunicationDto
Response: CommunicationResponseDto
```

#### Delete Communication
```
DELETE /clients/:clientId/communications/:id
Response: Success message
```

## Features

### Client Management
- Create and manage clients (individuals and companies)
- Track client status (active, inactive, prospect, churned)
- Store complete contact information and addresses
- Support for billing addresses separate from primary address
- Multi-currency support
- Configurable payment terms
- Credit limit tracking
- Tag-based categorization
- Full-text search across name, email, phone, VAT ID

### Contact Management
- Multiple contacts per client
- Primary contact designation
- Billing contact flag
- Position and department tracking
- Soft delete (isActive flag)
- Automatic primary contact management

### Communication Tracking
- Log all client interactions
- Multiple communication types (email, phone, meeting, note, chat)
- Track direction (inbound, outbound, internal)
- Link communications to other entities (invoices, payments)
- Email thread tracking
- Recent activity queries
- Communication history with pagination

### Risk Assessment
- Automated risk scoring based on:
  - Payment history
  - Average payment days
  - Invoice payment ratio
  - Recent activity
- Risk levels: LOW, MEDIUM, HIGH, CRITICAL
- Manual risk level override
- Automatic risk updates on metric changes

### Metrics & Analytics
- Real-time client statistics
- Revenue tracking per client
- Payment behavior analysis
- Top clients by revenue
- Clients requiring attention (high risk or inactive)
- Average payment days calculation
- Invoice count tracking

### Integration Points
- References `ClientPayment` for financial metrics
- Can link communications to invoices and other entities
- Supports external system integration via metadata
- Source tracking (manual, import, integration)

## Business Logic

### Client Creation
1. Validates unique email within organization
2. Sets default values (status: ACTIVE, riskLevel: LOW, currency: EUR, paymentTerms: 30)
3. Tracks creation source

### Contact Management
1. Enforces single primary contact per client
2. Prevents removal of primary contact if others exist
3. Automatic promotion when setting primary

### Communication Logging
1. Automatically timestamps communications
2. Links to user who logged it
3. Supports backdating (occurredAt field)
4. Tracks related entities

### Risk Assessment Algorithm
Risk score is calculated based on:
- **Payment Delays:**
  - >60 days: +30 points
  - 30-60 days: +15 points
  - Early payment: -10 points
- **Payment Ratio:**
  - <50% paid: +40 points
  - 50-80% paid: +20 points
- **Inactivity:**
  - No payment in >90 days: +25 points
  - No payment in >60 days: +15 points

**Risk Levels:**
- Score ≥70: CRITICAL
- Score ≥50: HIGH
- Score ≥30: MEDIUM
- Score <30: LOW

## Security

- All endpoints protected with `JwtAuthGuard`
- Organization isolation (all queries filtered by orgId)
- User context from JWT token
- Validation on all DTOs
- Soft deletes for data preservation

## Usage Example

```typescript
// Import the module
import { CrmModule } from './modules/crm/crm.module';

@Module({
  imports: [
    // ... other modules
    CrmModule,
  ],
})
export class AppModule {}
```

```typescript
// Create a client
POST /clients
{
  "type": "COMPANY",
  "name": "Acme Corporation",
  "companyName": "Acme Corp GmbH",
  "email": "contact@acme.com",
  "phone": "+49 30 12345678",
  "vatId": "DE123456789",
  "street": "Hauptstrasse 1",
  "city": "Berlin",
  "postalCode": "10115",
  "countryCode": "DE",
  "paymentTerms": 30,
  "tags": ["enterprise", "software"]
}

// Add a contact
POST /clients/{clientId}/contacts
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@acme.com",
  "jobTitle": "CFO",
  "isPrimary": true
}

// Log a communication
POST /clients/{clientId}/communications
{
  "type": "EMAIL",
  "direction": "OUTBOUND",
  "subject": "Invoice #2024-001",
  "content": "Please find attached invoice #2024-001",
  "relatedEntityType": "invoice",
  "relatedEntityId": "inv_123"
}

// Search clients
GET /clients?search=acme&status=ACTIVE

// Get top clients
GET /clients/top-revenue?limit=5

// Assess risk
POST /clients/{clientId}/assess-risk
```

## Future Enhancements

- Email integration for automatic communication logging
- Calendar integration for meeting tracking
- Document attachments to communications
- Client portal access
- Advanced segmentation and filtering
- Custom fields via metadata
- Bulk operations
- Export functionality
- Activity timeline visualization
- Integration with invoicing module
- Payment reminder automation
- Client health score dashboard
