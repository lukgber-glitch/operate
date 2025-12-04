/**
 * UAE Tax Configuration Seed Data
 * Task: W28-T4 - Middle East tax rules (VAT 5%/15%)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedUAETaxConfig() {
  console.log('Seeding UAE tax configuration...');

  // Create UAE country
  const uae = await prisma.country.upsert({
    where: { code: 'AE' },
    update: {},
    create: {
      code: 'AE',
      code3: 'ARE',
      name: 'United Arab Emirates',
      nameNative: 'الإمارات العربية المتحدة',
      officialName: 'United Arab Emirates',
      currency: 'AED',
      currencySymbol: 'د.إ',
      locale: 'ar-AE',
      timezone: 'Asia/Dubai',
      fiscalYearStart: '01-01', // Gregorian calendar
      languages: JSON.stringify(['ar', 'en']),
      isEU: false,
      isActive: true,
    },
  });

  console.log(`✓ Created country: ${uae.name} (${uae.code})`);

  // Create 7 Emirates
  const emirates = [
    { code: 'AUH', name: 'Abu Dhabi', nameArabic: 'أبو ظبي', capital: 'Abu Dhabi' },
    { code: 'DXB', name: 'Dubai', nameArabic: 'دبي', capital: 'Dubai' },
    { code: 'SHJ', name: 'Sharjah', nameArabic: 'الشارقة', capital: 'Sharjah' },
    { code: 'AJM', name: 'Ajman', nameArabic: 'عجمان', capital: 'Ajman' },
    { code: 'UAQ', name: 'Umm Al Quwain', nameArabic: 'أم القيوين', capital: 'Umm Al Quwain' },
    { code: 'RAK', name: 'Ras Al Khaimah', nameArabic: 'رأس الخيمة', capital: 'Ras Al Khaimah' },
    { code: 'FUJ', name: 'Fujairah', nameArabic: 'الفجيرة', capital: 'Fujairah' },
  ];

  for (const emirate of emirates) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: uae.id,
          code: emirate.code,
        },
      },
      update: {},
      create: {
        countryId: uae.id,
        code: emirate.code,
        name: emirate.name,
        nameNative: emirate.nameArabic,
        type: 'EMIRATE',
        isActive: true,
      },
    });
    console.log(`  ✓ Created emirate: ${emirate.name} (${emirate.code})`);
  }

  // Create VAT tax rates (uniform 5% across all emirates)
  const standardVATRate = 5;

  for (const emirate of emirates) {
    const emirateRecord = await prisma.region.findFirst({
      where: {
        countryId: uae.id,
        code: emirate.code,
      },
    });

    if (emirateRecord) {
      // Standard VAT rate (5%)
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: uae.id,
            regionId: emirateRecord.id,
            category: 'STANDARD',
          },
        },
        update: {
          rate: standardVATRate,
        },
        create: {
          countryId: uae.id,
          regionId: emirateRecord.id,
          category: 'STANDARD',
          rate: standardVATRate,
          description: `${emirate.code} VAT - ${standardVATRate}% (Value Added Tax)`,
          validFrom: new Date('2018-01-01'), // VAT introduced January 1, 2018
          exemptions: JSON.stringify([
            'Financial services (lending, credit, insurance)',
            'Residential property (leasing > 6 months)',
            'Local passenger transport',
            'Bare land',
            'Life insurance',
          ]),
        },
      });

      // Zero-rated VAT (0%)
      await prisma.taxRate.upsert({
        where: {
          countryId_regionId_category: {
            countryId: uae.id,
            regionId: emirateRecord.id,
            category: 'ZERO',
          },
        },
        update: {
          rate: 0,
        },
        create: {
          countryId: uae.id,
          regionId: emirateRecord.id,
          category: 'ZERO',
          rate: 0,
          description: `${emirate.code} Zero-rated supplies - 0%`,
          validFrom: new Date('2018-01-01'),
          exemptions: JSON.stringify([
            'Exports of goods outside GCC',
            'International transportation of goods and passengers',
            'Supply of international transportation services',
            'Supply of means of transport (ships, aircraft)',
            'Healthcare and medical services',
            'Education services',
            'First supply of residential buildings (within 3 years)',
            'Precious investment metals (gold, silver, platinum >99% purity)',
          ]),
        },
      });

      console.log(`  ✓ Created VAT rates for: ${emirate.code}`);
    }
  }

  // Create country-level tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: uae.id },
    update: {},
    create: {
      countryId: uae.id,
      vatPeriodType: 'QUARTERLY',
      corporateTaxPeriodType: 'ANNUAL',
      vatFilingDeadlineDays: 28, // 28 days after quarter end
      vatPaymentDeadlineDays: 28,
      corporateTaxFilingDays: 270, // 9 months after fiscal year end
      corporateTaxPaymentDays: 270,
      invoiceNumberingType: 'SEQUENTIAL',
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: false, // E-invoicing expected but not yet mandatory
      eInvoicingMandateDate: new Date('2026-01-01'), // Planned
      eInvoicingFormat: 'Peppol',
      eInvoicingNetwork: 'Peppol',
      viesValidationRequired: false,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      notes: 'VAT is 5% nationwide. E-invoicing expected to be mandated. Corporate tax (9%) effective from June 1, 2023.',
      legalBasis: 'Federal Decree-Law No. 8 of 2017 on Value Added Tax',
    },
  });

  console.log('✓ Created UAE tax configuration');

  // Create country features
  const features = [
    {
      feature: 'tax_filing',
      enabled: true,
      config: {
        system: 'VAT',
        forms: ['VAT 201 Return'],
        registrationThreshold: 375000, // AED
        voluntaryThreshold: 187500, // AED
      }
    },
    {
      feature: 'vat_validation',
      enabled: true,
      config: {
        format: 'TRN',
        length: 15,
        pattern: '100-XXXX-XXXX-XXX-XXX',
      }
    },
    {
      feature: 'corporate_tax',
      enabled: true,
      config: {
        rate: 9, // 9% standard rate
        effectiveFrom: '2023-06-01',
        smallBusinessRelief: true,
        reliefThreshold: 375000, // AED
      }
    },
    {
      feature: 'excise_tax',
      enabled: true,
      config: {
        tobacco: 100, // 100%
        energyDrinks: 100, // 100%
        carbonatedDrinks: 50, // 50%
        sweetenedDrinks: 50, // 50%
        electronicSmokingDevices: 100, // 100%
        effectiveFrom: '2017-10-01',
      }
    },
    {
      feature: 'free_zones',
      enabled: true,
      config: {
        count: 45, // Over 45 free zones
        vatTreatment: 'special',
        corporateTaxExemption: true,
      }
    },
  ];

  for (const feat of features) {
    await prisma.countryFeature.upsert({
      where: {
        countryId_feature: {
          countryId: uae.id,
          feature: feat.feature,
        },
      },
      update: {},
      create: {
        countryId: uae.id,
        feature: feat.feature,
        enabled: feat.enabled,
        config: feat.config,
      },
    });
    console.log(`  ✓ Created feature: ${feat.feature}`);
  }

  // Create employment types for UAE
  const employmentTypes = [
    {
      code: 'full_time',
      name: 'Full-time Employee',
      description: 'Permanent full-time employment under UAE Labor Law',
      isActive: true,
    },
    {
      code: 'part_time',
      name: 'Part-time Employee',
      description: 'Part-time employment',
      isActive: true,
    },
    {
      code: 'limited_contract',
      name: 'Limited Contract',
      description: 'Fixed-term employment contract',
      isActive: true,
    },
    {
      code: 'unlimited_contract',
      name: 'Unlimited Contract',
      description: 'Indefinite employment contract',
      isActive: true,
    },
    {
      code: 'contractor',
      name: 'Independent Contractor',
      description: 'Independent contractor (non-employee)',
      isActive: true,
    },
    {
      code: 'free_zone_employee',
      name: 'Free Zone Employee',
      description: 'Employee in UAE free zone',
      isActive: true,
    },
  ];

  for (const empType of employmentTypes) {
    await prisma.employmentType.upsert({
      where: {
        countryId_code: {
          countryId: uae.id,
          code: empType.code,
        },
      },
      update: {},
      create: {
        countryId: uae.id,
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
        countryId: uae.id,
        code: 'FTA',
      },
    },
    update: {},
    create: {
      countryId: uae.id,
      code: 'FTA',
      name: 'Federal Tax Authority',
      nameNative: 'الهيئة الاتحادية للضرائب',
      website: 'https://tax.gov.ae',
      apiEndpoint: 'https://eservices.tax.gov.ae',
      contactEmail: 'info@tax.gov.ae',
      contactPhone: '+971600599994',
      isActive: true,
    },
  });

  console.log('  ✓ Created tax authority: FTA');

  // Create major free zones
  const freeZones = [
    {
      code: 'DIFC',
      name: 'Dubai International Financial Centre',
      nameArabic: 'مركز دبي المالي العالمي',
      emirate: 'DXB',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Dubai',
    },
    {
      code: 'JAFZA',
      name: 'Jebel Ali Free Zone',
      nameArabic: 'المنطقة الحرة بجبل علي',
      emirate: 'DXB',
      zoneType: 'DESIGNATED_ZONE',
      isVATFree: true, // 0% on goods
      vatRate: 0,
      requiresTRN: true,
      requiresCustomsRegistration: true,
      location: 'Jebel Ali, Dubai',
    },
    {
      code: 'DMCC',
      name: 'Dubai Multi Commodities Centre',
      nameArabic: 'مركز دبي للسلع المتعددة',
      emirate: 'DXB',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Dubai',
    },
    {
      code: 'DAFZA',
      name: 'Dubai Airport Free Zone',
      nameArabic: 'المنطقة الحرة لمطار دبي',
      emirate: 'DXB',
      zoneType: 'DESIGNATED_ZONE',
      isVATFree: true,
      vatRate: 0,
      requiresTRN: true,
      location: 'Dubai Airport',
    },
    {
      code: 'RAKFTZ',
      name: 'Ras Al Khaimah Free Trade Zone',
      nameArabic: 'منطقة رأس الخيمة الحرة',
      emirate: 'RAK',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Ras Al Khaimah',
    },
    {
      code: 'ADGM',
      name: 'Abu Dhabi Global Market',
      nameArabic: 'سوق أبوظبي العالمي',
      emirate: 'AUH',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Abu Dhabi',
    },
    {
      code: 'SHAMS',
      name: 'Sharjah Airport International Free Zone',
      nameArabic: 'المنطقة الحرة الدولية بمطار الشارقة',
      emirate: 'SHJ',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Sharjah Airport',
    },
    {
      code: 'SAIF',
      name: 'Sharjah Airport International Free Zone',
      nameArabic: 'منطقة المطار الحرة بالشارقة',
      emirate: 'SHJ',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Sharjah',
    },
    {
      code: 'HAMRIYAH',
      name: 'Hamriyah Free Zone',
      nameArabic: 'منطقة الحمرية الحرة',
      emirate: 'SHJ',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Hamriyah, Sharjah',
    },
    {
      code: 'AJMAN_FZ',
      name: 'Ajman Free Zone',
      nameArabic: 'المنطقة الحرة بعجمان',
      emirate: 'AJM',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Ajman',
    },
    {
      code: 'FUJAIRAH_FZ',
      name: 'Fujairah Free Zone',
      nameArabic: 'المنطقة الحرة بالفجيرة',
      emirate: 'FUJ',
      zoneType: 'FREE_ZONE',
      isVATFree: false,
      vatRate: 5,
      requiresTRN: true,
      location: 'Fujairah',
    },
  ];

  for (const zone of freeZones) {
    await prisma.uAEFreeZone.upsert({
      where: { code: zone.code },
      update: {},
      create: {
        code: zone.code,
        name: zone.name,
        nameArabic: zone.nameArabic,
        emirate: zone.emirate,
        zoneType: zone.zoneType,
        isVATFree: zone.isVATFree,
        vatRate: zone.vatRate,
        requiresTRN: zone.requiresTRN,
        requiresCustomsRegistration: zone.requiresCustomsRegistration || false,
        location: zone.location,
        isActive: true,
      },
    });
    console.log(`  ✓ Created free zone: ${zone.name}`);
  }

  console.log('✓ UAE tax configuration seeded successfully!\n');
}

// Run if executed directly
if (require.main === module) {
  seedUAETaxConfig()
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
