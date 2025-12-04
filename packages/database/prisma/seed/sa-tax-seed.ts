/**
 * Saudi Arabia Tax Configuration Seed Data
 * Task: W28-T4 - Middle East tax rules (VAT 5%/15%)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSaudiArabiaTaxConfig() {
  console.log('Seeding Saudi Arabia tax configuration...');

  // Create Saudi Arabia country
  const saudiArabia = await prisma.country.upsert({
    where: { code: 'SA' },
    update: {},
    create: {
      code: 'SA',
      code3: 'SAU',
      name: 'Saudi Arabia',
      nameNative: 'المملكة العربية السعودية',
      officialName: 'Kingdom of Saudi Arabia',
      currency: 'SAR',
      currencySymbol: 'ر.س',
      locale: 'ar-SA',
      timezone: 'Asia/Riyadh',
      fiscalYearStart: '01-01', // Gregorian calendar
      languages: JSON.stringify(['ar', 'en']),
      isEU: false,
      isActive: true,
    },
  });

  console.log(`✓ Created country: ${saudiArabia.name} (${saudiArabia.code})`);

  // Create 13 administrative regions
  const regions = [
    { code: 'RIYADH', name: 'Riyadh Region', nameArabic: 'منطقة الرياض', capital: 'Riyadh' },
    { code: 'MAKKAH', name: 'Makkah Region', nameArabic: 'منطقة مكة المكرمة', capital: 'Makkah' },
    { code: 'MADINAH', name: 'Madinah Region', nameArabic: 'منطقة المدينة المنورة', capital: 'Madinah' },
    { code: 'EASTERN', name: 'Eastern Province', nameArabic: 'المنطقة الشرقية', capital: 'Dammam' },
    { code: 'ASIR', name: 'Asir Region', nameArabic: 'منطقة عسير', capital: 'Abha' },
    { code: 'TABUK', name: 'Tabuk Region', nameArabic: 'منطقة تبوك', capital: 'Tabuk' },
    { code: 'HAIL', name: 'Hail Region', nameArabic: 'منطقة حائل', capital: 'Hail' },
    { code: 'NORTHERN_BORDERS', name: 'Northern Borders Region', nameArabic: 'منطقة الحدود الشمالية', capital: 'Arar' },
    { code: 'JAZAN', name: 'Jazan Region', nameArabic: 'منطقة جازان', capital: 'Jazan' },
    { code: 'NAJRAN', name: 'Najran Region', nameArabic: 'منطقة نجران', capital: 'Najran' },
    { code: 'AL_BAHA', name: 'Al-Baha Region', nameArabic: 'منطقة الباحة', capital: 'Al-Baha' },
    { code: 'AL_JAWF', name: 'Al-Jawf Region', nameArabic: 'منطقة الجوف', capital: 'Sakaka' },
    { code: 'QASSIM', name: 'Qassim Region', nameArabic: 'منطقة القصيم', capital: 'Buraidah' },
  ];

  for (const region of regions) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: saudiArabia.id,
          code: region.code,
        },
      },
      update: {},
      create: {
        countryId: saudiArabia.id,
        code: region.code,
        name: region.name,
        nameNative: region.nameArabic,
        type: 'REGION',
        isActive: true,
      },
    });
    console.log(`  ✓ Created region: ${region.name} (${region.code})`);
  }

  // Create VAT tax rates (uniform 15% across all regions)
  const standardVATRate = 15;

  for (const region of regions) {
    const regionRecord = await prisma.region.findFirst({
      where: {
        countryId: saudiArabia.id,
        code: region.code,
      },
    });

    if (regionRecord) {
      // Standard VAT rate (15%)
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: saudiArabia.id,
            regionId: regionRecord.id,
            category: 'STANDARD',
          },
        },
        update: {
          rate: standardVATRate,
        },
        create: {
          countryId: saudiArabia.id,
          regionId: regionRecord.id,
          category: 'STANDARD',
          rate: standardVATRate,
          description: `${region.code} VAT - ${standardVATRate}% (Value Added Tax)`,
          validFrom: new Date('2020-07-01'), // VAT increased to 15% on July 1, 2020
          exemptions: JSON.stringify([
            'Financial services',
            'Life insurance and reinsurance',
            'Sale or lease of residential real estate',
            'Bare land (not designated for construction)',
          ]),
        },
      });

      // Zero-rated VAT (0%)
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: saudiArabia.id,
            regionId: regionRecord.id,
            category: 'ZERO',
          },
        },
        update: {
          rate: 0,
        },
        create: {
          countryId: saudiArabia.id,
          regionId: regionRecord.id,
          category: 'ZERO',
          rate: 0,
          description: `${region.code} Zero-rated supplies - 0%`,
          validFrom: new Date('2018-01-01'), // VAT introduced January 1, 2018
          exemptions: JSON.stringify([
            'Exports of goods outside GCC',
            'International transportation services',
            'Supply of transportation services for goods export',
            'Qualifying means of transport (ships, aircraft)',
            'Supply of medicines and medical equipment',
            'Precious investment metals (gold, silver, platinum >99% purity)',
          ]),
        },
      });

      console.log(`  ✓ Created VAT rates for: ${region.code}`);
    }
  }

  // Create country-level tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: saudiArabia.id },
    update: {},
    create: {
      countryId: saudiArabia.id,
      vatPeriodType: 'MONTHLY',
      corporateTaxPeriodType: 'ANNUAL',
      vatFilingDeadlineDays: 30, // End of the month following the tax period
      vatPaymentDeadlineDays: 30,
      corporateTaxFilingDays: 120, // 120 days after fiscal year end
      corporateTaxPaymentDays: 120,
      invoiceNumberingType: 'SEQUENTIAL',
      requiresDigitalSignature: true, // E-invoicing requires digital signature
      requiresQrCode: true, // QR code mandatory on tax invoices
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2021-12-04'), // Phase 1: Generation
      eInvoicingFormat: 'ZATCA', // Zakat, Tax and Customs Authority format
      eInvoicingNetwork: 'ZATCA',
      viesValidationRequired: false,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      notes: 'VAT is 15% nationwide. E-invoicing (ZATCA) mandatory for B2B/B2G. Phase 2 integration ongoing.',
      legalBasis: 'VAT Implementing Regulations (Royal Decree No. M/113, 2017)',
    },
  });

  console.log('✓ Created Saudi Arabia tax configuration');

  // Create country features
  const features = [
    {
      feature: 'tax_filing',
      enabled: true,
      config: {
        system: 'VAT',
        forms: ['VAT Return (Form 1)', 'Simplified VAT Return (Form 2)'],
        registrationThreshold: 375000, // SAR
        voluntaryThreshold: 187500, // SAR
      }
    },
    {
      feature: 'vat_validation',
      enabled: true,
      config: {
        format: 'TRN',
        length: 15,
        algorithm: 'luhn',
        startsWith: '3',
      }
    },
    {
      feature: 'e_invoicing',
      enabled: true,
      config: {
        system: 'ZATCA',
        mandatory: true,
        phase1: '2021-12-04', // Generation phase
        phase2: '2023-01-01', // Integration phase (ongoing)
        requiresQR: true,
        requiresDigitalSignature: true,
      }
    },
    {
      feature: 'zakat',
      enabled: true,
      config: {
        system: 'ZATCA',
        rate: 2.5, // 2.5% on lunar year
        applicable: 'Saudi and GCC nationals',
      }
    },
    {
      feature: 'excise_tax',
      enabled: true,
      config: {
        tobacco: 100, // 100%
        energyDrinks: 100, // 100%
        carbonatedDrinks: 50, // 50%
        effectiveFrom: '2017-06-11',
      }
    },
  ];

  for (const feat of features) {
    await prisma.countryFeature.upsert({
      where: {
        countryId_feature: {
          countryId: saudiArabia.id,
          feature: feat.feature,
        },
      },
      update: {},
      create: {
        countryId: saudiArabia.id,
        feature: feat.feature,
        enabled: feat.enabled,
        config: feat.config,
      },
    });
    console.log(`  ✓ Created feature: ${feat.feature}`);
  }

  // Create employment types for Saudi Arabia
  const employmentTypes = [
    {
      code: 'full_time',
      name: 'Full-time Employee',
      description: 'Permanent full-time employment under Saudi Labor Law',
      isActive: true,
    },
    {
      code: 'part_time',
      name: 'Part-time Employee',
      description: 'Part-time employment',
      isActive: true,
    },
    {
      code: 'contract',
      name: 'Fixed-term Contract',
      description: 'Fixed-term contract employee',
      isActive: true,
    },
    {
      code: 'contractor',
      name: 'Independent Contractor',
      description: 'Independent contractor (non-employee)',
      isActive: true,
    },
    {
      code: 'expatriate',
      name: 'Expatriate Worker',
      description: 'Foreign worker with work visa',
      isActive: true,
    },
  ];

  for (const empType of employmentTypes) {
    await prisma.employmentType.upsert({
      where: {
        countryId_code: {
          countryId: saudiArabia.id,
          code: empType.code,
        },
      },
      update: {},
      create: {
        countryId: saudiArabia.id,
        code: empType.code,
        name: empType.name,
        description: empType.description,
        isActive: empType.isActive,
      },
    });
    console.log(`  ✓ Created employment type: ${empType.name}`);
  }

  // Create tax authority
  await prisma.taxAuthority.upsert({
    where: {
      countryId_code: {
        countryId: saudiArabia.id,
        code: 'ZATCA',
      },
    },
    update: {},
    create: {
      countryId: saudiArabia.id,
      code: 'ZATCA',
      name: 'Zakat, Tax and Customs Authority',
      nameNative: 'هيئة الزكاة والضريبة والجمارك',
      website: 'https://zatca.gov.sa',
      apiEndpoint: 'https://api.zatca.gov.sa',
      contactEmail: 'info@zatca.gov.sa',
      contactPhone: '+966920000456',
      isActive: true,
    },
  });

  console.log('  ✓ Created tax authority: ZATCA');

  // Create special economic zones
  const specialZones = [
    {
      code: 'KAEC',
      name: 'King Abdullah Economic City',
      nameArabic: 'مدينة الملك عبد الله الاقتصادية',
      region: 'MAKKAH',
      zoneType: 'ECONOMIC_CITY',
      vatTreatment: 'STANDARD',
      hasIncentives: true,
      incentiveDescription: 'Tax incentives for qualifying businesses',
    },
    {
      code: 'JAZAN_CITY',
      name: 'Jazan City for Primary and Downstream Industries',
      nameArabic: 'مدينة جازان للصناعات الأولية والتحويلية',
      region: 'JAZAN',
      zoneType: 'INDUSTRIAL_ZONE',
      vatTreatment: 'STANDARD',
      hasIncentives: true,
      incentiveDescription: 'Industrial zone with tax benefits',
    },
    {
      code: 'RAB_YANBU',
      name: 'Rabigh and Yanbu Industrial Cities',
      nameArabic: 'مدينة رابغ وينبع الصناعية',
      region: 'MADINAH',
      zoneType: 'INDUSTRIAL_ZONE',
      vatTreatment: 'STANDARD',
      hasIncentives: false,
    },
  ];

  for (const zone of specialZones) {
    await prisma.saudiSpecialZone.upsert({
      where: { code: zone.code },
      update: {},
      create: {
        code: zone.code,
        name: zone.name,
        nameArabic: zone.nameArabic,
        region: zone.region,
        zoneType: zone.zoneType,
        vatTreatment: zone.vatTreatment,
        hasIncentives: zone.hasIncentives,
        incentiveDescription: zone.incentiveDescription,
        isActive: true,
      },
    });
    console.log(`  ✓ Created special zone: ${zone.name}`);
  }

  console.log('✓ Saudi Arabia tax configuration seeded successfully!\n');
}

// Run if executed directly
if (require.main === module) {
  seedSaudiArabiaTaxConfig()
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
