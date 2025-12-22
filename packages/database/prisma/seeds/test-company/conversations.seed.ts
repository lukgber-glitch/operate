/**
 * Conversation & AI Seed Data - Comprehensive Test Company
 *
 * Creates conversation history and AI-related data for testing:
 * - Chat conversations with messages
 * - AI suggestions
 * - Automation settings
 * - Documents
 */

import { PrismaClient, SuggestionStatus, SuggestionPriority, SuggestionType, ConversationStatus, MessageRole, DocumentType } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContext {
  orgId: string;
  userId: string;
  invoiceIds: string[];
  billIds: string[];
}

/**
 * Get date N days ago
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get date N hours ago
 */
function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

export async function seedConversations(context: SeedContext) {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING CONVERSATION & AI DATA');
  console.log('='.repeat(60));

  const { orgId, userId, invoiceIds, billIds } = context;

  // Clean existing conversation data
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCleaning existing conversation data...');
    await prisma.messageActionLog.deleteMany({ where: { message: { conversation: { orgId } } } });
    await prisma.messageAttachment.deleteMany({ where: { message: { conversation: { orgId } } } });
    await prisma.message.deleteMany({ where: { conversation: { orgId } } });
    await prisma.conversation.deleteMany({ where: { orgId } });
    await prisma.suggestion.deleteMany({ where: { orgId } });
    await prisma.document.deleteMany({ where: { orgId } });
    console.log('Cleaned ✓\n');
  }

  // ========================================
  // CONVERSATIONS
  // ========================================
  console.log('Creating conversations...');
  const conversations = [];

  // Conversation 1: Invoice query
  const conv1 = await prisma.conversation.create({
    data: {
      orgId,
      userId,
      title: 'Invoice Status Check',
      status: ConversationStatus.ACTIVE,
      contextType: 'accounts_receivable',
      lastMessageAt: hoursAgo(2),
      messageCount: 4,
      metadata: {
        tags: ['invoices', 'ar', 'overdue'],
        topic: 'accounts_receivable',
      },
    },
  });

  // Messages for conversation 1
  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        role: MessageRole.USER,
        content: 'Do I have any overdue invoices?',
        createdAt: hoursAgo(3),
      },
      {
        conversationId: conv1.id,
        role: MessageRole.ASSISTANT,
        content: 'Yes, you have 1 overdue invoice:\n\n**INV-2024-0003** for Hans Schneider\n- Amount: €2,856.00\n- Due Date: 33 days ago\n- Days Overdue: 33\n\nWould you like me to send a payment reminder?',
        createdAt: hoursAgo(3),
        model: 'claude-3-opus',
      },
      {
        conversationId: conv1.id,
        role: MessageRole.USER,
        content: 'Yes, please send a reminder',
        createdAt: hoursAgo(2.5),
      },
      {
        conversationId: conv1.id,
        role: MessageRole.ASSISTANT,
        content: 'I\'ve drafted a payment reminder email for Hans Schneider. Here\'s the preview:\n\n---\n**Subject:** Friendly Payment Reminder - Invoice INV-2024-0003\n\nDear Hans,\n\nThis is a friendly reminder that invoice INV-2024-0003 for €2,856.00 was due on [date]. We would appreciate your prompt attention to this matter.\n\n---\n\nShall I send this now?',
        createdAt: hoursAgo(2),
        actionType: 'draft_reminder',
        actionStatus: 'pending_approval',
        model: 'claude-3-opus',
      },
    ],
  });
  conversations.push(conv1);

  // Conversation 2: Expense categorization
  const conv2 = await prisma.conversation.create({
    data: {
      orgId,
      userId,
      title: 'Expense Categorization Help',
      status: ConversationStatus.ACTIVE,
      contextType: 'expense_management',
      lastMessageAt: daysAgo(1),
      messageCount: 6,
      metadata: {
        tags: ['expenses', 'categorization', 'tax'],
        topic: 'expense_management',
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        role: MessageRole.USER,
        content: 'Can you help me categorize my recent expenses for tax deductions?',
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv2.id,
        role: MessageRole.ASSISTANT,
        content: 'I\'d be happy to help! Looking at your recent expenses, here\'s how I\'d categorize them for German tax purposes:\n\n**Fully Deductible (100%):**\n- AWS Services: €287.34 (Betriebsausgaben)\n- GitHub: €44.00 (Software)\n- Office Supplies: €89.50 (Büromaterial)\n\n**Partially Deductible:**\n- Client Lunch: €87.50 (70% deductible = €61.25)\n- Business Travel: €159.00 (100% if business purpose documented)\n\nWould you like me to generate a tax-ready expense report?',
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv2.id,
        role: MessageRole.USER,
        content: 'Yes please, and what about the home office deduction?',
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv2.id,
        role: MessageRole.ASSISTANT,
        content: 'For home office (Homeoffice-Pauschale) in Germany 2024:\n\n**Option 1: Flat Rate**\n- €6 per day worked from home\n- Maximum €1,260 per year (210 days)\n\n**Option 2: Actual Costs**\n- If you have a dedicated room\n- Proportional rent, utilities, insurance\n- Requires detailed documentation\n\nBased on your time tracking, you\'ve worked from home approximately 45 days this year. That would be €270 flat rate deduction.\n\nShall I add this to your tax report?',
        createdAt: daysAgo(1),
      },
    ],
  });
  conversations.push(conv2);

  // Conversation 3: Cash flow analysis
  const conv3 = await prisma.conversation.create({
    data: {
      orgId,
      userId,
      title: 'Monthly Cash Flow Review',
      status: ConversationStatus.ACTIVE,
      contextType: 'financial_planning',
      lastMessageAt: daysAgo(3),
      messageCount: 4,
      metadata: {
        tags: ['cashflow', 'analysis', 'planning'],
        topic: 'financial_planning',
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        role: MessageRole.USER,
        content: 'What does my cash flow look like for the rest of the month?',
        createdAt: daysAgo(3),
      },
      {
        conversationId: conv3.id,
        role: MessageRole.ASSISTANT,
        content: '**December Cash Flow Projection:**\n\n**Current Balance:** €47,235.67\n\n**Expected Inflows:**\n- INV-2024-0002 (Design Studio): €5,355 due in 4 days\n- INV-2024-0005 remaining: €7,140 due in 10 days\n\n**Expected Outflows:**\n- BILL-2024-0002 (Office Rent): €1,785 due in 10 days\n- Payroll (end of month): ~€12,000\n- VAT Payment: ~€3,000\n\n**Projected Month-End Balance:** €43,000 - €45,000\n\nNote: You have an overdue bill (BILL-2024-0003) for €2,975 that should be paid soon.',
        createdAt: daysAgo(3),
        actionType: 'cashflow_projection',
        model: 'claude-3-opus',
      },
    ],
  });
  conversations.push(conv3);

  // Conversation 4: Archived - Old conversation
  const conv4 = await prisma.conversation.create({
    data: {
      orgId,
      userId,
      title: 'Q3 Tax Planning',
      status: ConversationStatus.ARCHIVED,
      contextType: 'tax_planning',
      lastMessageAt: daysAgo(60),
      messageCount: 8,
      metadata: {
        tags: ['tax', 'vat', 'quarterly'],
        topic: 'tax_planning',
      },
    },
  });
  conversations.push(conv4);

  console.log(`Created ${conversations.length} conversations ✓`);

  // ========================================
  // AI SUGGESTIONS
  // ========================================
  console.log('\nCreating AI suggestions...');
  const suggestions = [];

  // Suggestion 1: Overdue invoice reminder
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.INVOICE_REMINDER,
      title: 'Send Payment Reminder',
      description: 'Invoice INV-2024-0003 is 33 days overdue. Consider sending a payment reminder to Hans Schneider.',
      priority: SuggestionPriority.HIGH,
      status: SuggestionStatus.PENDING,
      entityType: 'invoice',
      entityId: invoiceIds[2],
      data: {
        invoiceNumber: 'INV-2024-0003',
        amount: 2856,
        daysOverdue: 33,
        customerName: 'Hans Schneider',
      },
      actionType: 'send_reminder',
      actionLabel: 'Send Reminder',
      actionParams: {
        template: 'payment_reminder',
        invoiceId: invoiceIds[2],
      },
      expiresAt: daysAgo(-7), // expires in 7 days
    },
  }));

  // Suggestion 2: Bill payment due
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.EXPENSE_ANOMALY,
      title: 'Pay Overdue Bill',
      description: 'BILL-2024-0003 (Marketing Services) is 15 days overdue. Amount: €2,975.',
      priority: SuggestionPriority.HIGH,
      status: SuggestionStatus.PENDING,
      entityType: 'bill',
      entityId: billIds[2],
      data: {
        billNumber: 'BILL-2024-0003',
        amount: 2975,
        vendorName: 'Digital Marketing Experts GmbH',
        daysOverdue: 15,
      },
      actionType: 'schedule_payment',
      actionLabel: 'Pay Now',
      actionParams: {
        billId: billIds[2],
        paymentDate: new Date().toISOString(),
      },
      expiresAt: daysAgo(-3),
    },
  }));

  // Suggestion 3: Recurring expense detected
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.OPTIMIZATION,
      title: 'Set Up Recurring Expense',
      description: 'AWS charges appear monthly. Would you like to set this up as a recurring expense for easier tracking?',
      priority: SuggestionPriority.MEDIUM,
      status: SuggestionStatus.PENDING,
      entityType: 'expense',
      data: {
        vendor: 'Amazon Web Services',
        averageAmount: 287.34,
        frequency: 'monthly',
        lastOccurrences: 3,
      },
      actionType: 'create_recurring',
      actionLabel: 'Set Up',
      actionParams: {
        vendor: 'Amazon Web Services',
        amount: 287.34,
        frequency: 'monthly',
        category: 'software_subscription',
      },
    },
  }));

  // Suggestion 4: Tax deadline reminder
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.TAX_DEADLINE,
      title: 'Upcoming VAT Filing Deadline',
      description: 'Your Q4 VAT return is due by January 10, 2025. Based on your transactions, estimated VAT payable is €4,200.',
      priority: SuggestionPriority.MEDIUM,
      status: SuggestionStatus.PENDING,
      entityType: 'tax',
      data: {
        deadline: '2025-01-10',
        quarter: 'Q4 2024',
        estimatedAmount: 4200,
        taxType: 'VAT',
      },
      actionType: 'prepare_tax_return',
      actionLabel: 'Prepare Filing',
      actionParams: {
        taxType: 'VAT',
        period: 'Q4-2024',
      },
      expiresAt: new Date('2025-01-10'),
    },
  }));

  // Suggestion 5: Transaction categorization needed
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.INSIGHT,
      title: 'Categorize Transactions',
      description: 'You have 3 uncategorized bank transactions. Would you like me to suggest categories?',
      priority: SuggestionPriority.LOW,
      status: SuggestionStatus.PENDING,
      entityType: 'transaction',
      data: {
        uncategorizedCount: 3,
        transactions: [
          { description: 'FIGMA INC', suggestedCategory: 'software_subscription' },
          { description: 'LINKEDIN IRELAND', suggestedCategory: 'marketing' },
          { description: 'TELEKOM', suggestedCategory: 'utilities' },
        ],
      },
      actionType: 'bulk_categorize',
      actionLabel: 'Categorize',
    },
  }));

  // Suggestion 6: Accepted suggestion (for history)
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.INVOICE_REMINDER,
      title: 'Payment Received',
      description: 'TechCorp has paid INV-2024-0001 in full (€17,850). Invoice marked as paid.',
      priority: SuggestionPriority.LOW,
      status: SuggestionStatus.ACCEPTED,
      actedAt: daysAgo(10),
      entityType: 'invoice',
      entityId: invoiceIds[0],
      data: {
        amount: 17850,
        customerName: 'TechCorp Solutions GmbH',
      },
      actionType: 'mark_paid',
      actionLabel: 'Mark Paid',
      actionParams: { invoiceId: invoiceIds[0] },
    },
  }));

  // Suggestion 7: Dismissed suggestion
  suggestions.push(await prisma.suggestion.create({
    data: {
      orgId,
      userId,
      type: SuggestionType.OPTIMIZATION,
      title: 'Potential Cost Savings',
      description: 'Your GitHub subscription could be reduced to Team plan, saving €20/month.',
      priority: SuggestionPriority.LOW,
      status: SuggestionStatus.DISMISSED,
      dismissedAt: daysAgo(5),
      dismissReason: 'Need the advanced features',
      data: {
        currentPlan: 'Enterprise',
        suggestedPlan: 'Team',
        monthlySavings: 20,
      },
    },
  }));

  console.log(`Created ${suggestions.length} suggestions ✓`);

  // ========================================
  // DOCUMENTS
  // ========================================
  console.log('\nCreating documents...');
  const documents = [];

  const documentData = [
    { name: 'Invoice-TechCorp-Q4.pdf', type: DocumentType.INVOICE, fileSize: 125000, tags: ['invoices', 'q4'] },
    { name: 'Receipt-AWS-Nov2024.pdf', type: DocumentType.RECEIPT, fileSize: 45000, tags: ['receipts', 'aws'] },
    { name: 'Contract-WeWork-2024.pdf', type: DocumentType.CONTRACT, fileSize: 890000, tags: ['contracts', 'office'] },
    { name: 'Bank-Statement-Nov2024.pdf', type: DocumentType.REPORT, fileSize: 234000, tags: ['banking', 'statements'] },
    { name: 'Tax-Return-2023.pdf', type: DocumentType.FORM, fileSize: 567000, tags: ['tax', 'returns'] },
    { name: 'Employee-Handbook.pdf', type: DocumentType.POLICY, fileSize: 1200000, tags: ['hr', 'policies'] },
    { name: 'Insurance-Policy-2024.pdf', type: DocumentType.CERTIFICATE, fileSize: 450000, tags: ['insurance', 'business'] },
    { name: 'Vendor-Agreement-DME.pdf', type: DocumentType.CONTRACT, fileSize: 320000, tags: ['contracts', 'vendors'] },
  ];

  for (const doc of documentData) {
    documents.push(await prisma.document.create({
      data: {
        orgId,
        name: doc.name,
        fileName: doc.name,
        mimeType: 'application/pdf',
        fileSize: doc.fileSize,
        type: doc.type,
        tags: doc.tags,
        fileUrl: `https://storage.operate.guru/docs/${orgId}/${doc.name}`,
        uploadedBy: userId,
        metadata: {
          pages: Math.floor(doc.fileSize / 50000) + 1,
          extracted: true,
        },
      },
    }));
  }

  console.log(`Created ${documents.length} documents ✓`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('CONVERSATION & AI DATA SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`  Conversations: ${conversations.length} (${conversations.filter(c => c.status === 'ARCHIVED').length} archived)`);
  console.log(`  Suggestions:   ${suggestions.length}`);
  console.log(`    - Pending:   ${suggestions.filter(s => s.status === 'PENDING').length}`);
  console.log(`    - Accepted:  ${suggestions.filter(s => s.status === 'ACCEPTED').length}`);
  console.log(`    - Dismissed: ${suggestions.filter(s => s.status === 'DISMISSED').length}`);
  console.log(`  Documents:     ${documents.length}`);
  console.log('='.repeat(60));

  return { conversations, suggestions, documents };
}
