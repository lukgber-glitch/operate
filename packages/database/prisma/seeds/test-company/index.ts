/**
 * Comprehensive Test Company Seed
 *
 * Creates a fully-featured test company with realistic data across ALL modules:
 * - Organisation & Users
 * - HR (employees, contracts, payroll)
 * - CRM (clients, contacts)
 * - Vendors (AP suppliers)
 * - Finance (invoices, expenses, bills, quotes)
 * - Banking (accounts, transactions)
 * - AI/Chat (conversations, suggestions)
 * - Documents
 *
 * Usage:
 *   npm run db:seed:test-company
 *
 * This seed creates data suitable for:
 * - E2E testing all features
 * - Manual QA testing
 * - Demo purposes
 * - Development with realistic data
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Import sub-seeds
import { seedVendors } from './vendors.seed';
import { seedFinance } from './finance.seed';
import { seedBanking } from './banking.seed';
import { seedConversations } from './conversations.seed';
import { seedEmails } from './emails.seed';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Main seed function - creates comprehensive test company
 */
async function seedTestCompany() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         COMPREHENSIVE TEST COMPANY SEED                      ║');
  console.log('║         Creating realistic test data for all modules         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ========================================
  // STEP 1: Create Test Organisation
  // ========================================
  console.log('='.repeat(60));
  console.log('STEP 1: Creating Test Organisation');
  console.log('='.repeat(60));

  // Check if test org exists
  let testOrg = await prisma.organisation.findUnique({
    where: { slug: 'test-company' },
  });

  if (testOrg) {
    console.log('Test organisation already exists. Cleaning up...');
    // Clean related data first
    await cleanExistingData(testOrg.id);
  }

  // Create or update org
  testOrg = await prisma.organisation.upsert({
    where: { slug: 'test-company' },
    update: {
      name: 'TestCorp GmbH',
      country: 'DE',
      currency: 'EUR',
      timezone: 'Europe/Berlin',
      settings: {
        fiscalYearStart: 1,
        defaultPaymentTerms: 30,
        vatEnabled: true,
        vatRate: 19,
        invoicePrefix: 'INV',
        billPrefix: 'BILL',
        quotePrefix: 'QT',
        defaultLanguage: 'de',
      },
    },
    create: {
      name: 'TestCorp GmbH',
      slug: 'test-company',
      country: 'DE',
      currency: 'EUR',
      timezone: 'Europe/Berlin',
      settings: {
        fiscalYearStart: 1,
        defaultPaymentTerms: 30,
        vatEnabled: true,
        vatRate: 19,
        invoicePrefix: 'INV',
        billPrefix: 'BILL',
        quotePrefix: 'QT',
        defaultLanguage: 'de',
      },
    },
  });

  console.log(`✓ Organisation: ${testOrg.name} (${testOrg.slug})\n`);

  // ========================================
  // STEP 2: Create Test Users
  // ========================================
  console.log('='.repeat(60));
  console.log('STEP 2: Creating Test Users');
  console.log('='.repeat(60));

  // Owner user
  const ownerPasswordHash = await hashPassword('TestOwner123!');
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@testcorp.de' },
    update: {
      firstName: 'Maria',
      lastName: 'Owner',
      locale: 'de',
      passwordHash: ownerPasswordHash,
    },
    create: {
      email: 'owner@testcorp.de',
      passwordHash: ownerPasswordHash,
      firstName: 'Maria',
      lastName: 'Owner',
      locale: 'de',
      mfaEnabled: false,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_orgId: { userId: ownerUser.id, orgId: testOrg.id },
    },
    update: { role: Role.OWNER },
    create: {
      userId: ownerUser.id,
      orgId: testOrg.id,
      role: Role.OWNER,
      acceptedAt: new Date(),
    },
  });

  console.log(`✓ Owner: ${ownerUser.email} (password: TestOwner123!)`);

  // Admin user
  const adminPasswordHash = await hashPassword('TestAdmin123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@testcorp.de' },
    update: {
      firstName: 'Klaus',
      lastName: 'Admin',
      locale: 'de',
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@testcorp.de',
      passwordHash: adminPasswordHash,
      firstName: 'Klaus',
      lastName: 'Admin',
      locale: 'de',
      mfaEnabled: false,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_orgId: { userId: adminUser.id, orgId: testOrg.id },
    },
    update: { role: Role.ADMIN },
    create: {
      userId: adminUser.id,
      orgId: testOrg.id,
      role: Role.ADMIN,
      acceptedAt: new Date(),
    },
  });

  console.log(`✓ Admin: ${adminUser.email} (password: TestAdmin123!)`);

  // Accountant user
  const accountantPasswordHash = await hashPassword('TestAccountant123!');
  const accountantUser = await prisma.user.upsert({
    where: { email: 'accountant@testcorp.de' },
    update: {
      firstName: 'Lisa',
      lastName: 'Accountant',
      locale: 'de',
      passwordHash: accountantPasswordHash,
    },
    create: {
      email: 'accountant@testcorp.de',
      passwordHash: accountantPasswordHash,
      firstName: 'Lisa',
      lastName: 'Accountant',
      locale: 'de',
      mfaEnabled: false,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_orgId: { userId: accountantUser.id, orgId: testOrg.id },
    },
    update: { role: Role.ACCOUNTANT },
    create: {
      userId: accountantUser.id,
      orgId: testOrg.id,
      role: Role.ACCOUNTANT,
      acceptedAt: new Date(),
    },
  });

  console.log(`✓ Accountant: ${accountantUser.email} (password: TestAccountant123!)`);

  // E2E Test user (same as main seed for compatibility)
  const testPasswordHash = await hashPassword('TestPassword123!');
  const testUser = await prisma.user.upsert({
    where: { email: 'test@operate.guru' },
    update: {
      firstName: 'E2E',
      lastName: 'Tester',
      locale: 'en',
      passwordHash: testPasswordHash,
    },
    create: {
      email: 'test@operate.guru',
      passwordHash: testPasswordHash,
      firstName: 'E2E',
      lastName: 'Tester',
      locale: 'en',
      mfaEnabled: false,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_orgId: { userId: testUser.id, orgId: testOrg.id },
    },
    update: { role: Role.ADMIN },
    create: {
      userId: testUser.id,
      orgId: testOrg.id,
      role: Role.ADMIN,
      acceptedAt: new Date(),
    },
  });

  console.log(`✓ E2E Tester: ${testUser.email} (password: TestPassword123!)\n`);

  // ========================================
  // STEP 3: Seed HR Data (using existing seed)
  // ========================================
  console.log('='.repeat(60));
  console.log('STEP 3: Seeding HR Data');
  console.log('='.repeat(60));

  // Import and run HR seed (reuse existing)
  const { seedHr } = await import('../hr');

  // Temporarily set org for HR seed
  await prisma.organisation.update({
    where: { id: testOrg.id },
    data: { slug: 'acme' }, // HR seed looks for 'acme'
  });

  await seedHr();

  // Restore correct slug
  await prisma.organisation.update({
    where: { id: testOrg.id },
    data: { slug: 'test-company' },
  });

  // Get employee IDs
  const employees = await prisma.employee.findMany({
    where: { orgId: testOrg.id },
    select: { id: true },
  });
  const employeeIds = employees.map(e => e.id);

  // ========================================
  // STEP 4: Seed CRM Clients (using existing seed)
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Seeding CRM Clients');
  console.log('='.repeat(60));

  const { seedClients } = await import('../clients.seed');
  const { clients } = await seedClients(prisma, testOrg.id);
  const clientIds = clients.map((c: { id: string }) => c.id);

  // ========================================
  // STEP 5: Seed Vendors
  // ========================================
  const vendors = await seedVendors({ orgId: testOrg.id });
  const vendorIds = vendors.map(v => v.id);

  // ========================================
  // STEP 6: Seed Finance Data
  // ========================================
  const financeData = await seedFinance({
    orgId: testOrg.id,
    clientIds,
    vendorIds,
    employeeIds,
  });

  const invoiceIds = financeData.invoices.map(i => i.id);
  const expenseIds = financeData.expenses.map(e => e.id);
  const billIds = financeData.bills.map(b => b.id);

  // ========================================
  // STEP 7: Seed Banking Data
  // ========================================
  await seedBanking({
    orgId: testOrg.id,
    invoiceIds,
    expenseIds,
    billIds,
  });

  // ========================================
  // STEP 8: Seed Conversations & AI Data
  // ========================================
  await seedConversations({
    orgId: testOrg.id,
    userId: ownerUser.id,
    invoiceIds,
    billIds,
  });

  // ========================================
  // STEP 9: Seed Email Intelligence Data
  // ========================================
  await seedEmails({
    orgId: testOrg.id,
    userId: ownerUser.id,
    vendorIds,
    clientIds,
  });

  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              TEST COMPANY SEED COMPLETE!                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('='.repeat(60));
  console.log('TEST COMPANY CREDENTIALS');
  console.log('='.repeat(60));
  console.log(`Organisation: ${testOrg.name}`);
  console.log(`Slug:         ${testOrg.slug}`);
  console.log(`Country:      ${testOrg.country}`);
  console.log(`Currency:     ${testOrg.currency}`);
  console.log('');
  console.log('Users:');
  console.log(`  Owner:      owner@testcorp.de / TestOwner123!`);
  console.log(`  Admin:      admin@testcorp.de / TestAdmin123!`);
  console.log(`  Accountant: accountant@testcorp.de / TestAccountant123!`);
  console.log(`  E2E Test:   test@operate.guru / TestPassword123!`);
  console.log('');
  console.log('='.repeat(60));
  console.log('DATA SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Employees:     3`);
  console.log(`  Clients:       5`);
  console.log(`  Vendors:       10`);
  console.log(`  Invoices:      5 (paid, pending, overdue, draft, partial)`);
  console.log(`  Expenses:      12`);
  console.log(`  Bills:         4`);
  console.log(`  Quotes:        3`);
  console.log(`  Bank Accounts: 3`);
  console.log(`  Transactions:  18+`);
  console.log(`  Conversations: 4`);
  console.log(`  Suggestions:   7`);
  console.log(`  Documents:     8`);
  console.log(`  Synced Emails: 20 (invoices, bills, customers, receipts)`);
  console.log(`  Extracted Invoices: 9`);
  console.log(`  Email Suggestions:  16`);
  console.log('='.repeat(60));
  console.log('\n');
  console.log('✅ Test company is ready for testing!');
  console.log('   Login at: http://localhost:3000/login');
  console.log('\n');
}

