/**
 * Finance Seed Data - Comprehensive Test Company
 *
 * Creates realistic financial data for testing:
 * - Invoices (paid, pending, overdue)
 * - Expenses (various categories)
 * - Bills (AP workflow)
 * - Quotes (accepted, pending)
 * - Mileage entries
 */

import { PrismaClient, InvoiceStatus, ExpenseStatus, ExpenseCategory, BillStatus, QuoteStatus, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContext {
  orgId: string;
  clientIds: string[];
  vendorIds: string[];
  employeeIds: string[];
}

/**
 * Generate invoice number
 */
function invoiceNumber(index: number): string {
  return `INV-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`;
}

/**
 * Generate bill number
 */
function billNumber(index: number): string {
  return `BILL-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`;
}

/**
 * Generate expense reference
 */
function expenseRef(index: number): string {
  return `EXP-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`;
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
 * Get date N days from now
 */
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export async function seedFinance(context: SeedContext) {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING FINANCE DATA');
  console.log('='.repeat(60));

  const { orgId, clientIds, vendorIds, employeeIds } = context;

  // Clean existing finance data
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCleaning existing finance data...');
    await prisma.invoiceItem.deleteMany({ where: { invoice: { orgId } } });
    await prisma.invoice.deleteMany({ where: { orgId } });
    await prisma.expense.deleteMany({ where: { orgId } });
    await prisma.billLineItem.deleteMany({ where: { bill: { organisationId: orgId } } });
    await prisma.billPayment.deleteMany({ where: { bill: { organisationId: orgId } } });
    await prisma.bill.deleteMany({ where: { organisationId: orgId } });
    await prisma.quoteItem.deleteMany({ where: { quote: { organisationId: orgId } } });
    await prisma.quote.deleteMany({ where: { organisationId: orgId } });
    await prisma.mileageEntry.deleteMany({ where: { organisationId: orgId } });
    console.log('Cleaned ✓\n');
  }

  // ========================================
  // INVOICES - Various states for testing
  // ========================================
  console.log('Creating invoices...');
  const invoices = [];

  // Invoice 1: PAID - Large project invoice
  const inv1 = await prisma.invoice.create({
    data: {
      orgId,
      clientId: clientIds[0], // TechCorp
      customerName: 'TechCorp Solutions GmbH',
      number: invoiceNumber(1),
      status: InvoiceStatus.PAID,
      issueDate: daysAgo(45),
      dueDate: daysAgo(15),
      paidDate: daysAgo(10),
      currency: 'EUR',
      subtotal: 15000,
      taxAmount: 2850, // 19% VAT
      vatRate: 19,
      totalAmount: 17850,
      notes: 'Q4 Platform Development - Phase 1',
      paymentTerms: '30',
      paymentMethod: 'bank_transfer',
      items: {
        create: [
          {
            description: 'Platform Development - Backend API',
            quantity: 80,
            unitPrice: 125,
            amount: 10000,
            taxRate: 19,
          },
          {
            description: 'Platform Development - Frontend',
            quantity: 40,
            unitPrice: 125,
            amount: 5000,
            taxRate: 19,
          },
        ],
      },
    },
  });
  invoices.push(inv1);

  // Invoice 2: SENT - Pending payment
  const inv2 = await prisma.invoice.create({
    data: {
      orgId,
      clientId: clientIds[1], // Design Studio
      customerName: 'Design Studio Berlin',
      number: invoiceNumber(2),
      status: InvoiceStatus.SENT,
      issueDate: daysAgo(10),
      dueDate: daysFromNow(4),
      currency: 'EUR',
      subtotal: 4500,
      taxAmount: 855,
      vatRate: 19,
      totalAmount: 5355,
      notes: 'Monthly Retainer - December 2024',
      paymentTerms: '14',
      items: {
        create: [
          {
            description: 'Monthly Retainer - Support & Maintenance',
            quantity: 1,
            unitPrice: 3000,
            amount: 3000,
            taxRate: 19,
          },
          {
            description: 'Additional Development Hours',
            quantity: 12,
            unitPrice: 125,
            amount: 1500,
            taxRate: 19,
          },
        ],
      },
    },
  });
  invoices.push(inv2);

  // Invoice 3: OVERDUE - Past due date
  const inv3 = await prisma.invoice.create({
    data: {
      orgId,
      clientId: clientIds[2], // Hans Schneider
      customerName: 'Hans Schneider',
      number: invoiceNumber(3),
      status: InvoiceStatus.OVERDUE,
      issueDate: daysAgo(40),
      dueDate: daysAgo(33),
      currency: 'EUR',
      subtotal: 2400,
      taxAmount: 456,
      vatRate: 19,
      totalAmount: 2856,
      notes: 'Consulting Services - November',
      paymentTerms: '7',
      items: {
        create: [
          {
            description: 'Business Consulting - Strategy Session',
            quantity: 8,
            unitPrice: 150,
            amount: 1200,
            taxRate: 19,
          },
          {
            description: 'Business Consulting - Implementation Support',
            quantity: 8,
            unitPrice: 150,
            amount: 1200,
            taxRate: 19,
          },
        ],
      },
    },
  });
  invoices.push(inv3);

  // Invoice 4: DRAFT - Not yet sent
  const inv4 = await prisma.invoice.create({
    data: {
      orgId,
      clientId: clientIds[4], // Alpine Solutions
      customerName: 'Alpine Solutions GmbH',
      number: invoiceNumber(4),
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(),
      dueDate: daysFromNow(21),
      currency: 'EUR',
      subtotal: 8750,
      taxAmount: 1662.5,
      vatRate: 19,
      totalAmount: 10412.5,
      notes: 'Cross-border logistics integration project',
      paymentTerms: '21',
      items: {
        create: [
          {
            description: 'Logistics API Integration',
            quantity: 50,
            unitPrice: 125,
            amount: 6250,
            taxRate: 19,
          },
          {
            description: 'Data Migration Services',
            quantity: 20,
            unitPrice: 125,
            amount: 2500,
            taxRate: 19,
          },
        ],
      },
    },
  });
  invoices.push(inv4);

  // Invoice 5: PARTIAL - Partially paid
  const inv5 = await prisma.invoice.create({
    data: {
      orgId,
      clientId: clientIds[0], // TechCorp
      customerName: 'TechCorp Solutions GmbH',
      number: invoiceNumber(5),
      status: InvoiceStatus.PARTIAL,
      issueDate: daysAgo(20),
      dueDate: daysFromNow(10),
      currency: 'EUR',
      subtotal: 12000,
      taxAmount: 2280,
      vatRate: 19,
      totalAmount: 14280,
      notes: 'Q4 Platform Development - Phase 2 (50% deposit received)',
      paymentTerms: '30',
      items: {
        create: [
          {
            description: 'Platform Development - Mobile App',
            quantity: 60,
            unitPrice: 150,
            amount: 9000,
            taxRate: 19,
          },
          {
            description: 'QA Testing & Documentation',
            quantity: 20,
            unitPrice: 150,
            amount: 3000,
            taxRate: 19,
          },
        ],
      },
    },
  });
  invoices.push(inv5);

  console.log(`Created ${invoices.length} invoices ✓`);

  // ========================================
  // EXPENSES - Various categories
  // ========================================
  console.log('\nCreating expenses...');
  const expenses = [];

  const expenseData = [
    { category: ExpenseCategory.OFFICE, description: 'Office Supplies - Stationery', amount: 89.50, vendorName: 'Amazon Business' },
    { category: ExpenseCategory.SOFTWARE, description: 'GitHub Team Subscription', amount: 44.00, vendorName: 'GitHub' },
    { category: ExpenseCategory.SOFTWARE, description: 'Figma Professional', amount: 45.00, vendorName: 'Figma' },
    { category: ExpenseCategory.SOFTWARE, description: 'AWS Monthly Services', amount: 287.34, vendorName: 'Amazon Web Services' },
    { category: ExpenseCategory.TRAVEL, description: 'Train to Munich - Client Meeting', amount: 159.00, vendorName: 'Deutsche Bahn' },
    { category: ExpenseCategory.MEALS, description: 'Client Lunch - TechCorp Meeting', amount: 87.50, vendorName: 'Restaurant Zur Linde' },
    { category: ExpenseCategory.EQUIPMENT, description: 'Monitor Stand (ergonomic)', amount: 149.99, vendorName: 'IKEA Business' },
    { category: ExpenseCategory.MARKETING, description: 'LinkedIn Ads - December Campaign', amount: 500.00, vendorName: 'LinkedIn' },
    { category: ExpenseCategory.PROFESSIONAL_SERVICES, description: 'Legal Consultation - Contract Review', amount: 350.00, vendorName: 'Kanzlei Müller & Partner' },
    { category: ExpenseCategory.UTILITIES, description: 'Office Internet - December', amount: 49.99, vendorName: 'Telekom' },
    { category: ExpenseCategory.INSURANCE, description: 'Business Liability Insurance - Q4', amount: 425.00, vendorName: 'Allianz' },
    { category: ExpenseCategory.RENT, description: 'Co-working Space - December', amount: 450.00, vendorName: 'WeWork Berlin' },
  ];

  for (let i = 0; i < expenseData.length; i++) {
    const exp = expenseData[i];
    const status = i < 8 ? ExpenseStatus.APPROVED : (i < 10 ? ExpenseStatus.PENDING : ExpenseStatus.DRAFT);

    const expense = await prisma.expense.create({
      data: {
        orgId,
        description: exp.description,
        category: exp.category,
        vendorName: exp.vendorName,
        amount: exp.amount,
        currency: 'EUR',
        vatAmount: exp.amount * 0.19,
        vatRate: 19,
        date: daysAgo(Math.floor(Math.random() * 30)),
        status,
        paymentMethod: i % 3 === 0 ? 'credit_card' : (i % 3 === 1 ? 'bank_transfer' : 'cash'),
        receiptUrl: `https://storage.operate.guru/receipts/${expenseRef(i + 1)}.pdf`,
      },
    });
    expenses.push(expense);
  }

  console.log(`Created ${expenses.length} expenses ✓`);

  // ========================================
  // BILLS (Accounts Payable)
  // ========================================
  console.log('\nCreating bills...');
  const bills = [];

  // Bill 1: PAID - Monthly hosting
  const bill1 = await prisma.bill.create({
    data: {
      organisationId: orgId,
      vendorId: vendorIds[0],
      vendorName: 'Cloudways Ltd',
      billNumber: billNumber(1),
      status: BillStatus.PAID,
      issueDate: daysAgo(35),
      dueDate: daysAgo(5),
      paidDate: daysAgo(3),
      currency: 'EUR',
      amount: 299,
      taxAmount: 56.81,
      totalAmount: 355.81,
      paidAmount: 355.81,
      description: 'Monthly Server Hosting - November',
      lineItems: {
        create: [
          {
            description: 'Dedicated Server - Production',
            quantity: 1,
            unitPrice: 199,
            amount: 199,
          },
          {
            description: 'Managed Database - PostgreSQL',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      },
    },
  });
  bills.push(bill1);

  // Bill 2: PENDING - Office rent
  const bill2 = await prisma.bill.create({
    data: {
      organisationId: orgId,
      vendorId: vendorIds[1],
      vendorName: 'WeWork Germany GmbH',
      billNumber: billNumber(2),
      status: BillStatus.PENDING,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(10),
      currency: 'EUR',
      amount: 1500,
      taxAmount: 285,
      totalAmount: 1785,
      paidAmount: 0,
      description: 'Office Space Rental - December',
      lineItems: {
        create: [
          {
            description: 'Office Space - 50sqm',
            quantity: 1,
            unitPrice: 1200,
            amount: 1200,
          },
          {
            description: 'Utilities & Services',
            quantity: 1,
            unitPrice: 300,
            amount: 300,
          },
        ],
      },
    },
  });
  bills.push(bill2);

  // Bill 3: OVERDUE - Marketing services
  const bill3 = await prisma.bill.create({
    data: {
      organisationId: orgId,
      vendorId: vendorIds[2],
      vendorName: 'Digital Marketing Experts GmbH',
      billNumber: billNumber(3),
      status: BillStatus.OVERDUE,
      issueDate: daysAgo(45),
      dueDate: daysAgo(15),
      currency: 'EUR',
      amount: 2500,
      taxAmount: 475,
      totalAmount: 2975,
      paidAmount: 0,
      description: 'Q4 Marketing Campaign - SEO & Content',
      lineItems: {
        create: [
          {
            description: 'SEO Optimization Package',
            quantity: 1,
            unitPrice: 1500,
            amount: 1500,
          },
          {
            description: 'Content Creation - 10 Blog Posts',
            quantity: 10,
            unitPrice: 100,
            amount: 1000,
          },
        ],
      },
    },
  });
  bills.push(bill3);

  // Bill 4: DRAFT - New equipment order
  const bill4 = await prisma.bill.create({
    data: {
      organisationId: orgId,
      vendorId: vendorIds[3],
      vendorName: 'Tech Equipment GmbH',
      billNumber: billNumber(4),
      status: BillStatus.DRAFT,
      issueDate: new Date(),
      dueDate: daysFromNow(30),
      currency: 'EUR',
      amount: 4500,
      taxAmount: 855,
      totalAmount: 5355,
      paidAmount: 0,
      description: 'New Development Workstations',
      lineItems: {
        create: [
          {
            description: 'MacBook Pro 16" M3 Max',
            quantity: 2,
            unitPrice: 1999,
            amount: 3998,
          },
          {
            description: 'Dell 32" 4K Monitor',
            quantity: 2,
            unitPrice: 251,
            amount: 502,
          },
        ],
      },
    },
  });
  bills.push(bill4);

  console.log(`Created ${bills.length} bills ✓`);

  // ========================================
  // QUOTES
  // ========================================
  console.log('\nCreating quotes...');
  const quotes = [];

  // Quote 1: ACCEPTED - Converted to invoice
  const quote1 = await prisma.quote.create({
    data: {
      organisationId: orgId,
      clientId: clientIds[0],
      quoteNumber: 'QT-2024-001',
      title: 'Q4 Platform Development Proposal',
      status: QuoteStatus.ACCEPTED,
      currency: 'EUR',
      subtotal: 15000,
      taxAmount: 2850,
      total: 17850,
      description: 'Full-stack platform development including backend API and frontend',
      sentAt: daysAgo(60),
      acceptedAt: daysAgo(55),
      items: {
        create: [
          {
            description: 'Platform Development - Full Stack',
            quantity: 120,
            unitPrice: 125,
            total: 15000,
          },
        ],
      },
    },
  });
  quotes.push(quote1);

  // Quote 2: SENT - Awaiting response
  const quote2 = await prisma.quote.create({
    data: {
      organisationId: orgId,
      clientId: clientIds[3], // Future Industries (prospect)
      quoteNumber: 'QT-2024-002',
      title: 'Enterprise Platform Migration Proposal',
      status: QuoteStatus.SENT,
      currency: 'CHF',
      subtotal: 45000,
      taxAmount: 3465, // 7.7% Swiss VAT
      total: 48465,
      description: 'Full enterprise platform migration including discovery, development, testing, and training',
      sentAt: daysAgo(7),
      items: {
        create: [
          {
            description: 'Discovery & Planning Phase',
            quantity: 40,
            unitPrice: 175,
            total: 7000,
          },
          {
            description: 'Development & Implementation',
            quantity: 160,
            unitPrice: 175,
            total: 28000,
          },
          {
            description: 'Testing & Deployment',
            quantity: 40,
            unitPrice: 175,
            total: 7000,
          },
          {
            description: 'Training & Documentation',
            quantity: 20,
            unitPrice: 150,
            total: 3000,
          },
        ],
      },
    },
  });
  quotes.push(quote2);

  // Quote 3: DRAFT
  const quote3 = await prisma.quote.create({
    data: {
      organisationId: orgId,
      clientId: clientIds[4],
      quoteNumber: 'QT-2024-003',
      title: 'Mobile App Development - Phase 1',
      status: QuoteStatus.DRAFT,
      currency: 'EUR',
      subtotal: 7500,
      taxAmount: 1425,
      total: 8925,
      description: 'Mobile app development for iOS and Android platforms',
      items: {
        create: [
          {
            description: 'Mobile App - iOS Development',
            quantity: 30,
            unitPrice: 150,
            total: 4500,
          },
          {
            description: 'Mobile App - Android Development',
            quantity: 20,
            unitPrice: 150,
            total: 3000,
          },
        ],
      },
    },
  });
  quotes.push(quote3);

  console.log(`Created ${quotes.length} quotes ✓`);

  // ========================================
  // MILEAGE ENTRIES
  // ========================================
  console.log('\nCreating mileage entries...');
  const mileageEntries = [];

  const mileageData = [
    { from: 'Berlin Office', to: 'TechCorp HQ, Munich', distanceKm: 584, purpose: 'Client Meeting - Q4 Review' },
    { from: 'Berlin Office', to: 'Design Studio, Kreuzberg', distanceKm: 12, purpose: 'Project Kickoff Meeting' },
    { from: 'Berlin Office', to: 'Hamburg Airport', distanceKm: 289, purpose: 'Client Visit - Alpine Solutions' },
    { from: 'Berlin Office', to: 'Frankfurt Trade Fair', distanceKm: 423, purpose: 'Industry Conference' },
    { from: 'Home Office', to: 'Berlin Office', distanceKm: 15, purpose: 'Daily Commute' },
  ];

  for (let i = 0; i < mileageData.length; i++) {
    const m = mileageData[i];
    const entry = await prisma.mileageEntry.create({
      data: {
        organisationId: orgId,
        userId: employeeIds[0], // Using employee ID as user ID placeholder
        date: daysAgo(i * 7 + Math.floor(Math.random() * 5)),
        startLocation: m.from,
        endLocation: m.to,
        distanceKm: m.distanceKm,
        distanceMiles: m.distanceKm * 0.621371, // Convert to miles
        purpose: m.purpose,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.30, // €0.30 per km
        totalAmount: m.distanceKm * 0.30,
        currency: 'EUR',
        reimbursed: i < 3,
      },
    });
    mileageEntries.push(entry);
  }

  console.log(`Created ${mileageEntries.length} mileage entries ✓`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('FINANCE DATA SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`  Invoices:        ${invoices.length} (paid: 1, sent: 1, overdue: 1, draft: 1, partial: 1)`);
  console.log(`  Expenses:        ${expenses.length} (various categories and statuses)`);
  console.log(`  Bills:           ${bills.length} (paid: 1, pending: 1, overdue: 1, draft: 1)`);
  console.log(`  Quotes:          ${quotes.length} (accepted: 1, sent: 1, draft: 1)`);
  console.log(`  Mileage Entries: ${mileageEntries.length}`);
  console.log('='.repeat(60));

  return { invoices, expenses, bills, quotes, mileageEntries };
}
