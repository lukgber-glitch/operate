/**
 * Email Seed Data - Comprehensive Test Company
 *
 * Creates email data for testing email intelligence features:
 * - Synced emails (simulating Gmail/Outlook sync)
 * - Email attachments
 * - Extracted invoice data
 * - Email suggestions
 *
 * Note: EmailConnection requires OAuth tokens which we can't seed.
 * Instead, we create SyncedEmail records directly to simulate synced emails.
 */

import { PrismaClient, EmailProvider, EmailSyncStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContext {
  orgId: string;
  userId: string;
  vendorIds: string[];
  clientIds: string[];
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
 * Generate unique email ID
 */
function emailId(): string {
  return `${Date.now()}${Math.random().toString(36).substring(2, 12)}`;
}

export async function seedEmails(context: SeedContext) {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING EMAIL DATA');
  console.log('='.repeat(60));

  const { orgId, userId } = context;

  // Clean existing email data
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCleaning existing email data...');
    await prisma.emailExtractedEntities.deleteMany({ where: { orgId } });
    await prisma.emailAttachment.deleteMany({ where: { orgId } });
    await prisma.extractedInvoice.deleteMany({ where: { organisationId: orgId } });
    await prisma.syncedEmail.deleteMany({ where: { orgId } });
    await prisma.emailSuggestion.deleteMany({ where: { organisationId: orgId } });
    await prisma.emailForwardingInbox.deleteMany({ where: { orgId } });
    await prisma.emailConnection.deleteMany({ where: { orgId } });
    console.log('Cleaned ✓\n');
  }

  // ========================================
  // EMAIL FORWARDING INBOX
  // ========================================
  console.log('Creating email forwarding inbox...');

  const forwardingInbox = await prisma.emailForwardingInbox.create({
    data: {
      orgId,
      inboxAddress: `bills-${orgId.substring(0, 8)}@in.operate.guru`,
      inboxPrefix: `bills-${orgId.substring(0, 8)}`,
      purpose: 'BILLS_INVOICES',
      displayName: 'Bills & Invoices',
      isActive: true,
      emailsReceived: 15,
      lastEmailAt: daysAgo(1),
    },
  });

  console.log(`✓ Created forwarding inbox: ${forwardingInbox.inboxAddress}`);

  // ========================================
  // EMAIL CONNECTION (dummy for seeding)
  // ========================================
  console.log('\nCreating email connection...');

  // Generate dummy encryption IV and tag (16 bytes each for AES-256-GCM)
  const dummyIv = Buffer.from('0123456789abcdef'); // 16 bytes
  const dummyTag = Buffer.from('fedcba9876543210'); // 16 bytes

  const emailConnection = await prisma.emailConnection.create({
    data: {
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      email: 'owner@testcorp.de',
      accessToken: 'dummy-access-token-for-seeding',
      refreshToken: 'dummy-refresh-token-for-seeding',
      encryptionIv: dummyIv,
      encryptionTag: dummyTag,
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      lastSyncAt: daysAgo(0),
      syncEnabled: true,
      syncStatus: EmailSyncStatus.SYNCED,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    },
  });

  console.log(`✓ Created email connection: ${emailConnection.email}`);

  // ========================================
  // SYNCED EMAILS - Various types
  // ========================================
  console.log('\nCreating synced emails...');
  const emails = [];
  const connectionId = emailConnection.id;

  // Email 1: Invoice from AWS
  const email1 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Your AWS Invoice is Available - December 2024',
      from: 'noreply@amazon.com',
      fromName: 'Amazon Web Services',
      to: ['billing@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(3),
      receivedAt: daysAgo(3),
      snippet: 'Your invoice for December 2024 is now available. Amount: €287.34. Invoice ID: AWS-2024-12-001...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['AWS-Invoice-December-2024.pdf'],
      attachmentSizes: [125000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.95,
      classification: 'INVOICE',
      classificationConfidence: 0.95,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Email contains invoice PDF attachment from known vendor AWS',
      classificationIntent: 'Payment request for cloud services',
      classificationEntities: {
        vendor: 'Amazon Web Services',
        invoiceNumber: 'AWS-2024-12-001',
        amount: 287.34,
        currency: 'EUR',
        dueDate: daysAgo(-27).toISOString(),
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(3),
      isRead: true,
      labels: ['INBOX', 'CATEGORY_UPDATES', 'INVOICE'],
    },
  });
  emails.push(email1);

  // Email 2: Invoice from Cloudways
  const email2 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Invoice #CW-2024-12345 - Cloudways Monthly Hosting',
      from: 'billing@cloudways.com',
      fromName: 'Cloudways Billing',
      to: ['owner@testcorp.de'],
      cc: ['accountant@testcorp.de'],
      bcc: [],
      sentAt: daysAgo(5),
      receivedAt: daysAgo(5),
      snippet: 'Please find attached your monthly invoice for December 2024. Total amount due: €355.81...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Cloudways-Invoice-CW-2024-12345.pdf'],
      attachmentSizes: [98000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.92,
      classification: 'INVOICE',
      classificationConfidence: 0.92,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Monthly recurring invoice from hosting provider',
      classificationIntent: 'Payment request for hosting services',
      classificationEntities: {
        vendor: 'Cloudways Ltd',
        invoiceNumber: 'CW-2024-12345',
        amount: 355.81,
        currency: 'EUR',
        dueDate: daysAgo(-25).toISOString(),
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(5),
      isRead: true,
      labels: ['INBOX', 'IMPORTANT', 'INVOICE'],
    },
  });
  emails.push(email2);

  // Email 3: Receipt from Amazon
  const email3 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Your Amazon.de order #302-1234567-8901234 has been delivered',
      from: 'order-update@amazon.de',
      fromName: 'Amazon.de',
      to: ['admin@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(7),
      receivedAt: daysAgo(7),
      snippet: 'Your package has been delivered. Order total: €89.50. Items: Office supplies...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Amazon-Receipt-302-1234567.pdf'],
      attachmentSizes: [45000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: false,
      isReceipt: true,
      isFinancial: true,
      confidence: 0.88,
      classification: 'RECEIPT',
      classificationConfidence: 0.88,
      classificationPriority: 'LOW',
      classificationReasoning: 'Order confirmation with receipt for office supplies',
      classificationIntent: 'Order confirmation and receipt',
      classificationEntities: {
        vendor: 'Amazon EU S.a.r.l.',
        orderNumber: '302-1234567-8901234',
        amount: 89.50,
        currency: 'EUR',
        category: 'office_supplies',
      },
      classificationAction: 'CREATE_EXPENSE',
      processed: true,
      processedAt: daysAgo(7),
      isRead: true,
      labels: ['CATEGORY_PURCHASES', 'RECEIPT'],
    },
  });
  emails.push(email3);

  // Email 4: Client payment notification
  const email4 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Payment Received - Invoice INV-2024-0001',
      from: 'accounting@techcorp.de',
      fromName: 'TechCorp Solutions GmbH',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(10),
      receivedAt: daysAgo(10),
      snippet: 'We have processed payment for invoice INV-2024-0001. Amount: €17,850.00. Payment reference: SEPA-TRF-2024-001...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Payment-Confirmation-INV-2024-0001.pdf'],
      attachmentSizes: [35000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: false,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.91,
      classification: 'PAYMENT_CONFIRMATION',
      classificationConfidence: 0.91,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Customer payment confirmation for outstanding invoice',
      classificationIntent: 'Payment confirmation',
      classificationEntities: {
        customer: 'TechCorp Solutions GmbH',
        invoiceNumber: 'INV-2024-0001',
        amount: 17850.00,
        currency: 'EUR',
        paymentReference: 'SEPA-TRF-2024-001',
      },
      classificationAction: 'MARK_INVOICE_PAID',
      processed: true,
      processedAt: daysAgo(10),
      isRead: true,
      labels: ['INBOX', 'IMPORTANT', 'PAYMENT'],
    },
  });
  emails.push(email4);

  // Email 5: New quote request from prospect
  const email5 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Quote Request: Enterprise Platform Migration',
      from: 'p.keller@futureindustries.com',
      fromName: 'Peter Keller',
      to: ['owner@testcorp.de', 'admin@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(8),
      receivedAt: daysAgo(8),
      snippet: 'Dear TestCorp Team, We are looking for a partner to help us migrate our legacy platform. Could you provide a quote for...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 2,
      attachmentNames: ['Requirements-Specification.pdf', 'Current-Architecture-Diagram.pdf'],
      attachmentSizes: [450000, 180000],
      attachmentMimeTypes: ['application/pdf', 'application/pdf'],
      isInvoice: false,
      isReceipt: false,
      isFinancial: false,
      confidence: 0.85,
      classification: 'QUOTE_REQUEST',
      classificationConfidence: 0.85,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Request for quote from potential enterprise customer',
      classificationIntent: 'Request for project quote',
      classificationEntities: {
        company: 'Future Industries AG',
        contact: 'Peter Keller',
        projectType: 'Platform Migration',
        urgency: 'standard',
      },
      classificationAction: 'CREATE_QUOTE',
      processed: true,
      processedAt: daysAgo(8),
      isRead: true,
      labels: ['INBOX', 'IMPORTANT', 'SALES'],
    },
  });
  emails.push(email5);

  // Email 6: Unprocessed - needs review
  const email6 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Rechnung Nr. 2024-5678',
      from: 'buchhaltung@unknown-vendor.de',
      fromName: 'Unknown Vendor GmbH',
      to: ['billing@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(2),
      receivedAt: daysAgo(2),
      snippet: 'Sehr geehrte Damen und Herren, anbei erhalten Sie unsere Rechnung Nr. 2024-5678 über €1,234.56...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Rechnung-2024-5678.pdf'],
      attachmentSizes: [87000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.65, // Low confidence - needs review
      classification: 'INVOICE',
      classificationConfidence: 0.65,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Invoice from unknown vendor - requires verification',
      classificationIntent: 'Payment request',
      classificationEntities: {
        vendor: 'Unknown Vendor GmbH',
        invoiceNumber: '2024-5678',
        amount: 1234.56,
        currency: 'EUR',
      },
      classificationAction: 'REVIEW_REQUIRED',
      processed: false,
      isRead: false,
      labels: ['INBOX', 'UNREAD'],
    },
  });
  emails.push(email6);

  // Email 7: Newsletter (should be skipped)
  const email7 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'December Newsletter: Tech Industry Updates',
      from: 'newsletter@techweekly.com',
      fromName: 'Tech Weekly',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(4),
      receivedAt: daysAgo(4),
      snippet: 'This week in tech: AI breakthroughs, startup funding news, and industry trends...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: false,
      attachmentCount: 0,
      attachmentNames: [],
      attachmentSizes: [],
      attachmentMimeTypes: [],
      isInvoice: false,
      isReceipt: false,
      isFinancial: false,
      confidence: 0.98,
      classification: 'NEWSLETTER',
      classificationConfidence: 0.98,
      classificationPriority: 'LOW',
      classificationReasoning: 'Marketing newsletter - not business relevant',
      classificationIntent: 'Marketing',
      classificationAction: 'SKIP',
      processed: true,
      processedAt: daysAgo(4),
      isRead: false,
      labels: ['CATEGORY_PROMOTIONS'],
    },
  });
  emails.push(email7);

  // Email 8: Bank statement notification
  const email8 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Your November 2024 Bank Statement is Ready',
      from: 'statements@deutschebank.de',
      fromName: 'Deutsche Bank',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(15),
      receivedAt: daysAgo(15),
      snippet: 'Your monthly statement for account ending in 3000 is now available in your online banking portal...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Statement-November-2024.pdf'],
      attachmentSizes: [234000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: false,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.94,
      classification: 'BANK_STATEMENT',
      classificationConfidence: 0.94,
      classificationPriority: 'LOW',
      classificationReasoning: 'Monthly bank statement notification',
      classificationIntent: 'Statement notification',
      classificationEntities: {
        bank: 'Deutsche Bank',
        accountEnding: '3000',
        period: 'November 2024',
      },
      classificationAction: 'ARCHIVE',
      processed: true,
      processedAt: daysAgo(15),
      isRead: true,
      labels: ['CATEGORY_UPDATES', 'BANKING'],
    },
  });
  emails.push(email8);

  // Email 9: Expense reimbursement request (internal)
  const email9 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Expense Reimbursement Request - Client Dinner',
      from: 'max.mueller@testcorp.de',
      fromName: 'Max Müller',
      to: ['accountant@testcorp.de'],
      cc: ['owner@testcorp.de'],
      bcc: [],
      sentAt: daysAgo(6),
      receivedAt: daysAgo(6),
      snippet: 'Hi Lisa, please find attached the receipt for the client dinner with TechCorp last week. Total: €87.50...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Receipt-Restaurant-Dec2024.jpg'],
      attachmentSizes: [1200000],
      attachmentMimeTypes: ['image/jpeg'],
      isInvoice: false,
      isReceipt: true,
      isFinancial: true,
      confidence: 0.89,
      classification: 'EXPENSE_REIMBURSEMENT',
      classificationConfidence: 0.89,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Employee expense reimbursement request with receipt',
      classificationIntent: 'Expense reimbursement',
      classificationEntities: {
        employee: 'Max Müller',
        amount: 87.50,
        currency: 'EUR',
        category: 'meals_entertainment',
        purpose: 'Client dinner',
      },
      classificationAction: 'CREATE_EXPENSE',
      processed: true,
      processedAt: daysAgo(6),
      isRead: true,
      labels: ['INBOX', 'EXPENSES'],
    },
  });
  emails.push(email9);

  // Email 10: Tax office notification
  const email10 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Umsatzsteuer-Voranmeldung Q3 2024 - Eingangsbestätigung',
      from: 'noreply@elster.de',
      fromName: 'ELSTER',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(60),
      receivedAt: daysAgo(60),
      snippet: 'Ihre Umsatzsteuer-Voranmeldung für Q3 2024 wurde erfolgreich übermittelt. Transferticket: ET2024Q3...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['ELSTER-Bestaetigung-Q3-2024.pdf'],
      attachmentSizes: [56000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: false,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.97,
      classification: 'TAX_NOTIFICATION',
      classificationConfidence: 0.97,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Official tax filing confirmation from ELSTER',
      classificationIntent: 'Tax filing confirmation',
      classificationEntities: {
        authority: 'Finanzamt',
        taxType: 'VAT',
        period: 'Q3 2024',
        transferTicket: 'ET2024Q3',
      },
      classificationAction: 'ARCHIVE',
      processed: true,
      processedAt: daysAgo(60),
      isRead: true,
      labels: ['IMPORTANT', 'TAX'],
    },
  });
  emails.push(email10);

  // ========================================
  // INSURANCE & RECURRING BILLS
  // ========================================

  // Email 11: Insurance bill - Allianz Business Liability
  const email11 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Ihre Rechnung für Betriebshaftpflichtversicherung - Q1 2025',
      from: 'rechnung@allianz.de',
      fromName: 'Allianz Versicherung',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(5),
      receivedAt: daysAgo(5),
      snippet: 'Sehr geehrte Damen und Herren, anbei erhalten Sie Ihre Rechnung für die Betriebshaftpflichtversicherung Q1 2025. Betrag: €425,00. Fällig am: 15.01.2025...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Allianz-Rechnung-Q1-2025.pdf'],
      attachmentSizes: [145000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.94,
      classification: 'INVOICE',
      classificationConfidence: 0.94,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Quarterly insurance premium invoice',
      classificationIntent: 'Insurance payment request',
      classificationEntities: {
        vendor: 'Allianz Versicherungs-AG',
        invoiceNumber: 'ALZ-2025-Q1-78901',
        amount: 425.00,
        currency: 'EUR',
        dueDate: '2025-01-15',
        insuranceType: 'Business Liability',
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(5),
      isRead: true,
      labels: ['INBOX', 'INSURANCE', 'BILL'],
    },
  });
  emails.push(email11);

  // Email 12: Telekom Internet Bill
  const email12 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Ihre Telekom Rechnung Dezember 2024 - Kundennummer 123456789',
      from: 'noreply@telekom.de',
      fromName: 'Telekom Deutschland',
      to: ['admin@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(8),
      receivedAt: daysAgo(8),
      snippet: 'Guten Tag, Ihre Rechnung für Dezember 2024 ist da. Rechnungsbetrag: €49,99. Bitte begleichen Sie den Betrag bis zum 28.12.2024...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Telekom-Rechnung-Dez-2024.pdf'],
      attachmentSizes: [89000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.96,
      classification: 'INVOICE',
      classificationConfidence: 0.96,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Monthly telecom/internet bill',
      classificationIntent: 'Utility payment request',
      classificationEntities: {
        vendor: 'Telekom Deutschland GmbH',
        invoiceNumber: 'TK-2024-12-123456',
        amount: 49.99,
        currency: 'EUR',
        dueDate: '2024-12-28',
        serviceType: 'Business Internet',
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(8),
      isRead: true,
      labels: ['INBOX', 'UTILITIES', 'BILL'],
    },
  });
  emails.push(email12);

  // Email 13: WeWork Office Rent Invoice
  const email13 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Invoice #WW-2024-12-4567 - WeWork Berlin Mitte - January 2025',
      from: 'invoices@wework.com',
      fromName: 'WeWork Billing',
      to: ['owner@testcorp.de', 'accountant@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(3),
      receivedAt: daysAgo(3),
      snippet: 'Please find attached your invoice for January 2025 office space rental at WeWork Berlin Mitte. Total amount: €1,785.00 including VAT...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['WeWork-Invoice-Jan-2025.pdf'],
      attachmentSizes: [156000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.97,
      classification: 'INVOICE',
      classificationConfidence: 0.97,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Monthly office rent invoice from co-working space',
      classificationIntent: 'Rent payment request',
      classificationEntities: {
        vendor: 'WeWork Germany GmbH',
        invoiceNumber: 'WW-2024-12-4567',
        amount: 1785.00,
        currency: 'EUR',
        dueDate: '2025-01-05',
        location: 'Berlin Mitte',
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(3),
      isRead: false,
      labels: ['INBOX', 'UNREAD', 'IMPORTANT', 'RENT'],
    },
  });
  emails.push(email13);

  // Email 14: Steuerberater (Tax Advisor) Monthly Fee
  const email14 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Honorarrechnung Dezember 2024 - Steuerberatung Schmidt & Co',
      from: 'buchhaltung@schmidt-steuer.de',
      fromName: 'Steuerberatung Schmidt & Co',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(4),
      receivedAt: daysAgo(4),
      snippet: 'Sehr geehrte Frau Owner, anbei erhalten Sie unsere Honorarrechnung für die laufende Buchhaltung und Steuerberatung im Dezember 2024. Gesamtbetrag: €595,00 inkl. MwSt...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Schmidt-Honorar-Dez-2024.pdf'],
      attachmentSizes: [78000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.93,
      classification: 'INVOICE',
      classificationConfidence: 0.93,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Monthly accounting/tax advisory fee',
      classificationIntent: 'Professional services payment',
      classificationEntities: {
        vendor: 'Steuerberatung Schmidt & Co',
        invoiceNumber: 'STB-2024-12-089',
        amount: 595.00,
        currency: 'EUR',
        dueDate: '2024-12-31',
        serviceType: 'Accounting & Tax Advisory',
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(4),
      isRead: true,
      labels: ['INBOX', 'ACCOUNTING', 'BILL'],
    },
  });
  emails.push(email14);

  // ========================================
  // CUSTOMER EMAILS
  // ========================================

  // Email 15: Customer inquiry - Design Studio
  const email15 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Re: Project Timeline Update - Website Redesign',
      from: 'lisa@designstudio.de',
      fromName: 'Lisa Weber',
      to: ['admin@testcorp.de'],
      cc: ['owner@testcorp.de'],
      bcc: [],
      sentAt: daysAgo(2),
      receivedAt: daysAgo(2),
      snippet: 'Hi Team, thanks for the update on the website redesign project. We are happy with the progress so far. Could you please send the invoice for the completed Phase 1?...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: false,
      attachmentCount: 0,
      attachmentNames: [],
      attachmentSizes: [],
      attachmentMimeTypes: [],
      isInvoice: false,
      isReceipt: false,
      isFinancial: false,
      confidence: 0.88,
      classification: 'CUSTOMER_REQUEST',
      classificationConfidence: 0.88,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Customer requesting invoice for completed work',
      classificationIntent: 'Invoice request from customer',
      classificationEntities: {
        customer: 'Design Studio Berlin',
        contact: 'Lisa Weber',
        project: 'Website Redesign',
        action: 'Send invoice',
      },
      classificationAction: 'CREATE_INVOICE',
      processed: true,
      processedAt: daysAgo(2),
      isRead: true,
      labels: ['INBOX', 'CUSTOMER', 'ACTION_REQUIRED'],
    },
  });
  emails.push(email15);

  // Email 16: New customer inquiry
  const email16 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Anfrage: Software-Entwicklung für E-Commerce Plattform',
      from: 'kontakt@neuerkunde.de',
      fromName: 'Thomas Neumann',
      to: ['info@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(1),
      receivedAt: daysAgo(1),
      snippet: 'Sehr geehrte Damen und Herren, wir sind ein mittelständisches Unternehmen und suchen einen Partner für die Entwicklung unserer neuen E-Commerce Plattform. Könnten Sie uns ein Angebot...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Anforderungsprofil.pdf'],
      attachmentSizes: [320000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: false,
      isReceipt: false,
      isFinancial: false,
      confidence: 0.91,
      classification: 'SALES_INQUIRY',
      classificationConfidence: 0.91,
      classificationPriority: 'HIGH',
      classificationReasoning: 'New business inquiry requesting quote',
      classificationIntent: 'New customer quote request',
      classificationEntities: {
        prospectCompany: 'Neuer Kunde GmbH',
        contact: 'Thomas Neumann',
        projectType: 'E-Commerce Platform',
        estimatedValue: 'medium-large',
      },
      classificationAction: 'CREATE_LEAD',
      processed: true,
      processedAt: daysAgo(1),
      isRead: false,
      labels: ['INBOX', 'UNREAD', 'IMPORTANT', 'SALES'],
    },
  });
  emails.push(email16);

  // Email 17: Customer payment confirmation (incoming)
  const email17 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Zahlungsbestätigung - Rechnung INV-2024-0002',
      from: 'm.huber@alpine-solutions.at',
      fromName: 'Maria Huber',
      to: ['accountant@testcorp.de'],
      cc: ['owner@testcorp.de'],
      bcc: [],
      sentAt: daysAgo(1),
      receivedAt: daysAgo(1),
      snippet: 'Guten Tag, hiermit bestätigen wir die Überweisung für Rechnung INV-2024-0002 über €5,355.00. Die Zahlung wurde heute veranlasst und sollte in 1-2 Werktagen eingehen...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Zahlungsbeleg-Alpine.pdf'],
      attachmentSizes: [45000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: false,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.92,
      classification: 'PAYMENT_NOTIFICATION',
      classificationConfidence: 0.92,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Customer confirming payment for outstanding invoice',
      classificationIntent: 'Payment confirmation',
      classificationEntities: {
        customer: 'Alpine Solutions GmbH',
        contact: 'Maria Huber',
        invoiceNumber: 'INV-2024-0002',
        amount: 5355.00,
        currency: 'EUR',
      },
      classificationAction: 'MARK_INVOICE_PAID',
      processed: false,
      isRead: false,
      labels: ['INBOX', 'UNREAD', 'IMPORTANT', 'PAYMENT'],
    },
  });
  emails.push(email17);

  // ========================================
  // MORE VENDOR BILLS
  // ========================================

  // Email 18: Legal services invoice
  const email18 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Kostenrechnung - Vertragsrecht Beratung November 2024',
      from: 'h.mueller@mueller-law.de',
      fromName: 'Dr. Hans Müller',
      to: ['owner@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(12),
      receivedAt: daysAgo(12),
      snippet: 'Sehr geehrte Frau Owner, anbei übersenden wir Ihnen unsere Kostenrechnung für die vertragsrechtliche Beratung im November 2024. Gegenstand: Prüfung Rahmenvertrag TechCorp...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['Mueller-Law-Rechnung-Nov2024.pdf'],
      attachmentSizes: [112000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.94,
      classification: 'INVOICE',
      classificationConfidence: 0.94,
      classificationPriority: 'MEDIUM',
      classificationReasoning: 'Legal services invoice from law firm',
      classificationIntent: 'Professional services payment',
      classificationEntities: {
        vendor: 'Kanzlei Müller & Partner',
        invoiceNumber: 'KMP-2024-11-234',
        amount: 892.50,
        currency: 'EUR',
        dueDate: '2024-12-15',
        serviceType: 'Legal Advisory',
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(12),
      isRead: true,
      labels: ['INBOX', 'LEGAL', 'BILL'],
    },
  });
  emails.push(email18);

  // Email 19: Software subscription renewal - GitHub
  const email19 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Your GitHub Team subscription invoice - December 2024',
      from: 'noreply@github.com',
      fromName: 'GitHub',
      to: ['admin@testcorp.de'],
      cc: [],
      bcc: [],
      sentAt: daysAgo(9),
      receivedAt: daysAgo(9),
      snippet: 'Thanks for using GitHub Team! Your invoice for December 2024 is attached. Amount: $48.00 (€44.00). Your subscription will automatically renew...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 1,
      attachmentNames: ['GitHub-Invoice-Dec2024.pdf'],
      attachmentSizes: [67000],
      attachmentMimeTypes: ['application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.95,
      classification: 'INVOICE',
      classificationConfidence: 0.95,
      classificationPriority: 'LOW',
      classificationReasoning: 'Monthly software subscription invoice',
      classificationIntent: 'Subscription payment',
      classificationEntities: {
        vendor: 'GitHub Inc',
        invoiceNumber: 'GH-2024-12-789012',
        amount: 44.00,
        currency: 'EUR',
        subscriptionType: 'Team',
        recurring: true,
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(9),
      isRead: true,
      labels: ['INBOX', 'SOFTWARE', 'SUBSCRIPTION'],
    },
  });
  emails.push(email19);

  // Email 20: Marketing agency invoice - DME
  const email20 = await prisma.syncedEmail.create({
    data: {
      connectionId,
      orgId,
      userId,
      provider: EmailProvider.GMAIL,
      externalId: emailId(),
      threadId: `thread_${emailId()}`,
      subject: 'Rechnung Q4 2024 - SEO & Content Marketing Kampagne',
      from: 'thomas@dme-agency.de',
      fromName: 'Thomas Creative',
      to: ['owner@testcorp.de'],
      cc: ['admin@testcorp.de'],
      bcc: [],
      sentAt: daysAgo(14),
      receivedAt: daysAgo(14),
      snippet: 'Hallo Maria, wie besprochen sende ich dir die Rechnung für die Q4 Marketing-Kampagne. SEO-Optimierung: €1,500, Content (10 Blogposts): €1,000. Gesamt: €2,975 inkl. MwSt...',
      hasHtmlBody: true,
      hasTextBody: true,
      hasAttachments: true,
      attachmentCount: 2,
      attachmentNames: ['DME-Rechnung-Q4-2024.pdf', 'Kampagnen-Report-Q4.pdf'],
      attachmentSizes: [95000, 2400000],
      attachmentMimeTypes: ['application/pdf', 'application/pdf'],
      isInvoice: true,
      isReceipt: false,
      isFinancial: true,
      confidence: 0.93,
      classification: 'INVOICE',
      classificationConfidence: 0.93,
      classificationPriority: 'HIGH',
      classificationReasoning: 'Marketing services invoice with campaign report',
      classificationIntent: 'Marketing services payment',
      classificationEntities: {
        vendor: 'Digital Marketing Experts GmbH',
        invoiceNumber: 'DME-2024-Q4-056',
        amount: 2975.00,
        currency: 'EUR',
        dueDate: '2024-12-20',
        serviceType: 'SEO & Content Marketing',
      },
      classificationAction: 'CREATE_BILL',
      processed: true,
      processedAt: daysAgo(14),
      isRead: true,
      labels: ['INBOX', 'MARKETING', 'BILL'],
    },
  });
  emails.push(email20);

  console.log(`Created ${emails.length} synced emails ✓`);

  // ========================================
  // EXTRACTED INVOICES
  // ========================================
  console.log('\nCreating extracted invoices...');

  const extractedInvoice1 = await prisma.extractedInvoice.create({
    data: {
      organisationId: orgId,
      fileName: 'AWS-Invoice-December-2024.pdf',
      mimeType: 'application/pdf',
      fileSize: 125000,
      status: 'COMPLETED',
      extractedData: {
        vendorName: 'Amazon Web Services',
        vendorEmail: 'noreply@amazon.com',
        invoiceNumber: 'AWS-2024-12-001',
        invoiceDate: daysAgo(3).toISOString(),
        dueDate: daysAgo(-27).toISOString(),
        subtotal: 241.47,
        taxAmount: 45.87,
        totalAmount: 287.34,
        currency: 'EUR',
        lineItems: [
          { description: 'EC2 Instances', amount: 150.00 },
          { description: 'S3 Storage', amount: 45.00 },
          { description: 'RDS Database', amount: 46.47 },
        ],
      },
      overallConfidence: 0.95,
      fieldConfidences: [
        { field: 'vendorName', confidence: 0.98 },
        { field: 'totalAmount', confidence: 0.99 },
        { field: 'invoiceNumber', confidence: 0.95 },
      ],
      pageCount: 2,
      processingTime: 3500,
    },
  });

  const extractedInvoice2 = await prisma.extractedInvoice.create({
    data: {
      organisationId: orgId,
      fileName: 'Cloudways-Invoice.pdf',
      mimeType: 'application/pdf',
      fileSize: 98000,
      status: 'COMPLETED',
      extractedData: {
        vendorName: 'Cloudways Ltd',
        vendorEmail: 'billing@cloudways.com',
        invoiceNumber: 'CW-2024-12345',
        totalAmount: 355.81,
        currency: 'EUR',
      },
      overallConfidence: 0.92,
      fieldConfidences: [],
      pageCount: 1,
      processingTime: 2800,
    },
  });

  const extractedInvoice3 = await prisma.extractedInvoice.create({
    data: {
      organisationId: orgId,
      fileName: 'Rechnung-2024-5678.pdf',
      mimeType: 'application/pdf',
      fileSize: 87000,
      status: 'PENDING', // Low confidence - needs human review
      extractedData: {
        vendorName: 'Unknown Vendor GmbH',
        invoiceNumber: '2024-5678',
        totalAmount: 1234.56,
        currency: 'EUR',
      },
      overallConfidence: 0.65,
      fieldConfidences: [],
    },
  });

  console.log(`Created 3 extracted invoices ✓`);

  // Email suggestions skipped for now - schema has complex enum types
  console.log('Skipping email suggestions (schema incompatibility)...');

  // Summary
  const byClassification = emails.reduce((acc, e) => {
    const key = e.classification || 'UNCLASSIFIED';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n' + '='.repeat(60));
  console.log('EMAIL DATA SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`  Forwarding Inbox: 1 (${forwardingInbox.inboxAddress})`);
  console.log(`  Synced Emails:    ${emails.length}`);
  console.log('  By Classification:');
  Object.entries(byClassification).forEach(([cls, count]) => {
    console.log(`    - ${cls}: ${count}`);
  });
  console.log(`  Extracted Invoices: 3`);
  console.log('='.repeat(60));

  return { emails, forwardingInbox };
}
