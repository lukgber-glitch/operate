/**
 * Australia Tax Configuration Seed Data
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAustraliaTaxConfig() {
  console.log('Seeding Australia tax configuration...');

  // Create Australia country
  const australia = await prisma.country.upsert({
    where: { code: 'AU' },
    update: {},
    create: {
      code: 'AU',
      code3: 'AUS',
      name: 'Australia',
      officialName: 'Commonwealth of Australia',
      currency: 'AUD',
      currencySymbol: '$',
      timezone: 'Australia/Sydney',
      languages: JSON.stringify(['en']),
      isEU: false,
      isActive: true,
    },
  });

  console.log(`✓ Created country: ${australia.name} (${australia.code})`);

  // Create states and territories
  const states = [
    { code: 'NSW', name: 'New South Wales', capital: 'Sydney' },
    { code: 'VIC', name: 'Victoria', capital: 'Melbourne' },
    { code: 'QLD', name: 'Queensland', capital: 'Brisbane' },
    { code: 'SA', name: 'South Australia', capital: 'Adelaide' },
    { code: 'WA', name: 'Western Australia', capital: 'Perth' },
    { code: 'TAS', name: 'Tasmania', capital: 'Hobart' },
    { code: 'NT', name: 'Northern Territory', capital: 'Darwin' },
    { code: 'ACT', name: 'Australian Capital Territory', capital: 'Canberra' },
  ];

  for (const state of states) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: australia.id,
          code: state.code,
        },
      },
      update: {},
      create: {
        countryId: australia.id,
        code: state.code,
        name: state.name,
        type: 'STATE',
        isActive: true,
      },
    });
    console.log(`  ✓ Created state: ${state.name} (${state.code})`);
  }

  // Create GST tax rates (uniform across all states)
  const gstRate = 10;

  for (const state of states) {
    const region = await prisma.region.findFirst({
      where: {
        countryId: australia.id,
        code: state.code,
      },
    });

    if (region) {
      // Standard GST rate
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: australia.id,
            regionId: region.id,
            category: 'STANDARD',
          },
        },
        update: {
          rate: gstRate,
        },
        create: {
          countryId: australia.id,
          regionId: region.id,
          category: 'STANDARD',
          rate: gstRate,
          description: `${state.code} GST - ${gstRate}% (Goods and Services Tax)`,
          validFrom: new Date('2000-07-01'), // GST introduced July 1, 2000
          exemptions: JSON.stringify([
            'Basic food',
            'Health services',
            'Medical aids',
            'Education',
            'Childcare',
            'Exports',
          ]),
        },
      });

      // GST-free rate (0%)
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: australia.id,
            regionId: region.id,
            category: 'ZERO',
          },
        },
        update: {
          rate: 0,
        },
        create: {
          countryId: australia.id,
          regionId: region.id,
          category: 'ZERO',
          rate: 0,
          description: `${state.code} GST-free supplies - 0%`,
          validFrom: new Date('2000-07-01'),
          exemptions: JSON.stringify([
            'Basic food items',
            'Prescription medicines',
            'Medical services',
            'Educational courses',
            'Exports',
          ]),
        },
      });

      console.log(`  ✓ Created GST rates for: ${state.code}`);
    }
  }

  // Create tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: australia.id },
    update: {},
    create: {
      countryId: australia.id,
      vatPeriodType: 'QUARTERLY',
      corporateTaxPeriodType: 'ANNUAL',
      vatFilingDeadlineDays: 28, // 28 days after quarter end
      vatPaymentDeadlineDays: 28,
      corporateTaxFilingDays: 365, // Annual tax return
      corporateTaxPaymentDays: 365,
      invoiceNumberingType: 'SEQUENTIAL',
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: false, // E-invoicing being phased in
      eInvoicingMandateDate: new Date('2025-07-01'), // Planned mandate
      eInvoicingFormat: 'Peppol',
      eInvoicingNetwork: 'Peppol',
      viesValidationRequired: false,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      notes: 'GST is uniform at 10% across all states. BAS (Business Activity Statement) required quarterly or monthly.',
      legalBasis: 'A New Tax System (Goods and Services Tax) Act 1999',
    },
  });

  console.log('✓ Created Australia tax configuration');

  // Create country features
  const features = [
    {
      feature: 'tax_filing',
      enabled: true,
      config: {
        system: 'GST',
        forms: ['BAS', 'IAS'],
        registrationThreshold: 75000,
      }
    },
    {
      feature: 'vat_validation',
      enabled: true,
      config: {
        format: 'ABN',
        length: 11,
        algorithm: 'modulus89',
      }
    },
    {
      feature: 'payroll',
      enabled: true,
      config: {
        system: 'PAYG',
        superannuation: true,
      }
    },
    {
      feature: 'single_touch_payroll',
      enabled: true,
      config: {
        mandatory: true,
        phase: 2,
      }
    },
  ];

  for (const feat of features) {
    await prisma.countryFeature.upsert({
      where: {
        countryId_feature: {
          countryId: australia.id,
          feature: feat.feature,
        },
      },
      update: {},
      create: {
        countryId: australia.id,
        feature: feat.feature,
        enabled: feat.enabled,
        config: feat.config,
      },
    });
    console.log(`  ✓ Created feature: ${feat.feature}`);
  }

  // Create employment types for Australia
  const employmentTypes = [
    {
      code: 'full_time',
      name: 'Full-time',
      description: 'Permanent full-time employment',
      isActive: true,
    },
    {
      code: 'part_time',
      name: 'Part-time',
      description: 'Permanent part-time employment',
      isActive: true,
    },
    {
      code: 'casual',
      name: 'Casual',
      description: 'Casual employment with loading',
      isActive: true,
    },
    {
      code: 'contractor',
      name: 'Contractor',
      description: 'Independent contractor (non-employee)',
      isActive: true,
    },
  ];

  for (const empType of employmentTypes) {
    await prisma.employmentType.upsert({
      where: {
        countryId_code: {
          countryId: australia.id,
          code: empType.code,
        },
      },
      update: {},
      create: {
        countryId: australia.id,
        code: empType.code,
        name: empType.name,
        description: empType.description,
        isActive: empType.isActive,
      },
    });
    console.log(`  ✓ Created employment type: ${empType.name}`);
  }

  console.log('✓ Australia tax configuration seeded successfully!\n');
}

// Run if executed directly
if (require.main === module) {
  seedAustraliaTaxConfig()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
