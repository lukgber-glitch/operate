/**
 * Database Seeding Script
 *
 * Creates initial test data for development:
 * - Organisation: "Acme GmbH", slug: "acme", country: "DE"
 * - User: "admin@acme.de", password: "Admin123!" (hashed with bcrypt)
 * - Membership: OWNER role
 *
 * Run with: npm run db:seed
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Only import country/tax seeds if not skipping (to avoid TS compile errors in CI)
const SKIP_COUNTRY_SEED = process.env.SKIP_COUNTRY_SEED === 'true';

// Dynamic imports for optional seeds (avoids compile-time errors)
async function loadCountrySeeds() {
  const { seedCountries } = await import('./seeds/countries');
  const { seedEUCountries } = await import('./seeds/eu-countries');
  const { seedSpainTaxConfig } = await import('./seeds/spain-tax-config.seed');
  const { seedCanadaTaxConfig } = await import('./seed/canada-tax-seed');
  const { seedAustraliaTaxConfig } = await import('./seed/australia-tax-seed');
  return { seedCountries, seedEUCountries, seedSpainTaxConfig, seedCanadaTaxConfig, seedAustraliaTaxConfig };
}

// Always import these (they work correctly)
import { seedHr } from './seeds/hr';
import { seedClients } from './seeds/clients.seed';
import { seedSubscriptionTiers } from './seeds/subscription-tiers.seed';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('Starting database seed...\n');

  // Seed country context data first (optional - may fail in CI due to schema sync)
  if (!SKIP_COUNTRY_SEED) {
    try {
      const seeds = await loadCountrySeeds();

      console.log('='.repeat(60));
      console.log('STEP 1: Seeding Country Context (DACH)');
      console.log('='.repeat(60));
      await seeds.seedCountries();

      console.log('\n' + '='.repeat(60));
      console.log('STEP 1b: Seeding EU Countries (FR, IT, NL, BE, SE, IE)');
      console.log('='.repeat(60));
      await seeds.seedEUCountries();

      console.log('\n' + '='.repeat(60));
      console.log('STEP 1c: Seeding Spain Tax Configuration');
      console.log('='.repeat(60));
      await seeds.seedSpainTaxConfig();

      console.log('\n' + '='.repeat(60));
      console.log('STEP 1d: Seeding Canada Tax Configuration');
      console.log('='.repeat(60));
      await seeds.seedCanadaTaxConfig();

      console.log('\n' + '='.repeat(60));
      console.log('STEP 1e: Seeding Australia Tax Configuration');
      console.log('='.repeat(60));
      await seeds.seedAustraliaTaxConfig();
    } catch (error) {
      console.warn('Warning: Country/Tax seed failed (non-critical):', error instanceof Error ? error.message : error);
      console.log('Continuing with core data seed...\n');
    }
  } else {
    console.log('Skipping country/tax seed (SKIP_COUNTRY_SEED=true)\n');
  }

  // Clean existing data (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Seeding Core Data');
    console.log('='.repeat(60));
    console.log('\nCleaning existing data...');
    await prisma.session.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organisation.deleteMany();
    console.log('Cleaned\n');
  }

  // Create organisation
  console.log('Creating organisation...');
  const organisation = await prisma.organisation.create({
    data: {
      name: 'Acme GmbH',
      slug: 'acme',
      country: 'DE',
      currency: 'EUR',
      timezone: 'Europe/Berlin',
      settings: {},
      onboardingCompleted: true, // Mark onboarding complete for E2E tests
    },
  });
  console.log(`Created organisation: ${organisation.name} (${organisation.slug})`);

  // Create admin user
  console.log('\nCreating admin user...');
  const passwordHash = await hashPassword('Admin123!');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acme.de',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      locale: 'de',
      mfaEnabled: false,
    },
  });
  console.log(`Created user: ${adminUser.email}`);

  // Create owner membership
  console.log('\nCreating membership...');
  const membership = await prisma.membership.create({
    data: {
      userId: adminUser.id,
      orgId: organisation.id,
      role: Role.OWNER,
      acceptedAt: new Date(),
    },
  });
  console.log(`Created ${membership.role} membership for ${adminUser.email}`);

  // Create OnboardingProgress for admin user (marks onboarding as complete)
  await prisma.onboardingProgress.create({
    data: {
      userId: adminUser.id,
      orgId: organisation.id,
      currentStep: 6,
      totalSteps: 6,
      companyInfoStatus: 'COMPLETED',
      bankingStatus: 'COMPLETED',
      emailStatus: 'COMPLETED',
      taxStatus: 'COMPLETED',
      accountingStatus: 'COMPLETED',
      preferencesStatus: 'COMPLETED',
      isCompleted: true,
      completedAt: new Date(),
    },
  });
  console.log(`Created OnboardingProgress for ${adminUser.email}`);

  // Create E2E test user (ONLY in non-production - used by automated tests)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCreating E2E test user...');
    const testPasswordHash = await hashPassword('TestPassword123!');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@operate.guru',
        passwordHash: testPasswordHash,
        firstName: 'Test',
        lastName: 'User',
        locale: 'en',
        mfaEnabled: false,
      },
    });
    console.log(`Created test user: ${testUser.email}`);

    // Create test user membership
    const testMembership = await prisma.membership.create({
      data: {
        userId: testUser.id,
        orgId: organisation.id,
        role: Role.ADMIN,
        acceptedAt: new Date(),
      },
    });
    console.log(`Created ${testMembership.role} membership for ${testUser.email}`);

    // Create OnboardingProgress for test user (marks onboarding as complete)
    // Note: Using upsert since orgId is unique and admin user already created one for this org
    await prisma.onboardingProgress.upsert({
      where: { orgId: organisation.id },
      update: {
        userId: testUser.id, // Update to test user
        currentStep: 6,
        totalSteps: 6,
        companyInfoStatus: 'COMPLETED',
        bankingStatus: 'COMPLETED',
        emailStatus: 'COMPLETED',
        taxStatus: 'COMPLETED',
        accountingStatus: 'COMPLETED',
        preferencesStatus: 'COMPLETED',
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId: testUser.id,
        orgId: organisation.id,
        currentStep: 6,
        totalSteps: 6,
        companyInfoStatus: 'COMPLETED',
        bankingStatus: 'COMPLETED',
        emailStatus: 'COMPLETED',
        taxStatus: 'COMPLETED',
        accountingStatus: 'COMPLETED',
        preferencesStatus: 'COMPLETED',
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    console.log(`Created OnboardingProgress for ${testUser.email}`);
  } else {
    console.log('\nSkipping E2E test user (production mode)');
  }

  // Seed HR data
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Seeding HR Data');
  console.log('='.repeat(60));
  await seedHr();

  // Seed CRM clients
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Seeding CRM Clients');
  console.log('='.repeat(60));
  await seedClients(prisma, organisation.id);

  // Seed Subscription Tiers
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Seeding Subscription Tiers');
  console.log('='.repeat(60));
  await seedSubscriptionTiers();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('DATABASE SEEDED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\nCore Data:');
  console.log(`  Organisation: ${organisation.name}`);
  console.log(`  Slug:         ${organisation.slug}`);
  console.log(`  Admin Email:  ${adminUser.email}`);
  console.log(`  Admin Pass:   Admin123!`);
  console.log(`  Role:         ${membership.role}`);
  console.log('\nE2E Test User:');
  console.log(`  Email:        test@operate.guru`);
  console.log(`  Password:     TestPassword123!`);
  console.log(`  Role:         ADMIN`);
  console.log('\nCountry Context:');
  console.log('  DACH:  Germany (DE), Austria (AT), Switzerland (CH)');
  console.log('  EU:    France (FR), Italy (IT), Netherlands (NL),');
  console.log('         Belgium (BE), Sweden (SE), Ireland (IE)');
  console.log('  Spain: ES (with IVA, IGIC, and RE configurations)');
  console.log('HR Data:           3 Employees, 3 Contracts, Payroll, Leave, Time');
  console.log('CRM Data:          5 Clients, 6 Contacts, 6 Addresses');
  console.log('Subscription Tiers: Free, Starter, Pro, Business');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
