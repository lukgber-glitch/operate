# Phase 2: AI Chatbot Specification

## Overview

Build an AI-powered conversational assistant that helps users manage their business through natural language. The chatbot is context-aware, proactive, and capable of executing actions.

---

## Core Features

### 1. Conversational Interface
- Natural language understanding
- Multi-turn conversations with memory
- Context awareness (current page, recent actions)
- Markdown formatting in responses
- Code blocks for data display

### 2. Proactive Suggestions
- Daily insights digest
- Anomaly detection alerts
- Deadline reminders
- Opportunity identification
- Risk warnings

### 3. Action Execution
- Generate reports
- Create invoices
- Send reminders
- Schedule tasks
- File tax returns (with confirmation)

---

## Database Schema

```prisma
model Conversation {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  organisationId  String
  organisation    Organisation @relation(fields: [organisationId], references: [id])

  title           String?     // AI-generated summary
  status          ConversationStatus @default(ACTIVE)

  messages        Message[]
  context         Json?       // Stored context for continuity

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  closedAt        DateTime?

  @@index([userId])
  @@index([organisationId])
}

model Message {
  id              String      @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])

  role            MessageRole
  content         String      @db.Text

  // For assistant messages
  model           String?     // claude-3-5-sonnet, gpt-4, etc.
  tokensUsed      Int?

  // For action messages
  actionType      ActionType?
  actionData      Json?
  actionStatus    ActionStatus?

  // Metadata
  metadata        Json?       // Page context, referenced entities, etc.

  createdAt       DateTime    @default(now())

  @@index([conversationId])
}

model Suggestion {
  id              String      @id @default(cuid())
  organisationId  String
  organisation    Organisation @relation(fields: [organisationId], references: [id])

  type            SuggestionType
  priority        Int         @default(5) // 1-10, higher = more urgent
  title           String
  description     String      @db.Text
  actionUrl       String?     // Deep link to relevant page
  actionLabel     String?     // "Review Invoice", "View Report", etc.

  // Related entities
  relatedType     String?     // "invoice", "expense", "transaction"
  relatedId       String?

  // Status
  status          SuggestionStatus @default(ACTIVE)
  dismissedAt     DateTime?
  dismissedBy     String?
  actionedAt      DateTime?

  // Scheduling
  showAfter       DateTime    @default(now())
  expiresAt       DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([organisationId])
  @@index([status])
  @@index([priority])
}

enum ConversationStatus {
  ACTIVE
  CLOSED
  ARCHIVED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  ACTION
}

enum ActionType {
  GENERATE_REPORT
  CREATE_INVOICE
  SEND_REMINDER
  CREATE_TODO
  FILE_TAX_RETURN
  NAVIGATE
  SEARCH
}

enum ActionStatus {
  PENDING
  EXECUTING
  COMPLETED
  FAILED
  CANCELLED
}

enum SuggestionType {
  INSIGHT
  DEADLINE
  ANOMALY
  OPPORTUNITY
  RISK
  ACTION_NEEDED
}

enum SuggestionStatus {
  ACTIVE
  DISMISSED
  ACTIONED
  EXPIRED
}
```

---

## API Endpoints

### Chat Controller

```typescript
// apps/api/src/chat/chat.controller.ts

@Controller('chat')
export class ChatController {

  // List conversations
  @Get('conversations')
  async listConversations(
    @CurrentUser() userId: string,
    @CurrentOrg() orgId: string,
    @Query() query: PaginationQuery
  ): Promise<PaginatedResponse<Conversation>>

  // Get single conversation with messages
  @Get('conversations/:id')
  async getConversation(
    @Param('id') conversationId: string
  ): Promise<Conversation>

  // Create new conversation
  @Post('conversations')
  async createConversation(
    @CurrentUser() userId: string,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateConversationDto
  ): Promise<Conversation>

  // Send message (with streaming response)
  @Post('conversations/:id/messages')
  @Sse()
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto
  ): Observable<MessageEvent>

  // Execute action from conversation
  @Post('conversations/:id/actions')
  async executeAction(
    @Param('id') conversationId: string,
    @Body() dto: ExecuteActionDto
  ): Promise<ActionResult>

  // Close conversation
  @Post('conversations/:id/close')
  async closeConversation(
    @Param('id') conversationId: string
  ): Promise<Conversation>
}
```

