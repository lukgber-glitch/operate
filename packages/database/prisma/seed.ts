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
import { seedCountries } from './seeds/countries';
import { seedHr } from './seeds/hr';

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

  // Seed country context data first
  console.log('='.repeat(60));
  console.log('STEP 1: Seeding Country Context');
  console.log('='.repeat(60));
  await seedCountries();

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

  // Seed HR data
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Seeding HR Data');
  console.log('='.repeat(60));
  await seedHr();

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
  console.log('\nCountry Context: Germany (DE), Austria (AT), Switzerland (CH)');
  console.log('HR Data:          3 Employees, 3 Contracts, Payroll, Leave, Time');
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
