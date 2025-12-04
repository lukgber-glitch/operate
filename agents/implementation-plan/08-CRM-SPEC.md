# Phase 4: CRM Module Specification

## Overview

Build a client relationship management system to track customers, their invoices, payments, and communication history.

---

## Database Schema

```prisma
// packages/database/prisma/schema.prisma

model Client {
  id              String        @id @default(cuid())
  organisationId  String
  organisation    Organisation  @relation(fields: [organisationId], references: [id])

  // Basic Info
  name            String
  type            ClientType    @default(COMPANY)
  email           String?
  phone           String?
  website         String?

  // Tax Info
  vatNumber       String?       // EU VAT number
  taxId           String?       // National tax ID

  // Address
  addressLine1    String?
  addressLine2    String?
  city            String?
  state           String?
  postalCode      String?
  country         String?

  // Metadata
  tags            String[]      @default([])
  notes           String?       @db.Text
  metadata        Json?

  // Status
  status          ClientStatus  @default(ACTIVE)
  source          String?       // How client was acquired

  // Relations
  contacts        ClientContact[]
  invoices        Invoice[]
  payments        Payment[]
  communications  Communication[]

  // Audit
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([organisationId])
  @@index([status])
  @@index([name])
}

model ClientContact {
  id              String    @id @default(cuid())
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])

  name            String
  role            String?
  email           String?
  phone           String?
  isPrimary       Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([clientId])
}

model Payment {
  id              String        @id @default(cuid())
  organisationId  String
  organisation    Organisation  @relation(fields: [organisationId], references: [id])

  clientId        String
  client          Client        @relation(fields: [clientId], references: [id])

  invoiceId       String?
  invoice         Invoice?      @relation(fields: [invoiceId], references: [id])

  amount          Decimal       @db.Decimal(15, 2)
  currency        String        @default("EUR")
  method          PaymentMethod
  reference       String?       // Bank reference, transaction ID, etc.
  notes           String?

  paidAt          DateTime
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([organisationId])
  @@index([clientId])
  @@index([invoiceId])
}

model Communication {
  id              String            @id @default(cuid())
  organisationId  String
  organisation    Organisation      @relation(fields: [organisationId], references: [id])

  clientId        String
  client          Client            @relation(fields: [clientId], references: [id])

  type            CommunicationType
  direction       CommunicationDirection
  subject         String?
  content         String            @db.Text
  metadata        Json?             // Email headers, call duration, etc.

  // Related entities
  invoiceId       String?
  invoice         Invoice?          @relation(fields: [invoiceId], references: [id])

  // Status
  status          CommunicationStatus @default(SENT)
  sentAt          DateTime?
  readAt          DateTime?

  createdBy       String
  createdAt       DateTime          @default(now())

  @@index([organisationId])
  @@index([clientId])
}

enum ClientType {
  INDIVIDUAL
  COMPANY
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum PaymentMethod {
  BANK_TRANSFER
  CREDIT_CARD
  DEBIT_CARD
  CASH
  CHECK
  PAYPAL
  STRIPE
  OTHER
}

enum CommunicationType {
  EMAIL
  PHONE
  MEETING
  NOTE
  INVOICE_SENT
  REMINDER_SENT
}

enum CommunicationDirection {
  INBOUND
  OUTBOUND
}

enum CommunicationStatus {
  DRAFT
  SENT
  DELIVERED
  READ
  FAILED
}
```

---

## API Endpoints

### Clients Controller