### Suggestions Controller

```typescript
// apps/api/src/suggestions/suggestions.controller.ts

@Controller('suggestions')
export class SuggestionsController {

  // Get active suggestions
  @Get()
  async getSuggestions(
    @CurrentOrg() orgId: string,
    @Query() query: SuggestionQuery
  ): Promise<Suggestion[]>

  // Get suggestion count (for badge)
  @Get('count')
  async getSuggestionCount(
    @CurrentOrg() orgId: string
  ): Promise<{ count: number; urgent: number }>

  // Dismiss suggestion
  @Post(':id/dismiss')
  async dismissSuggestion(
    @Param('id') suggestionId: string,
    @CurrentUser() userId: string
  ): Promise<void>

  // Mark as actioned
  @Post(':id/action')
  async markActioned(
    @Param('id') suggestionId: string,
    @CurrentUser() userId: string
  ): Promise<void>
}
```

---

## AI Service Architecture

### Chat Service

```typescript
// apps/api/src/chat/chat.service.ts

@Injectable()
export class ChatService {

  async processMessage(
    conversationId: string,
    userMessage: string,
    context: ChatContext
  ): AsyncIterable<StreamChunk> {

    // 1. Build system prompt with context
    const systemPrompt = await this.buildSystemPrompt(context);

    // 2. Get conversation history
    const history = await this.getConversationHistory(conversationId);

    // 3. Detect intent
    const intent = await this.detectIntent(userMessage);

    // 4. Gather relevant data based on intent
    const data = await this.gatherContextData(intent, context);

    // 5. Stream response from Claude
    const stream = await this.claude.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: this.buildUserPrompt(userMessage, data) }
      ],
    });

    // 6. Process and yield chunks
    for await (const chunk of stream) {
      yield this.processChunk(chunk);
    }

    // 7. Save assistant message
    await this.saveMessage(conversationId, stream.finalMessage);

    // 8. Extract and execute any actions
    await this.processActions(conversationId, stream.finalMessage);
  }

  private async buildSystemPrompt(context: ChatContext): Promise<string> {
    return `You are ASSIST, an AI business assistant for Operate.

CONTEXT:
- User: ${context.userName} (${context.userRole})
- Organization: ${context.orgName}
- Current Page: ${context.currentPage}
- Current Date: ${new Date().toISOString()}

CAPABILITIES:
- Answer questions about finances, taxes, invoices, expenses
- Generate reports and summaries
- Create invoices and reminders
- Explain tax rules and deductions
- Alert about deadlines and anomalies

GUIDELINES:
- Be concise and professional
- Use markdown formatting
- Provide specific numbers and dates
- Suggest next actions when appropriate
- Ask for confirmation before executing actions
- Reference specific invoices, transactions, etc. by ID

ACTIONS:
You can execute actions by including special tags:
[ACTION:GENERATE_REPORT params={"type":"tax_summary","period":"Q3"}]
[ACTION:CREATE_INVOICE params={"clientId":"xxx","items":[...]}]
[ACTION:SEND_REMINDER params={"invoiceId":"xxx"}]
[ACTION:CREATE_TODO params={"title":"...","dueDate":"..."}]
`;
  }

  private async detectIntent(message: string): Promise<Intent> {
    // Use Claude to classify intent
    const response = await this.claude.messages.create({
      model: 'claude-3-haiku-20240307', // Fast, cheap model for classification
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Classify the intent of this message: "${message}"

Options: QUESTION, ACTION_REQUEST, REPORT_REQUEST, STATUS_CHECK, GENERAL

Respond with just the intent type.`
      }]
    });

    return response.content[0].text.trim() as Intent;
  }

  private async gatherContextData(
    intent: Intent,
    context: ChatContext
  ): Promise<ContextData> {
    const data: ContextData = {};

    // Always include basic stats
    data.stats = await this.getOrganizationStats(context.orgId);

    // Include page-specific data
    if (context.currentPage.includes('invoice')) {
      data.invoices = await this.getRecentInvoices(context.orgId);
    }

    if (context.currentPage.includes('expense')) {
      data.expenses = await this.getRecentExpenses(context.orgId);
    }

    if (intent === 'REPORT_REQUEST' || intent === 'QUESTION') {
      data.transactions = await this.getTransactionSummary(context.orgId);
      data.taxInfo = await this.getTaxSummary(context.orgId);
    }

    return data;
  }
}
```

### Suggestions Service

```typescript
// apps/api/src/suggestions/suggestions.service.ts

