/**
 * Vendor Seed Data - Comprehensive Test Company
 *
 * Creates vendor data for accounts payable testing:
 * - Service providers
 * - Software vendors
 * - Office suppliers
 * - Professional services
 */

import { PrismaClient, VendorStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContext {
  orgId: string;
}

export async function seedVendors(context: SeedContext) {
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING VENDOR DATA');
  console.log('='.repeat(60));

  const { orgId } = context;

  // Clean existing vendor data
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nCleaning existing vendor data...');
    await prisma.vendor.deleteMany({ where: { organisationId: orgId } });
    console.log('Cleaned ✓\n');
  }

  console.log('Creating vendors...');
  const vendors = [];

  // Vendor 1: Cloud Hosting Provider
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Cloudways Ltd',
      displayName: 'Cloudways',
      email: 'billing@cloudways.com',
      phone: '+44 20 7946 0958',
      website: 'https://cloudways.com',
      taxId: 'GB123456789',
      paymentTerms: 30,
      status: VendorStatus.ACTIVE,
      notes: 'Primary cloud hosting provider. Monthly billing.',
      addressLine1: '123 Tech Park',
      city: 'London',
      postalCode: 'EC1A 1BB',
      country: 'GB',
      bankAccountName: 'Cloudways Ltd',
      bankIban: 'GB82WEST12345698765432',
      bankBic: 'BARCGB22',
      metadata: {
        category: 'hosting',
        tags: ['hosting', 'cloud', 'infrastructure'],
        accountManager: 'John Smith',
        contractEnd: '2025-12-31',
      },
    },
  }));

  // Vendor 2: Office Space
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'WeWork Germany GmbH',
      displayName: 'WeWork Berlin',
      email: 'berlin@wework.com',
      phone: '+49 30 12345678',
      website: 'https://wework.com',
      taxId: 'DE287654321',
      paymentTerms: 15,
      status: VendorStatus.ACTIVE,
      notes: 'Co-working space. Monthly lease with 3-month notice period.',
      addressLine1: 'Friedrichstraße 76',
      city: 'Berlin',
      postalCode: '10117',
      country: 'DE',
      metadata: {
        category: 'rent',
        tags: ['office', 'coworking', 'rent'],
      },
    },
  }));

  // Vendor 3: Marketing Agency
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Digital Marketing Experts GmbH',
      displayName: 'DME Agency',
      email: 'hello@dme-agency.de',
      phone: '+49 30 98765432',
      website: 'https://dme-agency.de',
      taxId: 'DE198765432',
      paymentTerms: 30,
      status: VendorStatus.ACTIVE,
      notes: 'Digital marketing agency. Project-based billing.',
      addressLine1: 'Kantstraße 55',
      city: 'Berlin',
      postalCode: '10627',
      country: 'DE',
      metadata: {
        category: 'marketing',
        tags: ['marketing', 'seo', 'content'],
        contactName: 'Thomas Creative',
      },
    },
  }));

  // Vendor 4: IT Equipment
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Tech Equipment GmbH',
      displayName: 'TechEquip',
      email: 'orders@techequip.de',
      phone: '+49 89 12345678',
      website: 'https://techequip.de',
      taxId: 'DE234567891',
      paymentTerms: 30,
      status: VendorStatus.ACTIVE,
      notes: 'IT hardware supplier. Offers volume discounts.',
      addressLine1: 'Industriestraße 100',
      city: 'Munich',
      postalCode: '80339',
      country: 'DE',
      bankAccountName: 'Tech Equipment GmbH',
      bankIban: 'DE89370400440532019876',
      bankBic: 'COBADEFFXXX',
      metadata: {
        category: 'equipment',
        tags: ['hardware', 'equipment', 'computers'],
      },
    },
  }));

  // Vendor 5: Legal Services
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Kanzlei Müller & Partner',
      displayName: 'Müller Law',
      email: 'kontakt@mueller-law.de',
      phone: '+49 30 55556666',
      website: 'https://mueller-law.de',
      taxId: 'DE345678912',
      paymentTerms: 14,
      status: VendorStatus.ACTIVE,
      notes: 'Legal advisor for contracts and compliance matters.',
      addressLine1: 'Kurfürstendamm 200',
      city: 'Berlin',
      postalCode: '10719',
      country: 'DE',
      metadata: {
        category: 'professional_services',
        tags: ['legal', 'contracts', 'compliance'],
        contactName: 'Dr. Hans Müller',
      },
    },
  }));

  // Vendor 6: AWS (Software/Cloud)
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Amazon Web Services EMEA',
      displayName: 'AWS',
      email: 'aws-emea-billing@amazon.com',
      website: 'https://aws.amazon.com',
      taxId: 'LU26888617',
      paymentTerms: 30,
      status: VendorStatus.ACTIVE,
      notes: 'Cloud infrastructure. Usage-based billing.',
      addressLine1: '38 Avenue John F. Kennedy',
      city: 'Luxembourg',
      postalCode: 'L-1855',
      country: 'LU',
      metadata: {
        category: 'software',
        tags: ['cloud', 'hosting', 'aws', 'infrastructure'],
      },
    },
  }));

  // Vendor 7: Insurance
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Allianz Versicherungs-AG',
      displayName: 'Allianz',
      email: 'business@allianz.de',
      phone: '+49 89 38000',
      website: 'https://allianz.de',
      taxId: 'DE129274114',
      paymentTerms: 30,
      status: VendorStatus.ACTIVE,
      notes: 'Business liability insurance. Quarterly billing.',
      addressLine1: 'Königinstraße 28',
      city: 'Munich',
      postalCode: '80802',
      country: 'DE',
      metadata: {
        category: 'insurance',
        tags: ['insurance', 'liability', 'business'],
      },
    },
  }));

  // Vendor 8: Accounting Services
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Steuerberatung Schmidt & Co',
      displayName: 'Schmidt Tax',
      email: 'info@schmidt-steuer.de',
      phone: '+49 30 77778888',
      website: 'https://schmidt-steuer.de',
      taxId: 'DE456789123',
      paymentTerms: 14,
      status: VendorStatus.ACTIVE,
      notes: 'Tax advisor and bookkeeping services. Monthly retainer.',
      addressLine1: 'Charlottenstraße 65',
      city: 'Berlin',
      postalCode: '10117',
      country: 'DE',
      metadata: {
        category: 'professional_services',
        tags: ['accounting', 'tax', 'bookkeeping'],
        contactName: 'Petra Schmidt',
      },
    },
  }));

  // Vendor 9: Office Supplies (Amazon Business)
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Amazon EU S.a.r.l.',
      displayName: 'Amazon Business',
      email: 'business@amazon.de',
      website: 'https://amazon.de/business',
      taxId: 'LU20260743',
      paymentTerms: 30,
      status: VendorStatus.ACTIVE,
      notes: 'Office supplies and general procurement.',
      addressLine1: '5, Rue Plaetis',
      city: 'Luxembourg',
      postalCode: 'L-2338',
      country: 'LU',
      metadata: {
        category: 'supplies',
        tags: ['supplies', 'office', 'equipment'],
      },
    },
  }));

  // Vendor 10: Telecom
  vendors.push(await prisma.vendor.create({
    data: {
      organisationId: orgId,
      name: 'Telekom Deutschland GmbH',
      displayName: 'Telekom',
      email: 'business@telekom.de',
      phone: '+49 800 3301000',
      website: 'https://telekom.de/business',
      taxId: 'DE123475223',
      paymentTerms: 14,
      status: VendorStatus.ACTIVE,
      notes: 'Business internet and phone services.',
      addressLine1: 'Landgrabenweg 151',
      city: 'Bonn',
      postalCode: '53227',
      country: 'DE',
      metadata: {
        category: 'utilities',
        tags: ['telecom', 'internet', 'phone'],
      },
    },
  }));

  console.log(`Created ${vendors.length} vendors ✓`);

  // Summary by category
  const byCategory: Record<string, number> = {};
  vendors.forEach(v => {
    const cat = (v.metadata as any)?.category || 'uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log('\n' + '='.repeat(60));
  console.log('VENDOR DATA SEEDED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`  Total Vendors: ${vendors.length}`);
  console.log('  By Category:');
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`    - ${cat}: ${count}`);
  });
  console.log('='.repeat(60));

  return vendors;
}