```typescript
// apps/api/src/crm/clients.controller.ts

@Controller('clients')
export class ClientsController {

  // List clients with filtering
  @Get()
  @Roles(Role.MEMBER)
  async listClients(
    @CurrentOrg() orgId: string,
    @Query() query: ClientQuery
  ): Promise<PaginatedResponse<Client>>

  // Get client by ID
  @Get(':id')
  @Roles(Role.MEMBER)
  async getClient(
    @CurrentOrg() orgId: string,
    @Param('id') clientId: string
  ): Promise<ClientWithDetails>

  // Create client
  @Post()
  @Roles(Role.MEMBER)
  async createClient(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateClientDto
  ): Promise<Client>

  // Update client
  @Patch(':id')
  @Roles(Role.MEMBER)
  async updateClient(
    @Param('id') clientId: string,
    @Body() dto: UpdateClientDto
  ): Promise<Client>

  // Delete client (soft)
  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteClient(
    @Param('id') clientId: string
  ): Promise<void>

  // Get client insights
  @Get(':id/insights')
  @Roles(Role.MEMBER)
  async getClientInsights(
    @Param('id') clientId: string
  ): Promise<ClientInsights>

  // Get client invoices
  @Get(':id/invoices')
  @Roles(Role.MEMBER)
  async getClientInvoices(
    @Param('id') clientId: string,
    @Query() query: PaginationQuery
  ): Promise<PaginatedResponse<Invoice>>

  // Get client payments
  @Get(':id/payments')
  @Roles(Role.MEMBER)
  async getClientPayments(
    @Param('id') clientId: string,
    @Query() query: PaginationQuery
  ): Promise<PaginatedResponse<Payment>>

  // Get client communications
  @Get(':id/communications')
  @Roles(Role.MEMBER)
  async getClientCommunications(
    @Param('id') clientId: string,
    @Query() query: PaginationQuery
  ): Promise<PaginatedResponse<Communication>>

  // Add communication
  @Post(':id/communications')
  @Roles(Role.MEMBER)
  async addCommunication(
    @Param('id') clientId: string,
    @CurrentUser() userId: string,
    @Body() dto: CreateCommunicationDto
  ): Promise<Communication>

  // Send reminder
  @Post(':id/remind')
  @Roles(Role.MEMBER)
  async sendReminder(
    @Param('id') clientId: string,
    @CurrentUser() userId: string,
    @Body() dto: SendReminderDto
  ): Promise<Communication>
}
```

### Contacts Controller

```typescript
// apps/api/src/crm/contacts.controller.ts

@Controller('clients/:clientId/contacts')
export class ContactsController {

  @Get()
  async listContacts(
    @Param('clientId') clientId: string
  ): Promise<ClientContact[]>

  @Post()
  async createContact(
    @Param('clientId') clientId: string,
    @Body() dto: CreateContactDto
  ): Promise<ClientContact>

  @Patch(':contactId')
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto
  ): Promise<ClientContact>

  @Delete(':contactId')
  async deleteContact(
    @Param('contactId') contactId: string
  ): Promise<void>

  @Post(':contactId/set-primary')
  async setPrimaryContact(
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string
  ): Promise<void>
}
```

---

## Services

### Client Insights Service

```typescript
// apps/api/src/crm/insights.service.ts

@Injectable()
export class ClientInsightsService {

  async getClientInsights(clientId: string): Promise<ClientInsights> {
    const client = await this.getClientWithRelations(clientId);

    // Calculate metrics
    const totalRevenue = this.calculateTotalRevenue(client.invoices);
    const totalPaid = this.calculateTotalPaid(client.payments);
    const outstandingAmount = totalRevenue - totalPaid;

    const paidInvoices = client.invoices.filter(i => i.status === 'PAID');
    const avgPaymentTime = this.calculateAveragePaymentTime(paidInvoices);

    const lastInvoice = client.invoices[0];
    const lastPayment = client.payments[0];
    const lastCommunication = client.communications[0];

    // Risk assessment
    const riskScore = this.calculateRiskScore({
      outstandingAmount,
      avgPaymentTime,
      overdueInvoices: client.invoices.filter(i => i.status === 'OVERDUE').length,
      totalInvoices: client.invoices.length,
    });

    return {
      totalRevenue,
      totalPaid,
      outstandingAmount,
      avgPaymentTime,
      invoiceCount: client.invoices.length,
      paymentCount: client.payments.length,
      lastInvoiceDate: lastInvoice?.createdAt,
      lastPaymentDate: lastPayment?.paidAt,
      lastContactDate: lastCommunication?.createdAt,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
    };
  }

  private calculateRiskScore(data: RiskData): number {
    let score = 50; // Start at neutral

    // Outstanding amount impact
    if (data.outstandingAmount > 0) {
      score += Math.min(data.outstandingAmount / 1000, 20);
    }

    // Average payment time impact
    if (data.avgPaymentTime > 30) {
      score += (data.avgPaymentTime - 30) / 2;
    } else if (data.avgPaymentTime < 14) {
      score -= 10;
    }

    // Overdue invoices impact
    if (data.overdueInvoices > 0) {
      score += data.overdueInvoices * 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score < 30) return 'LOW';
    if (score < 60) return 'MEDIUM';
    return 'HIGH';
  }
}
```

---

## Frontend Components

### Client List Page