@Injectable()
export class SuggestionsService {

  // Run daily to generate suggestions
  @Cron('0 8 * * *') // 8 AM daily
  async generateDailySuggestions(): Promise<void> {
    const orgs = await this.getActiveOrganizations();

    for (const org of orgs) {
      await this.generateSuggestionsForOrg(org.id);
    }
  }

  async generateSuggestionsForOrg(orgId: string): Promise<void> {
    // 1. Check for deadline reminders
    await this.checkDeadlines(orgId);

    // 2. Check for overdue invoices
    await this.checkOverdueInvoices(orgId);

    // 3. Check for anomalies in transactions
    await this.checkTransactionAnomalies(orgId);

    // 4. Check for optimization opportunities
    await this.checkOptimizations(orgId);

    // 5. Check for action-needed items
    await this.checkPendingActions(orgId);
  }

  private async checkDeadlines(orgId: string): Promise<void> {
    const org = await this.getOrgWithCountry(orgId);

    // VAT deadline (usually 10th of following month)
    const vatDeadline = this.getNextVatDeadline(org.country);
    const daysUntilVat = differenceInDays(vatDeadline, new Date());

    if (daysUntilVat <= 7 && daysUntilVat > 0) {
      await this.createSuggestion({
        organisationId: orgId,
        type: 'DEADLINE',
        priority: 9,
        title: 'VAT Return Due Soon',
        description: `Your VAT return is due on ${format(vatDeadline, 'MMMM d')}. Would you like me to prepare the submission?`,
        actionUrl: '/tax/vat-return',
        actionLabel: 'Prepare VAT Return',
      });
    }
  }

  private async checkOverdueInvoices(orgId: string): Promise<void> {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        organisationId: orgId,
        status: 'SENT',
        dueDate: { lt: new Date() },
      },
    });

    for (const invoice of overdueInvoices) {
      const daysOverdue = differenceInDays(new Date(), invoice.dueDate);

      if (daysOverdue >= 30) {
        await this.createSuggestion({
          organisationId: orgId,
          type: 'ACTION_NEEDED',
          priority: 8,
          title: `Invoice ${invoice.number} is ${daysOverdue} days overdue`,
          description: `${invoice.customerName} hasn't paid €${invoice.total}. Consider sending a reminder or escalating.`,
          actionUrl: `/finance/invoices/${invoice.id}`,
          actionLabel: 'View Invoice',
          relatedType: 'invoice',
          relatedId: invoice.id,
        });
      }
    }
  }

  private async checkTransactionAnomalies(orgId: string): Promise<void> {
    // Get recent transactions
    const recentTransactions = await this.getRecentTransactions(orgId, 30);

    // Calculate average and std dev
    const amounts = recentTransactions.map(t => Math.abs(t.amount));
    const avg = mean(amounts);
    const stdDev = standardDeviation(amounts);

    // Find anomalies (> 2 std devs from mean)
    for (const tx of recentTransactions) {
      const deviation = Math.abs(Math.abs(tx.amount) - avg);
      if (deviation > 2 * stdDev && Math.abs(tx.amount) > 500) {
        await this.createSuggestion({
          organisationId: orgId,
          type: 'ANOMALY',
          priority: 7,
          title: `Unusual transaction: €${Math.abs(tx.amount)}`,
          description: `A ${tx.amount > 0 ? 'credit' : 'debit'} of €${Math.abs(tx.amount)} from ${tx.counterpartyName} is significantly different from your usual transactions.`,
          actionUrl: `/finance/banking/transactions/${tx.id}`,
          actionLabel: 'Review Transaction',
          relatedType: 'transaction',
          relatedId: tx.id,
        });
      }
    }
  }
}
```

---

## Frontend Components

### Chat Interface

```typescript
// apps/web/src/components/chat/chat-panel.tsx

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Stream response
    const response = await fetch('/api/chat/conversations/current/messages', {
      method: 'POST',
      body: JSON.stringify({
        content: userMessage,
        context: {
          currentPage: window.location.pathname,
        },
      }),
    });

    const reader = response.body.getReader();
    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      assistantMessage += text;
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx].role === 'assistant') {
          updated[lastIdx].content = assistantMessage;
        } else {
          updated.push({ role: 'assistant', content: assistantMessage });
        }
        return updated;
      });
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 flex items-center justify-center"
      >
        <MessageSquareIcon className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <BotIcon className="h-5 w-5 text-primary" />
                <span className="font-semibold">ASSIST</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.map((message, i) => (
                <ChatMessage key={i} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }}>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask anything about your business..."
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading}>
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### AI Insights Card

