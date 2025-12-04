/**
 * HR Seed Data
 *
 * Seeds HR-related data for development and testing:
 * - Sample employees
 * - Employment contracts
 * - Leave entitlements
 * - Payroll periods
 *
 * This seed data is based on the "Acme GmbH" organization created in the main seed.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed HR data
 */
export async function seedHr() {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING HR DATA');
  console.log('='.repeat(60));

  // Find the Acme organization (created in main seed)
  const org = await prisma.organisation.findUnique({
    where: { slug: 'acme' },
  });

  if (!org) {
    console.log('⚠️  Organization "Acme" not found. Skipping HR seed.');
    return;
  }

  console.log(`\nSeeding HR data for: ${org.name}`);

  // Clean existing HR data for this organization (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCleaning existing HR data...');
    await prisma.hrAuditLog.deleteMany({ where: { orgId: org.id } });
    await prisma.payslip.deleteMany({
      where: { employee: { orgId: org.id } },
    });
    await prisma.payrollPeriod.deleteMany({ where: { orgId: org.id } });
    await prisma.socialSecurityRegistration.deleteMany({
      where: { employee: { orgId: org.id } },
    });
    await prisma.timeEntry.deleteMany({
      where: { employee: { orgId: org.id } },
    });
    await prisma.leaveRequest.deleteMany({
      where: { employee: { orgId: org.id } },
    });
    await prisma.leaveEntitlement.deleteMany({
      where: { employee: { orgId: org.id } },
    });
    await prisma.employmentContract.deleteMany({
      where: { employee: { orgId: org.id } },
    });
    await prisma.employee.deleteMany({ where: { orgId: org.id } });
    console.log('Cleaned ✓');
  }

  // Create sample employees
  console.log('\nCreating employees...');

  const employee1 = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-001',
      firstName: 'Max',
      lastName: 'Müller',
      email: 'max.mueller@acme.de',
      phone: '+49 30 12345678',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE',
      nationality: 'DE',
      street: 'Hauptstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      countryCode: 'DE',
      taxId: 'DE123456789',
      taxClass: 'I',
      churchTax: false,
      bankName: 'Deutsche Bank',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      status: 'ACTIVE',
      hireDate: new Date('2020-01-15'),
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-002',
      firstName: 'Anna',
      lastName: 'Schmidt',
      email: 'anna.schmidt@acme.de',
      phone: '+49 30 23456789',
      dateOfBirth: new Date('1985-08-22'),
      gender: 'FEMALE',
      nationality: 'DE',
      street: 'Lindenstraße 45',
      city: 'Berlin',
      postalCode: '10969',
      countryCode: 'DE',
      taxId: 'DE987654321',
      taxClass: 'III',
      churchTax: true,
      bankName: 'Commerzbank',
      iban: 'DE89370400440532013001',
      bic: 'COBADEFFYYY',
      status: 'ACTIVE',
      hireDate: new Date('2018-06-01'),
    },
  });

  const employee3 = await prisma.employee.create({
    data: {
      orgId: org.id,
      employeeNumber: 'EMP-003',
      firstName: 'Thomas',
      lastName: 'Weber',
      email: 'thomas.weber@acme.de',
      phone: '+49 30 34567890',
      dateOfBirth: new Date('1995-11-30'),
      gender: 'MALE',
      nationality: 'DE',
      street: 'Friedrichstraße 78',
      city: 'Berlin',
      postalCode: '10117',
      countryCode: 'DE',
      taxId: 'DE456789123',
      taxClass: 'I',
      churchTax: false,
      bankName: 'N26',
      iban: 'DE89370400440532013002',
      bic: 'NTSBDEB1XXX',
      status: 'ACTIVE',
      hireDate: new Date('2022-03-01'),
    },
  });

  console.log(`Created ${3} employees ✓`);

  // Create employment contracts
  console.log('\nCreating employment contracts...');

  await prisma.employmentContract.create({
    data: {
      employeeId: employee1.id,
      contractType: 'PERMANENT',
      title: 'Senior Software Engineer',
      department: 'Engineering',
      startDate: new Date('2020-01-15'),
      probationEnd: new Date('2020-07-14'),
      salaryAmount: 75000,
      salaryCurrency: 'EUR',
      salaryPeriod: 'ANNUAL',
      weeklyHours: 40,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      benefits: {
        healthInsurance: true,
        pensionPlan: true,
        gymMembership: true,
        publicTransport: true,
      },
      isActive: true,
    },
  });

  await prisma.employmentContract.create({
    data: {
      employeeId: employee2.id,
      contractType: 'PERMANENT',
      title: 'Product Manager',
      department: 'Product',
      startDate: new Date('2018-06-01'),
      probationEnd: new Date('2018-11-30'),
      salaryAmount: 85000,
      salaryCurrency: 'EUR',
      salaryPeriod: 'ANNUAL',
      weeklyHours: 40,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      benefits: {
        healthInsurance: true,
        pensionPlan: true,
        companyPhone: true,
        publicTransport: true,
      },
      isActive: true,
    },
  });

  await prisma.employmentContract.create({
    data: {
      employeeId: employee3.id,
      contractType: 'PERMANENT',
      title: 'Junior Software Engineer',
      department: 'Engineering',
      startDate: new Date('2022-03-01'),
      probationEnd: new Date('2022-08-31'),
      salaryAmount: 55000,
      salaryCurrency: 'EUR',
      salaryPeriod: 'ANNUAL',
      weeklyHours: 40,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      benefits: {
        healthInsurance: true,
        pensionPlan: true,
        gymMembership: true,
      },
      isActive: true,
    },
  });

  console.log(`Created ${3} employment contracts ✓`);

  // Create leave entitlements for current year
  console.log('\nCreating leave entitlements...');
  const currentYear = new Date().getFullYear();

  // Max Müller - 30 days annual leave
  await prisma.leaveEntitlement.create({
    data: {
      employeeId: employee1.id,
      year: currentYear,
      leaveType: 'ANNUAL',
      totalDays: 30,
      usedDays: 5,
      carriedOver: 2,
    },
  });

  // Anna Schmidt - 30 days annual leave
  await prisma.leaveEntitlement.create({
    data: {
      employeeId: employee2.id,
      year: currentYear,
      leaveType: 'ANNUAL',
      totalDays: 30,
      usedDays: 8,
      carriedOver: 0,
    },
  });

  // Thomas Weber - 28 days annual leave (newer employee)
  await prisma.leaveEntitlement.create({
    data: {
      employeeId: employee3.id,
      year: currentYear,
      leaveType: 'ANNUAL',
      totalDays: 28,
      usedDays: 3,
      carriedOver: 0,
    },
  });

  console.log(`Created ${3} leave entitlements ✓`);

  // Create sample leave requests
  console.log('\nCreating leave requests...');

  await prisma.leaveRequest.create({
    data: {
      employeeId: employee1.id,
      leaveType: 'ANNUAL',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-05'),
      totalDays: 5,
      reason: 'Summer vacation',
      status: 'APPROVED',
      reviewedAt: new Date('2024-06-15'),
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: employee2.id,
      leaveType: 'ANNUAL',
      startDate: new Date('2024-08-15'),
      endDate: new Date('2024-08-30'),
      totalDays: 12,
      reason: 'Family vacation',
      status: 'PENDING',
    },
  });

  console.log(`Created ${2} leave requests ✓`);

  // Create payroll period
  console.log('\nCreating payroll period...');

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const payrollPeriod = await prisma.payrollPeriod.create({
    data: {
      orgId: org.id,
      year: lastMonth.getFullYear(),
      month: lastMonth.getMonth() + 1,
      status: 'COMPLETED',
      processedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 5),
    },
  });

  console.log(`Created payroll period for ${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1} ✓`);

  // Create sample payslips
  console.log('\nCreating payslips...');

  await prisma.payslip.create({
    data: {
      employeeId: employee1.id,
      payrollPeriodId: payrollPeriod.id,
      grossSalary: 6250, // 75000 / 12
      netSalary: 4100,
      deductions: {
        incomeTax: 1150,
        healthInsurance: 500,
        pensionInsurance: 300,
        unemploymentInsurance: 100,
        other: 100,
      },
      paidAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 10),
      paymentRef: `PAY-${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}-001`,
    },
  });

  await prisma.payslip.create({
    data: {
      employeeId: employee2.id,
      payrollPeriodId: payrollPeriod.id,
      grossSalary: 7083, // 85000 / 12
      netSalary: 4600,
      deductions: {
        incomeTax: 1383,
        healthInsurance: 550,
        pensionInsurance: 350,
        unemploymentInsurance: 100,
        churchTax: 100,
      },
      paidAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 10),
      paymentRef: `PAY-${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}-002`,
    },
  });

  await prisma.payslip.create({
    data: {
      employeeId: employee3.id,
      payrollPeriodId: payrollPeriod.id,
      grossSalary: 4583, // 55000 / 12
      netSalary: 3100,
      deductions: {
        incomeTax: 683,
        healthInsurance: 400,
        pensionInsurance: 250,
        unemploymentInsurance: 100,
        other: 50,
      },
      paidAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 10),
      paymentRef: `PAY-${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}-003`,
    },
  });

  console.log(`Created ${3} payslips ✓`);

  // Create sample time entries
  console.log('\nCreating time entries...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.timeEntry.create({
    data: {
      employeeId: employee1.id,
      date: yesterday,
      startTime: new Date(yesterday.setHours(9, 0, 0)),
      endTime: new Date(yesterday.setHours(17, 30, 0)),
      breakMinutes: 30,
      totalHours: 8,
      overtimeHours: 0,
      projectCode: 'PROJ-001',
      description: 'Backend API development',
      status: 'APPROVED',
    },
  });

  await prisma.timeEntry.create({
    data: {
      employeeId: employee3.id,
      date: yesterday,
      startTime: new Date(yesterday.setHours(9, 0, 0)),
      endTime: new Date(yesterday.setHours(18, 0, 0)),
      breakMinutes: 60,
      totalHours: 8,
      overtimeHours: 0,
      projectCode: 'PROJ-001',
      description: 'Frontend development',
      status: 'SUBMITTED',
    },
  });

  console.log(`Created ${2} time entries ✓`);

  // Create social security registrations
  console.log('\nCreating social security registrations...');

  await prisma.socialSecurityRegistration.create({
    data: {
      employeeId: employee1.id,
      countryCode: 'DE',
      registrationId: 'SV-12345678901',
      provider: 'Techniker Krankenkasse',
      type: 'HEALTH',
      startDate: new Date('2020-01-15'),
      status: 'CONFIRMED',
      submittedAt: new Date('2020-01-10'),
      confirmedAt: new Date('2020-01-14'),
    },
  });

  await prisma.socialSecurityRegistration.create({
    data: {
      employeeId: employee2.id,
      countryCode: 'DE',
      registrationId: 'SV-98765432109',
      provider: 'AOK',
      type: 'HEALTH',
      startDate: new Date('2018-06-01'),
      status: 'CONFIRMED',
      submittedAt: new Date('2018-05-25'),
      confirmedAt: new Date('2018-05-31'),
    },
  });

  await prisma.socialSecurityRegistration.create({
    data: {
      employeeId: employee3.id,
      countryCode: 'DE',
      registrationId: 'SV-45678901234',
      provider: 'Barmer',
      type: 'HEALTH',
      startDate: new Date('2022-03-01'),
      status: 'CONFIRMED',
      submittedAt: new Date('2022-02-20'),
      confirmedAt: new Date('2022-02-28'),
    },
  });

  console.log(`Created ${3} social security registrations ✓`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('HR DATA SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('\nSummary:');
  console.log(`  Employees:              ${3}`);
  console.log(`  Employment Contracts:   ${3}`);
  console.log(`  Leave Entitlements:     ${3}`);
  console.log(`  Leave Requests:         ${2}`);
  console.log(`  Payroll Periods:        ${1}`);
  console.log(`  Payslips:               ${3}`);
  console.log(`  Time Entries:           ${2}`);
  console.log(`  SS Registrations:       ${3}`);
  console.log('='.repeat(60));
}

/**
 * Run seed independently
 */
if (require.main === module) {
  seedHr()
    .catch((error) => {
      console.error('HR seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
