/**
 * Canada Tax Configuration Seed Data
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCanadaTaxConfig() {
  console.log('Seeding Canada tax configuration...');

  // Create Canada country
  const canada = await prisma.country.upsert({
    where: { code: 'CA' },
    update: {},
    create: {
      code: 'CA',
      code3: 'CAN',
      name: 'Canada',
      officialName: 'Canada',
      currency: 'CAD',
      currencySymbol: '$',
      timezone: 'America/Toronto',
      languages: JSON.stringify(['en', 'fr']),
      isEU: false,
      isActive: true,
    },
  });

  console.log(`✓ Created country: ${canada.name} (${canada.code})`);

  // Create provinces/territories
  const provinces = [
    { code: 'ON', name: 'Ontario', capital: 'Toronto' },
    { code: 'QC', name: 'Quebec', capital: 'Quebec City' },
    { code: 'BC', name: 'British Columbia', capital: 'Victoria' },
    { code: 'AB', name: 'Alberta', capital: 'Edmonton' },
    { code: 'MB', name: 'Manitoba', capital: 'Winnipeg' },
    { code: 'SK', name: 'Saskatchewan', capital: 'Regina' },
    { code: 'NS', name: 'Nova Scotia', capital: 'Halifax' },
    { code: 'NB', name: 'New Brunswick', capital: 'Fredericton' },
    { code: 'NL', name: 'Newfoundland and Labrador', capital: "St. John's" },
    { code: 'PE', name: 'Prince Edward Island', capital: 'Charlottetown' },
    { code: 'NT', name: 'Northwest Territories', capital: 'Yellowknife' },
    { code: 'YT', name: 'Yukon', capital: 'Whitehorse' },
    { code: 'NU', name: 'Nunavut', capital: 'Iqaluit' },
  ];

  for (const prov of provinces) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: canada.id,
          code: prov.code,
        },
      },
      update: {},
      create: {
        countryId: canada.id,
        code: prov.code,
        name: prov.name,
        type: 'PROVINCE',
        isActive: true,
      },
    });
    console.log(`  ✓ Created province: ${prov.name} (${prov.code})`);
  }

  // Create tax rates for each province
  const taxRates = [
    // HST Provinces
    { province: 'ON', taxType: 'HST', rate: 13, federal: 5, provincial: 8 },
    { province: 'NB', taxType: 'HST', rate: 15, federal: 5, provincial: 10 },
    { province: 'NL', taxType: 'HST', rate: 15, federal: 5, provincial: 10 },
    { province: 'NS', taxType: 'HST', rate: 15, federal: 5, provincial: 10 },
    { province: 'PE', taxType: 'HST', rate: 15, federal: 5, provincial: 10 },
    // GST + PST Provinces
    { province: 'BC', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'BC', taxType: 'PST', rate: 7, federal: 0, provincial: 7 },
    { province: 'MB', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'MB', taxType: 'PST', rate: 7, federal: 0, provincial: 7 },
    { province: 'SK', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'SK', taxType: 'PST', rate: 6, federal: 0, provincial: 6 },
    // GST + QST (Quebec)
    { province: 'QC', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'QC', taxType: 'QST', rate: 9.975, federal: 0, provincial: 9.975 },
    // GST Only
    { province: 'AB', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'NT', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'NU', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
    { province: 'YT', taxType: 'GST', rate: 5, federal: 5, provincial: 0 },
  ];

  for (const rate of taxRates) {
    const region = await prisma.region.findFirst({
      where: {
        countryId: canada.id,
        code: rate.province,
      },
    });

    if (region) {
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: canada.id,
            regionId: region.id,
            category: rate.taxType === 'HST' ? 'STANDARD' : rate.taxType,
          },
        },
        update: {
          rate: rate.rate,
        },
        create: {
          countryId: canada.id,
          regionId: region.id,
          category: rate.taxType === 'HST' ? 'STANDARD' : rate.taxType,
          rate: rate.rate,
          description: `${rate.province} ${rate.taxType} - ${rate.rate}%`,
          validFrom: new Date('2024-01-01'),
        },
      });
      console.log(`  ✓ Created tax rate: ${rate.province} ${rate.taxType} ${rate.rate}%`);
    }
  }

  // Create tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: canada.id },
    update: {},
    create: {
      countryId: canada.id,
      vatPeriodType: 'QUARTERLY',
      corporateTaxPeriodType: 'ANNUAL',
      vatFilingDeadlineDays: 30,
      vatPaymentDeadlineDays: 30,
      corporateTaxFilingDays: 180,
      corporateTaxPaymentDays: 180,
      invoiceNumberingType: 'SEQUENTIAL',
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: false,
      viesValidationRequired: false,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      notes: 'GST/HST system varies by province. Quebec has separate QST system.',
      legalBasis: 'Excise Tax Act (GST/HST)',
    },
  });

  console.log('✓ Created Canada tax configuration');

  // Create country features
  const features = [
    { feature: 'tax_filing', enabled: true, config: { system: 'GST/HST' } },
    { feature: 'vat_validation', enabled: true, config: { format: 'BN + RC' } },
    { feature: 'payroll', enabled: true, config: {} },
    { feature: 'provincial_tax', enabled: true, config: { types: ['PST', 'QST', 'HST'] } },
  ];

  for (const feat of features) {
    await prisma.countryFeature.upsert({
      where: {
        countryId_feature: {
          countryId: canada.id,
          feature: feat.feature,
        },
      },
      update: {},
      create: {
        countryId: canada.id,
        feature: feat.feature,
        enabled: feat.enabled,
        config: feat.config,
      },
    });
    console.log(`  ✓ Created feature: ${feat.feature}`);
  }

  console.log('✓ Canada tax configuration seeded successfully!\n');
}

// Run if executed directly
if (require.main === module) {
  seedCanadaTaxConfig()
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