```typescript
// apps/web/src/components/dashboard/ai-insights-card.tsx

export function AIInsightsCard() {
  const { data: suggestions } = useSuggestions();
  const { data: user } = useCurrentUser();

  const greeting = getTimeBasedGreeting();
  const urgentCount = suggestions?.filter(s => s.priority >= 8).length ?? 0;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {greeting}, {user?.firstName}!
              </h3>
              {urgentCount > 0 ? (
                <p className="text-muted-foreground mt-1">
                  You have {urgentCount} item{urgentCount > 1 ? 's' : ''} that need your attention today.
                </p>
              ) : (
                <p className="text-muted-foreground mt-1">
                  Everything looks good! Here are some insights about your business.
                </p>
              )}

              {suggestions && suggestions.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {suggestions.slice(0, 3).map(suggestion => (
                    <li key={suggestion.id} className="flex items-center gap-2">
                      <SuggestionIcon type={suggestion.type} />
                      <span className="text-sm">{suggestion.title}</span>
                      {suggestion.actionUrl && (
                        <Link href={suggestion.actionUrl} className="text-xs text-primary hover:underline">
                          {suggestion.actionLabel || 'View'}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View All
            </Button>
            <Button variant="ghost" size="sm">
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Sample Conversations

### Financial Query
```
User: What's my tax situation this quarter?

ASSIST: Based on your Q4 data (Oct-Dec 2024):

**Revenue**: €45,230
**Expenses**: €18,450
**Profit**: €26,780

**Tax Summary**:
- Estimated Income Tax: €7,480 (28% bracket)
- VAT Collected: €8,594 (19%)
- VAT Paid: €3,506
- VAT Due: €5,088

**Deductions Identified**: €4,230
- Home office: €1,200
- Software subscriptions: €890
- Professional development: €750
- Travel: €1,390

📅 VAT deadline: January 10, 2025 (in 12 days)

Would you like me to:
1. Generate the detailed tax report
2. Prepare the VAT return for ELSTER
3. Review the identified deductions
```

### Invoice Creation
```
User: Create an invoice for ABC Corp for the consulting work in December, 30 hours at 150 euros per hour

ASSIST: I'll create that invoice for you:

**Invoice Preview**:
- Client: ABC Corp (DE123456789)
- Service: Consulting Services - December 2024
- Quantity: 30 hours
- Rate: €150.00/hour
- Subtotal: €4,500.00
- VAT (19%): €855.00
- **Total: €5,355.00**

Payment terms: Net 14 days

[Create Invoice] [Edit Details] [Cancel]

Should I create this invoice?
```

### Anomaly Alert
```
ASSIST: 🚨 I noticed something unusual:

A debit of **€12,500** was made yesterday to "XYZ Services GmbH". This is significantly higher than your typical transactions (average: €850).

**Details**:
- Date: Dec 28, 2024
- Account: Business Checking (****1234)
- Reference: "Annual subscription renewal"

**My assessment**: This could be legitimate if it's an annual software or service subscription. However, I couldn't find a corresponding contract or previous payment to this vendor.

Would you like me to:
1. Mark this as verified
2. Flag for further review
3. Show similar past transactions
```

---

## Success Criteria

- [ ] Chat response time < 2 seconds for first token
- [ ] Context awareness accuracy > 90%
- [ ] Daily suggestions generated for all active orgs
- [ ] Action execution success rate > 95%
- [ ] User satisfaction (would recommend) > 4.5/5
- [ ] Conversation continuity (remembers context)
- [ ] Zero hallucinations about financial data
