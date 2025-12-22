/**
 * Banking Seed Data - Comprehensive Test Company
 *
 * Creates realistic banking data for testing:
 * - Bank accounts (business, savings)
 * - Bank transactions (income, expenses, transfers)
 * - Transaction categories for AI classification testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContext {
  orgId: string;
  invoiceIds: string[];
  expenseIds: string[];
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
 * Generate random transaction reference
 */
function txnRef(): string {
  return `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function seedBanking(context: SeedContext) {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING BANKING DATA');
  console.log('='.repeat(60));

  const { orgId } = context;

  // Clean existing banking data
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCleaning existing banking data...');
    await prisma.bankTransaction.deleteMany({ where: { bankAccount: { orgId } } });
    await prisma.bankAccount.deleteMany({ where: { orgId } });
    console.log('Cleaned ✓\n');
  }

  // ========================================
  // BANK ACCOUNTS
  // ========================================
  console.log('Creating bank accounts...');

  // Main Business Account - Deutsche Bank
  const businessAccount = await prisma.bankAccount.create({
    data: {
      orgId,
      name: 'Deutsche Bank Business',
      accountNumber: 'DE89370400440532013000',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Deutsche Bank',
      currency: 'EUR',
      accountType: 'checking',
      currentBalance: 47235.67,
      availableBalance: 45000.00,
      isPrimary: true,
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });

  // Savings Account
  const savingsAccount = await prisma.bankAccount.create({
    data: {
      orgId,
      name: 'Business Savings',
      accountNumber: 'DE89370400440532013001',
      iban: 'DE89370400440532013001',
      bic: 'COBADEFFXXX',
      bankName: 'Deutsche Bank',
      currency: 'EUR',
      accountType: 'savings',
      currentBalance: 25000.00,
      availableBalance: 25000.00,
      isPrimary: false,
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });

  // PayPal Business
  const paypalAccount = await prisma.bankAccount.create({
    data: {
      orgId,
      name: 'PayPal Business',
      accountNumber: 'business@acme.de',
      bankName: 'PayPal',
      currency: 'EUR',
      accountType: 'checking',
      currentBalance: 3420.15,
      availableBalance: 3420.15,
      isPrimary: false,
      isActive: true,
      lastSyncedAt: new Date(),
      provider: 'paypal',
    },
  });

  console.log(`Created 3 bank accounts ✓`);

  // ========================================
  // BANK TRANSACTIONS - Realistic mix
  // ========================================
  console.log('\nCreating bank transactions...');
  const transactions = [];

  // ---- INCOME TRANSACTIONS ----
  // Invoice payment from TechCorp
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(10),
      amount: 17850,
      currency: 'EUR',
      description: 'TechCorp Solutions GmbH - Invoice INV-2024-0001',
      type: 'credit',
      category: 'income',
      counterpartyName: 'TechCorp Solutions GmbH',
      counterpartyIban: 'DE89370400440532014000',
      reference: 'INV-2024-0001',
      isReconciled: true,
    },
  }));

  // Partial invoice payment
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(5),
      amount: 7140,
      currency: 'EUR',
      description: 'TechCorp Solutions - 50% Deposit INV-2024-0005',
      type: 'credit',
      category: 'income',
      counterpartyName: 'TechCorp Solutions GmbH',
      reference: 'INV-2024-0005-DEP',
      isReconciled: true,
    },
  }));

  // PayPal transfers
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: paypalAccount.id,
      transactionId: txnRef(),
      date: daysAgo(3),
      amount: 420.15,
      currency: 'EUR',
      description: 'Payment received - Consulting Services',
      type: 'credit',
      category: 'income',
      counterpartyName: 'PayPal Customer',
      isReconciled: false,
    },
  }));

  // ---- EXPENSE TRANSACTIONS ----
  // AWS
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(15),
      amount: -287.34,
      currency: 'EUR',
      description: 'AWS EMEA aws.amazon.com',
      type: 'debit',
      category: 'software',
      counterpartyName: 'Amazon Web Services',
      isReconciled: true,
    },
  }));

  // GitHub
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(12),
      amount: -44.00,
      currency: 'EUR',
      description: 'GITHUB INC. GITHUB.COM',
      type: 'debit',
      category: 'software',
      counterpartyName: 'GitHub Inc',
      isReconciled: true,
    },
  }));

  // Office rent
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(30),
      amount: -1785,
      currency: 'EUR',
      description: 'WeWork Berlin - Office Rental December',
      type: 'debit',
      category: 'rent',
      counterpartyName: 'WeWork Germany GmbH',
      isReconciled: true,
    },
  }));

  // Server hosting
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(33),
      amount: -355.81,
      currency: 'EUR',
      description: 'Cloudways - Server Hosting November',
      type: 'debit',
      category: 'hosting',
      counterpartyName: 'Cloudways Ltd',
      isReconciled: true,
    },
  }));

  // Payroll
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(28),
      amount: -11800,
      currency: 'EUR',
      description: 'Payroll November 2024 - 3 Employees',
      type: 'debit',
      category: 'payroll',
      counterpartyName: 'Multiple Recipients',
      reference: 'PAYROLL-2024-11',
      isReconciled: true,
    },
  }));

  // Tax payment
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(25),
      amount: -3500,
      currency: 'EUR',
      description: 'Finanzamt Berlin - VAT Q3 2024',
      type: 'debit',
      category: 'tax',
      counterpartyName: 'Finanzamt Berlin',
      reference: 'VAT-2024-Q3',
      isReconciled: true,
    },
  }));

  // Business meals
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(8),
      amount: -87.50,
      currency: 'EUR',
      description: 'Restaurant Zur Linde Berlin',
      type: 'debit',
      category: 'meals',
      counterpartyName: 'Restaurant Zur Linde',
      isReconciled: false,
    },
  }));

  // Travel
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(14),
      amount: -159.00,
      currency: 'EUR',
      description: 'DB Bahn Ticket Berlin-Munich',
      type: 'debit',
      category: 'travel',
      counterpartyName: 'Deutsche Bahn AG',
      isReconciled: false,
    },
  }));

  // ---- TRANSFER TRANSACTIONS ----
  // Transfer to savings
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(20),
      amount: -5000,
      currency: 'EUR',
      description: 'Transfer to Business Savings - Tax Reserve',
      type: 'debit',
      category: 'transfer',
      counterpartyName: 'Business Savings',
      counterpartyIban: 'DE89370400440532013001',
      isReconciled: true,
    },
  }));

  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: savingsAccount.id,
      transactionId: txnRef(),
      date: daysAgo(20),
      amount: 5000,
      currency: 'EUR',
      description: 'Transfer from Deutsche Bank Business - Tax Reserve',
      type: 'credit',
      category: 'transfer',
      counterpartyName: 'Deutsche Bank Business',
      counterpartyIban: 'DE89370400440532013000',
      isReconciled: true,
    },
  }));

  // ---- PENDING TRANSACTIONS (for testing) ----
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(1),
      amount: -125.00,
      currency: 'EUR',
      description: 'Office Supplies Amazon.de',
      type: 'debit',
      category: 'office',
      counterpartyName: 'Amazon EU S.a.r.l.',
      isReconciled: false,
    },
  }));

  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(0),
      amount: 2856,
      currency: 'EUR',
      description: 'Hans Schneider - Invoice Payment',
      type: 'credit',
      category: 'income',
      counterpartyName: 'Hans Schneider',
      reference: 'INV-2024-0003',
      isReconciled: false,
    },
  }));

  // ---- UNCATEGORIZED (for AI classification testing) ----
  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(7),
      amount: -45.00,
      currency: 'EUR',
      description: 'FIGMA INC 650-555-1234',
      type: 'debit',
      category: null, // Uncategorized - for AI to classify
      counterpartyName: 'FIGMA INC',
      isReconciled: false,
    },
  }));

  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(6),
      amount: -500.00,
      currency: 'EUR',
      description: 'LINKEDIN IRELAND',
      type: 'debit',
      category: null, // Uncategorized - for AI to classify
      counterpartyName: 'LINKEDIN IRELAND',
      isReconciled: false,
    },
  }));

  transactions.push(await prisma.bankTransaction.create({
    data: {
      bankAccountId: businessAccount.id,
      transactionId: txnRef(),
      date: daysAgo(4),
      amount: -49.99,
      currency: 'EUR',
      description: 'TELEKOM DEUTSCHLAND GMBH',
      type: 'debit',
      category: null, // Uncategorized - for AI to classify
      counterpartyName: 'TELEKOM',
      isReconciled: false,
    },
  }));

  console.log(`Created ${transactions.length} transactions ✓`);

  // Summary
  const credits = transactions.filter(t => t.type === 'credit');
  const debits = transactions.filter(t => t.type === 'debit');
  const uncategorized = transactions.filter(t => !t.category);
  const unreconciled = transactions.filter(t => !t.isReconciled);

  console.log('\n' + '='.repeat(60));
  console.log('BANKING DATA SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`  Bank Accounts:   3 (business, savings, PayPal)`);
  console.log(`  Transactions:    ${transactions.length}`);
  console.log(`    - Credits:     ${credits.length} (income)`);
  console.log(`    - Debits:      ${debits.length} (expenses)`);
  console.log(`    - Uncategorized: ${uncategorized.length} (for AI testing)`);
  console.log(`    - Unreconciled:  ${unreconciled.length} (for reconciliation testing)`);
  console.log('='.repeat(60));

  return {
    accounts: [businessAccount, savingsAccount, paypalAccount],
    transactions,
  };
}