/**
 * Clean existing data for test org
 */
async function cleanExistingData(orgId: string) {
  console.log('Cleaning existing test data...');

  // Clean email data first
  await prisma.emailExtractedEntities.deleteMany({ where: { orgId } });
  await prisma.emailAttachment.deleteMany({ where: { orgId } });
  await prisma.extractedInvoice.deleteMany({ where: { organisationId: orgId } });
  await prisma.syncedEmail.deleteMany({ where: { orgId } });
  await prisma.emailSuggestion.deleteMany({ where: { organisationId: orgId } });
  await prisma.emailForwardingInbox.deleteMany({ where: { orgId } });
  await prisma.emailConnection.deleteMany({ where: { orgId } });

  // Clean in reverse dependency order
  await prisma.messageActionLog.deleteMany({ where: { message: { conversation: { orgId } } } });
  await prisma.messageAttachment.deleteMany({ where: { message: { conversation: { orgId } } } });
  await prisma.message.deleteMany({ where: { conversation: { orgId } } });
  await prisma.conversation.deleteMany({ where: { orgId } });
  await prisma.suggestion.deleteMany({ where: { orgId } });
  await prisma.document.deleteMany({ where: { orgId } });

  await prisma.bankTransaction.deleteMany({ where: { bankAccount: { orgId } } });
  await prisma.bankAccount.deleteMany({ where: { orgId } });

  await prisma.invoiceItem.deleteMany({ where: { invoice: { orgId } } });
  await prisma.invoice.deleteMany({ where: { orgId } });
  await prisma.expense.deleteMany({ where: { orgId } });
  await prisma.billLineItem.deleteMany({ where: { bill: { organisationId: orgId } } });
  await prisma.billPayment.deleteMany({ where: { bill: { organisationId: orgId } } });
  await prisma.bill.deleteMany({ where: { organisationId: orgId } });
  await prisma.quoteItem.deleteMany({ where: { quote: { organisationId: orgId } } });
  await prisma.quote.deleteMany({ where: { organisationId: orgId } });
  await prisma.mileageEntry.deleteMany({ where: { organisationId: orgId } });

  await prisma.vendor.deleteMany({ where: { organisationId: orgId } });

  await prisma.clientCommunication.deleteMany({ where: { client: { orgId } } });
  await prisma.clientPayment.deleteMany({ where: { client: { orgId } } });
  await prisma.clientAddress.deleteMany({ where: { client: { orgId } } });
  await prisma.clientContact.deleteMany({ where: { client: { orgId } } });
  await prisma.client.deleteMany({ where: { orgId } });

  await prisma.hrAuditLog.deleteMany({ where: { orgId } });
  await prisma.payslip.deleteMany({ where: { employee: { orgId } } });
  await prisma.payrollPeriod.deleteMany({ where: { orgId } });
  await prisma.socialSecurityRegistration.deleteMany({ where: { employee: { orgId } } });
  await prisma.timeEntry.deleteMany({ where: { employee: { orgId } } });
  await prisma.leaveRequest.deleteMany({ where: { employee: { orgId } } });
  await prisma.leaveEntitlement.deleteMany({ where: { employee: { orgId } } });
  await prisma.employmentContract.deleteMany({ where: { employee: { orgId } } });
  await prisma.employee.deleteMany({ where: { orgId } });

  console.log('Cleaned ✓\n');
}

// Run seed
seedTestCompany()
  .catch((error) => {
    console.error('Test company seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedTestCompany };
