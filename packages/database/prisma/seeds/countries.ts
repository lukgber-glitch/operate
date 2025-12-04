import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed country data for DE, AT, CH
 */
export async function seedCountries() {
  console.log('Seeding countries...');

  // ============================================================================
  // GERMANY (DE)
  // ============================================================================

  const germany = await prisma.country.upsert({
    where: { code: 'DE' },
    update: {},
    create: {
      code: 'DE',
      code3: 'DEU',
      name: 'Germany',
      nameNative: 'Deutschland',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'de-DE',
      timezone: 'Europe/Berlin',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // German regions (Bundesländer)
  const germanRegions = [
    { code: 'BW', name: 'Baden-Württemberg', nameNative: 'Baden-Württemberg' },
    { code: 'BY', name: 'Bavaria', nameNative: 'Bayern' },
    { code: 'BE', name: 'Berlin', nameNative: 'Berlin' },
    { code: 'BB', name: 'Brandenburg', nameNative: 'Brandenburg' },
    { code: 'HB', name: 'Bremen', nameNative: 'Bremen' },
    { code: 'HH', name: 'Hamburg', nameNative: 'Hamburg' },
    { code: 'HE', name: 'Hesse', nameNative: 'Hessen' },
    {
      code: 'MV',
      name: 'Mecklenburg-Vorpommern',
      nameNative: 'Mecklenburg-Vorpommern',
    },
    { code: 'NI', name: 'Lower Saxony', nameNative: 'Niedersachsen' },
    {
      code: 'NW',
      name: 'North Rhine-Westphalia',
      nameNative: 'Nordrhein-Westfalen',
    },
    { code: 'RP', name: 'Rhineland-Palatinate', nameNative: 'Rheinland-Pfalz' },
    { code: 'SL', name: 'Saarland', nameNative: 'Saarland' },
    { code: 'SN', name: 'Saxony', nameNative: 'Sachsen' },
    { code: 'ST', name: 'Saxony-Anhalt', nameNative: 'Sachsen-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein', nameNative: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thuringia', nameNative: 'Thüringen' },
  ];

  for (const region of germanRegions) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: germany.id,
          code: region.code,
        },
      },
      update: {},
      create: {
        countryId: germany.id,
        code: region.code,
        name: region.name,
        nameNative: region.nameNative,
      },
    });
  }

  // German VAT rates
  await prisma.vatRate.upsert({
    where: {
      id: `${germany.id}-standard`,
    },
    update: {},
    create: {
      id: `${germany.id}-standard`,
      countryId: germany.id,
      name: 'Standard',
      rate: 19.0,
      validFrom: new Date('2007-01-01'),
      validTo: null,
    },
  });

  await prisma.vatRate.upsert({
    where: {
      id: `${germany.id}-reduced`,
    },
    update: {},
    create: {
      id: `${germany.id}-reduced`,
      countryId: germany.id,
      name: 'Reduced',
      rate: 7.0,
      validFrom: new Date('2007-01-01'),
      validTo: null,
    },
  });

  // German deduction categories
  const germanDeductions = [
    {
      code: 'TRAVEL',
      name: 'Travel Expenses',
      description: 'Business travel including flights, hotels, and meals',
      legalBasis: '§9 Abs. 1 Satz 3 Nr. 5 EStG',
      requiresProof: true,
    },
    {
      code: 'OFFICE',
      name: 'Office Expenses',
      description: 'Office supplies and equipment',
      legalBasis: '§4 Abs. 4 EStG',
      requiresProof: true,
    },
    {
      code: 'HOME_OFFICE',
      name: 'Home Office',
      description: 'Home office deduction',
      maxAmount: 1260.0,
      legalBasis: '§4 Abs. 5 Satz 1 Nr. 6b EStG',
      requiresProof: false,
    },
    {
      code: 'VEHICLE',
      name: 'Vehicle Expenses',
      description: 'Business vehicle costs',
      legalBasis: '§6 Abs. 1 Nr. 4 EStG',
      requiresProof: true,
    },
    {
      code: 'TRAINING',
      name: 'Professional Training',
      description: 'Professional development and education',
      legalBasis: '§9 Abs. 1 Satz 3 Nr. 7 EStG',
      requiresProof: true,
    },
    {
      code: 'MEALS',
      name: 'Meal Expenses',
      description: 'Business meal deductions',
      legalBasis: '§4 Abs. 5 Satz 1 Nr. 2 EStG',
      requiresProof: true,
    },
    {
      code: 'ENTERTAINMENT',
      name: 'Business Entertainment',
      description: 'Client entertainment expenses',
      legalBasis: '§4 Abs. 5 Satz 1 Nr. 2 EStG',
      requiresProof: true,
    },
  ];

  for (const deduction of germanDeductions) {
    await prisma.deductionCategory.upsert({
      where: {
        countryId_code: {
          countryId: germany.id,
          code: deduction.code,
        },
      },
      update: {},
      create: {
        countryId: germany.id,
        ...deduction,
      },
    });
  }

  // German employment types
  const germanEmploymentTypes = [
    {
      code: 'FULL_TIME',
      name: 'Full-time Employee',
      description: 'Standard full-time employment contract',
    },
    {
      code: 'PART_TIME',
      name: 'Part-time Employee',
      description: 'Part-time employment contract',
    },
    {
      code: 'MINI_JOB',
      name: 'Minijob',
      description: 'Mini job (€538/month limit)',
    },
    {
      code: 'MIDI_JOB',
      name: 'Midijob',
      description: 'Midijob (€538.01-€2,000/month)',
    },
    {
      code: 'FREELANCER',
      name: 'Freelancer',
      description: 'Self-employed freelancer',
    },
    {
      code: 'CONTRACTOR',
      name: 'Contractor',
      description: 'Independent contractor',
    },
  ];

  for (const type of germanEmploymentTypes) {
    await prisma.employmentType.upsert({
      where: {
        countryId_code: {
          countryId: germany.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        countryId: germany.id,
        ...type,
      },
    });
  }

  // German features
  await prisma.countryFeature.upsert({
    where: {
      countryId_feature: {
        countryId: germany.id,
        feature: 'tax_filing',
      },
    },
    update: {},
    create: {
      countryId: germany.id,
      feature: 'tax_filing',
      enabled: true,
      config: { provider: 'ELSTER' },
    },
  });

  await prisma.countryFeature.upsert({
    where: {
      countryId_feature: {
        countryId: germany.id,
        feature: 'vat_validation',
      },
    },
    update: {},
    create: {
      countryId: germany.id,
      feature: 'vat_validation',
      enabled: true,
      config: { provider: 'VIES' },
    },
  });

  // German Government API
  await prisma.governmentApi.upsert({
    where: {
      countryId_name: {
        countryId: germany.id,
        name: 'ELSTER',
      },
    },
    update: {},
    create: {
      countryId: germany.id,
      name: 'ELSTER',
      baseUrl: 'https://www.elster.de',
      sandboxUrl: 'https://test.elster.de',
      authType: 'certificate',
      isActive: true,
    },
  });

  // ============================================================================
  // AUSTRIA (AT)
  // ============================================================================

  const austria = await prisma.country.upsert({
    where: { code: 'AT' },
    update: {},
    create: {
      code: 'AT',
      code3: 'AUT',
      name: 'Austria',
      nameNative: 'Österreich',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'de-AT',
      timezone: 'Europe/Vienna',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Austrian regions (Bundesländer)
  const austrianRegions = [
    { code: '1', name: 'Burgenland', nameNative: 'Burgenland' },
    { code: '2', name: 'Carinthia', nameNative: 'Kärnten' },
    { code: '3', name: 'Lower Austria', nameNative: 'Niederösterreich' },
    { code: '4', name: 'Upper Austria', nameNative: 'Oberösterreich' },
    { code: '5', name: 'Salzburg', nameNative: 'Salzburg' },
    { code: '6', name: 'Styria', nameNative: 'Steiermark' },
    { code: '7', name: 'Tyrol', nameNative: 'Tirol' },
    { code: '8', name: 'Vorarlberg', nameNative: 'Vorarlberg' },
    { code: '9', name: 'Vienna', nameNative: 'Wien' },
  ];

  for (const region of austrianRegions) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: austria.id,
          code: region.code,
        },
      },
      update: {},
      create: {
        countryId: austria.id,
        code: region.code,
        name: region.name,
        nameNative: region.nameNative,
      },
    });
  }

  // Austrian VAT rates
  await prisma.vatRate.upsert({
    where: {
      id: `${austria.id}-standard`,
    },
    update: {},
    create: {
      id: `${austria.id}-standard`,
      countryId: austria.id,
      name: 'Standard',
      rate: 20.0,
      validFrom: new Date('2016-01-01'),
      validTo: null,
    },
  });

  await prisma.vatRate.upsert({
    where: {
      id: `${austria.id}-reduced`,
    },
    update: {},
    create: {
      id: `${austria.id}-reduced`,
      countryId: austria.id,
      name: 'Reduced',
      rate: 10.0,
      validFrom: new Date('2016-01-01'),
      validTo: null,
    },
  });

  await prisma.vatRate.upsert({
    where: {
      id: `${austria.id}-super-reduced`,
    },
    update: {},
    create: {
      id: `${austria.id}-super-reduced`,
      countryId: austria.id,
      name: 'Super-Reduced',
      rate: 13.0,
      validFrom: new Date('2016-01-01'),
      validTo: null,
    },
  });

  // Austrian employment types
  const austrianEmploymentTypes = [
    {
      code: 'FULL_TIME',
      name: 'Full-time Employee',
      description: 'Standard full-time employment contract',
    },
    {
      code: 'PART_TIME',
      name: 'Part-time Employee',
      description: 'Part-time employment contract',
    },
    {
      code: 'FREELANCER',
      name: 'Freelancer',
      description: 'Self-employed freelancer',
    },
    {
      code: 'CONTRACTOR',
      name: 'Contractor',
      description: 'Independent contractor',
    },
  ];

  for (const type of austrianEmploymentTypes) {
    await prisma.employmentType.upsert({
      where: {
        countryId_code: {
          countryId: austria.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        countryId: austria.id,
        ...type,
      },
    });
  }

  // Austrian features
  await prisma.countryFeature.upsert({
    where: {
      countryId_feature: {
        countryId: austria.id,
        feature: 'tax_filing',
      },
    },
    update: {},
    create: {
      countryId: austria.id,
      feature: 'tax_filing',
      enabled: true,
      config: { provider: 'FinanzOnline' },
    },
  });

  await prisma.countryFeature.upsert({
    where: {
      countryId_feature: {
        countryId: austria.id,
        feature: 'vat_validation',
      },
    },
    update: {},
    create: {
      countryId: austria.id,
      feature: 'vat_validation',
      enabled: true,
      config: { provider: 'VIES' },
    },
  });

  // ============================================================================
  // SWITZERLAND (CH)
  // ============================================================================

  const switzerland = await prisma.country.upsert({
    where: { code: 'CH' },
    update: {},
    create: {
      code: 'CH',
      code3: 'CHE',
      name: 'Switzerland',
      nameNative: 'Schweiz',
      currency: 'CHF',
      currencySymbol: 'CHF',
      locale: 'de-CH',
      timezone: 'Europe/Zurich',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Swiss cantons
  const swissCantons = [
    { code: 'AG', name: 'Aargau', nameNative: 'Aargau' },
    { code: 'AI', name: 'Appenzell Innerrhoden', nameNative: 'Appenzell Innerrhoden' },
    { code: 'AR', name: 'Appenzell Ausserrhoden', nameNative: 'Appenzell Ausserrhoden' },
    { code: 'BE', name: 'Bern', nameNative: 'Bern' },
    { code: 'BL', name: 'Basel-Landschaft', nameNative: 'Basel-Landschaft' },
    { code: 'BS', name: 'Basel-Stadt', nameNative: 'Basel-Stadt' },
    { code: 'FR', name: 'Fribourg', nameNative: 'Fribourg' },
    { code: 'GE', name: 'Geneva', nameNative: 'Genève' },
    { code: 'GL', name: 'Glarus', nameNative: 'Glarus' },
    { code: 'GR', name: 'Graubünden', nameNative: 'Graubünden' },
    { code: 'JU', name: 'Jura', nameNative: 'Jura' },
    { code: 'LU', name: 'Lucerne', nameNative: 'Luzern' },
    { code: 'NE', name: 'Neuchâtel', nameNative: 'Neuchâtel' },
    { code: 'NW', name: 'Nidwalden', nameNative: 'Nidwalden' },
    { code: 'OW', name: 'Obwalden', nameNative: 'Obwalden' },
    { code: 'SG', name: 'St. Gallen', nameNative: 'St. Gallen' },
    { code: 'SH', name: 'Schaffhausen', nameNative: 'Schaffhausen' },
    { code: 'SO', name: 'Solothurn', nameNative: 'Solothurn' },
    { code: 'SZ', name: 'Schwyz', nameNative: 'Schwyz' },
    { code: 'TG', name: 'Thurgau', nameNative: 'Thurgau' },
    { code: 'TI', name: 'Ticino', nameNative: 'Ticino' },
    { code: 'UR', name: 'Uri', nameNative: 'Uri' },
    { code: 'VD', name: 'Vaud', nameNative: 'Vaud' },
    { code: 'VS', name: 'Valais', nameNative: 'Valais' },
    { code: 'ZG', name: 'Zug', nameNative: 'Zug' },
    { code: 'ZH', name: 'Zurich', nameNative: 'Zürich' },
  ];

  for (const canton of swissCantons) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: switzerland.id,
          code: canton.code,
        },
      },
      update: {},
      create: {
        countryId: switzerland.id,
        code: canton.code,
        name: canton.name,
        nameNative: canton.nameNative,
      },
    });
  }

  // Swiss VAT rates
  await prisma.vatRate.upsert({
    where: {
      id: `${switzerland.id}-standard`,
    },
    update: {},
    create: {
      id: `${switzerland.id}-standard`,
      countryId: switzerland.id,
      name: 'Standard',
      rate: 8.1,
      validFrom: new Date('2024-01-01'),
      validTo: null,
    },
  });

  await prisma.vatRate.upsert({
    where: {
      id: `${switzerland.id}-reduced`,
    },
    update: {},
    create: {
      id: `${switzerland.id}-reduced`,
      countryId: switzerland.id,
      name: 'Reduced',
      rate: 2.6,
      validFrom: new Date('2024-01-01'),
      validTo: null,
    },
  });

  await prisma.vatRate.upsert({
    where: {
      id: `${switzerland.id}-accommodation`,
    },
    update: {},
    create: {
      id: `${switzerland.id}-accommodation`,
      countryId: switzerland.id,
      name: 'Special (Accommodation)',
      rate: 3.8,
      validFrom: new Date('2024-01-01'),
      validTo: null,
    },
  });

  // Swiss employment types
  const swissEmploymentTypes = [
    {
      code: 'FULL_TIME',
      name: 'Full-time Employee',
      description: 'Standard full-time employment contract',
    },
    {
      code: 'PART_TIME',
      name: 'Part-time Employee',
      description: 'Part-time employment contract',
    },
    {
      code: 'FREELANCER',
      name: 'Freelancer',
      description: 'Self-employed freelancer',
    },
    {
      code: 'CONTRACTOR',
      name: 'Contractor',
      description: 'Independent contractor',
    },
  ];

  for (const type of swissEmploymentTypes) {
    await prisma.employmentType.upsert({
      where: {
        countryId_code: {
          countryId: switzerland.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        countryId: switzerland.id,
        ...type,
      },
    });
  }

  console.log('Countries seeded successfully!');
  console.log(`  - Germany (${germany.code}): ${germanRegions.length} regions`);
  console.log(`  - Austria (${austria.code}): ${austrianRegions.length} regions`);
  console.log(
    `  - Switzerland (${switzerland.code}): ${swissCantons.length} cantons`,
  );
}