```typescript
// apps/web/src/app/(dashboard)/clients/page.tsx

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your customers and their relationships
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients?.map(client => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}
```

### Client Card Component

```typescript
// apps/web/src/components/crm/client-card.tsx

export function ClientCard({ client }: { client: ClientWithInsights }) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>
            <RiskBadge level={client.insights?.riskLevel} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="font-semibold">€{formatNumber(client.insights?.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Outstanding</p>
              <p className={cn(
                'font-semibold',
                client.insights?.outstandingAmount > 0 && 'text-amber-600'
              )}>
                €{formatNumber(client.insights?.outstandingAmount)}
              </p>
            </div>
          </div>

          {client.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {client.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {client.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{client.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Client Profile Page

```typescript
// apps/web/src/app/(dashboard)/clients/[id]/page.tsx

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const { data: client } = useClient(params.id);
  const { data: insights } = useClientInsights(params.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(client?.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{client?.name}</h1>
            <p className="text-muted-foreground">{client?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={client?.status} />
              <RiskBadge level={insights?.riskLevel} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MailIcon className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button>
            <FileTextIcon className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Client</DropdownMenuItem>
              <DropdownMenuItem>Add Contact</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InsightCard
          title="Total Revenue"
          value={`€${formatNumber(insights?.totalRevenue)}`}
          icon={TrendingUpIcon}
        />
        <InsightCard
          title="Outstanding"
          value={`€${formatNumber(insights?.outstandingAmount)}`}
          icon={ClockIcon}
          variant={insights?.outstandingAmount > 0 ? 'warning' : 'default'}
        />
        <InsightCard
          title="Avg. Payment Time"
          value={`${insights?.avgPaymentTime || 0} days`}
          icon={CalendarIcon}
        />
        <InsightCard
          title="Invoices"
          value={insights?.invoiceCount || 0}
          icon={FileTextIcon}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ClientDetailsCard client={client} />
              <RecentActivityCard clientId={params.id} />
            </div>
            <div className="space-y-6">
              <ContactsCard contacts={client?.contacts} />
              <NotesCard notes={client?.notes} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <ClientInvoicesTable clientId={params.id} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <ClientPaymentsTable clientId={params.id} />
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <CommunicationsTimeline clientId={params.id} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <ContactsTable clientId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Communication Timeline

```typescript
// apps/web/src/components/crm/communications-timeline.tsx

export function CommunicationsTimeline({ clientId }: { clientId: string }) {
  const { data: communications } = useClientCommunications(clientId);

  const iconMap = {
    EMAIL: MailIcon,
    PHONE: PhoneIcon,
    MEETING: CalendarIcon,
    NOTE: StickyNoteIcon,
    INVOICE_SENT: FileTextIcon,
    REMINDER_SENT: BellIcon,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Communication History</h3>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      <div className="space-y-4">
        {communications?.map((comm, index) => {
          const Icon = iconMap[comm.type] || MessageSquareIcon;

          return (
            <div key={comm.id} className="flex gap-4">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-slate-600" />
                </div>
                {index < communications.length - 1 && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full bg-slate-200" />
                )}
              </div>

              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{comm.type}</Badge>
                        <Badge variant={comm.direction === 'OUTBOUND' ? 'default' : 'secondary'}>
                          {comm.direction}
                        </Badge>
                      </div>
                      {comm.subject && (
                        <p className="font-medium mt-2">{comm.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {comm.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comm.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Integration with Invoices

### Update Invoice Model

```prisma
// Add to existing Invoice model
model Invoice {
  // ... existing fields

  clientId        String?
  client          Client?       @relation(fields: [clientId], references: [id])

  // Update customer fields to reference client
  // Keep customerName, customerEmail, etc. for non-client invoices
}
```

### Invoice Creation from Client

```typescript
// Quick invoice creation from client page
async function createInvoiceForClient(clientId: string) {
  const client = await getClient(clientId);

  return {
    clientId: client.id,
    customerName: client.name,
    customerEmail: client.email,
    customerAddress: formatAddress(client),
    vatNumber: client.vatNumber,
  };
}
```

---

## Success Criteria

- [ ] Client list loads in < 500ms
- [ ] Client insights calculate correctly
- [ ] Risk assessment is meaningful
- [ ] Communication timeline is chronological
- [ ] Integration with invoices is seamless
- [ ] Search finds clients by name, email, VAT number
- [ ] Tags allow for easy filtering
- [ ] Export functionality works (CSV)
