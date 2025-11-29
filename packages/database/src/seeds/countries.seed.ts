/**
 * Country Context Seed Data
 *
 * Seeds database with country-specific data for DE, AT, and CH:
 * - Countries with metadata
 * - Regions (Bundesländer, Kantone)
 * - VAT rates with validity periods
 * - Deduction categories
 * - Government APIs
 * - Country features
 * - Employment types
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CountryData {
  code: string;
  code3: string;
  name: string;
  nameNative: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  fiscalYearStart: string;
}

interface RegionData {
  code: string;
  name: string;
  nameNative?: string;
}

interface VatRateData {
  name: string;
  rate: number;
  validFrom: Date;
  validTo?: Date;
}

interface DeductionCategoryData {
  code: string;
  name: string;
  description: string;
  maxAmount?: number;
  legalBasis?: string;
  requiresProof: boolean;
}

interface GovernmentApiData {
  name: string;
  baseUrl: string;
  sandboxUrl?: string;
  authType: string;
}

interface CountryFeatureData {
  feature: string;
  enabled: boolean;
  config?: any;
}

interface EmploymentTypeData {
  code: string;
  name: string;
  description?: string;
}

// ============================================================================
// GERMANY (DE)
// ============================================================================

const GERMANY: CountryData = {
  code: 'DE',
  code3: 'DEU',
  name: 'Germany',
  nameNative: 'Deutschland',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'de-DE',
  timezone: 'Europe/Berlin',
  fiscalYearStart: '01-01',
};

const DE_REGIONS: RegionData[] = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bavaria', nameNative: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hesse', nameNative: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Lower Saxony', nameNative: 'Niedersachsen' },
  { code: 'NW', name: 'North Rhine-Westphalia', nameNative: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rhineland-Palatinate', nameNative: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Saxony', nameNative: 'Sachsen' },
  { code: 'ST', name: 'Saxony-Anhalt', nameNative: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thuringia', nameNative: 'Thüringen' },
];

const DE_VAT_RATES: VatRateData[] = [
  { name: 'Standard', rate: 19.00, validFrom: new Date('2007-01-01') },
  { name: 'Reduced', rate: 7.00, validFrom: new Date('2007-01-01') },
  { name: 'Zero', rate: 0.00, validFrom: new Date('2007-01-01') },
];

const DE_DEDUCTION_CATEGORIES: DeductionCategoryData[] = [
  {
    code: 'TRAVEL',
    name: 'Business Travel',
    description: 'Travel expenses for business purposes',
    legalBasis: '§9 Abs. 1 Satz 3 Nr. 4a EStG',
    requiresProof: true,
  },
  {
    code: 'HOME_OFFICE',
    name: 'Home Office',
    description: 'Home office expenses',
    maxAmount: 1260,
    legalBasis: '§4 Abs. 5 Satz 1 Nr. 6b EStG',
    requiresProof: false,
  },
  {
    code: 'PROFESSIONAL_DEVELOPMENT',
    name: 'Professional Development',
    description: 'Training and education expenses',
    legalBasis: '§9 Abs. 1 Satz 3 Nr. 7 EStG',
    requiresProof: true,
  },
  {
    code: 'OFFICE_SUPPLIES',
    name: 'Office Supplies',
    description: 'Work materials and office supplies',
    legalBasis: '§9 Abs. 1 Satz 3 Nr. 6 EStG',
    requiresProof: true,
  },
  {
    code: 'MEALS',
    name: 'Meal Allowances',
    description: 'Business meal deductions',
    legalBasis: '§9 Abs. 4a EStG',
    requiresProof: true,
  },
  {
    code: 'COMMUTING',
    name: 'Commuting',
    description: 'Commuting expenses (Entfernungspauschale)',
    legalBasis: '§9 Abs. 1 Satz 3 Nr. 4 EStG',
    requiresProof: false,
  },
];

const DE_GOVERNMENT_APIS: GovernmentApiData[] = [
  {
    name: 'ELSTER',
    baseUrl: 'https://www.elster.de',
    sandboxUrl: 'https://www.elster-test.de',
    authType: 'certificate',
  },
  {
    name: 'VIES',
    baseUrl: 'https://ec.europa.eu/taxation_customs/vies',
    authType: 'none',
  },
];

const DE_FEATURES: CountryFeatureData[] = [
  { feature: 'tax_filing', enabled: true },
  { feature: 'vat_validation', enabled: true },
  { feature: 'social_security', enabled: true },
  { feature: 'payroll', enabled: true },
];

const DE_EMPLOYMENT_TYPES: EmploymentTypeData[] = [
  { code: 'FULL_TIME', name: 'Full-time Employee', description: 'Vollzeitbeschäftigung' },
  { code: 'PART_TIME', name: 'Part-time Employee', description: 'Teilzeitbeschäftigung' },
  { code: 'MINI_JOB', name: 'Mini Job', description: 'Geringfügige Beschäftigung (450€)' },
  { code: 'MIDI_JOB', name: 'Midi Job', description: 'Gleitzone (450€ - 1.300€)' },
  { code: 'FREELANCER', name: 'Freelancer', description: 'Freiberufler' },
  { code: 'INTERN', name: 'Intern', description: 'Praktikant' },
];

// ============================================================================
// AUSTRIA (AT)
// ============================================================================

const AUSTRIA: CountryData = {
  code: 'AT',
  code3: 'AUT',
  name: 'Austria',
  nameNative: 'Österreich',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'de-AT',
  timezone: 'Europe/Vienna',
  fiscalYearStart: '01-01',
};

const AT_REGIONS: RegionData[] = [
  { code: 'B', name: 'Burgenland' },
  { code: 'K', name: 'Carinthia', nameNative: 'Kärnten' },
  { code: 'NO', name: 'Lower Austria', nameNative: 'Niederösterreich' },
  { code: 'OO', name: 'Upper Austria', nameNative: 'Oberösterreich' },
  { code: 'S', name: 'Salzburg' },
  { code: 'ST', name: 'Styria', nameNative: 'Steiermark' },
  { code: 'T', name: 'Tyrol', nameNative: 'Tirol' },
  { code: 'V', name: 'Vorarlberg' },
  { code: 'W', name: 'Vienna', nameNative: 'Wien' },
];

const AT_VAT_RATES: VatRateData[] = [
  { name: 'Standard', rate: 20.00, validFrom: new Date('2016-01-01') },
  { name: 'Reduced', rate: 10.00, validFrom: new Date('2016-01-01') },
  { name: 'Super-Reduced', rate: 13.00, validFrom: new Date('2016-01-01') },
  { name: 'Zero', rate: 0.00, validFrom: new Date('2016-01-01') },
];

const AT_DEDUCTION_CATEGORIES: DeductionCategoryData[] = [
  {
    code: 'TRAVEL',
    name: 'Business Travel',
    description: 'Travel expenses for business purposes',
    requiresProof: true,
  },
  {
    code: 'HOME_OFFICE',
    name: 'Home Office',
    description: 'Home office expenses',
    maxAmount: 1200,
    requiresProof: false,
  },
  {
    code: 'PROFESSIONAL_DEVELOPMENT',
    name: 'Professional Development',
    description: 'Training and education expenses',
    requiresProof: true,
  },
  {
    code: 'OFFICE_SUPPLIES',
    name: 'Office Supplies',
    description: 'Work materials and office supplies',
    requiresProof: true,
  },
  {
    code: 'COMMUTING',
    name: 'Commuting',
    description: 'Commuting expenses (Pendlerpauschale)',
    requiresProof: false,
  },
];

const AT_GOVERNMENT_APIS: GovernmentApiData[] = [
  {
    name: 'FinanzOnline',
    baseUrl: 'https://finanzonline.bmf.gv.at',
    authType: 'oauth',
  },
  {
    name: 'VIES',
    baseUrl: 'https://ec.europa.eu/taxation_customs/vies',
    authType: 'none',
  },
];

const AT_FEATURES: CountryFeatureData[] = [
  { feature: 'tax_filing', enabled: true },
  { feature: 'vat_validation', enabled: true },
  { feature: 'social_security', enabled: true },
  { feature: 'payroll', enabled: true },
];

const AT_EMPLOYMENT_TYPES: EmploymentTypeData[] = [
  { code: 'FULL_TIME', name: 'Full-time Employee', description: 'Vollzeitbeschäftigung' },
  { code: 'PART_TIME', name: 'Part-time Employee', description: 'Teilzeitbeschäftigung' },
  { code: 'FREELANCER', name: 'Freelancer', description: 'Freiberufler' },
  { code: 'INTERN', name: 'Intern', description: 'Praktikant' },
  { code: 'MARGINAL', name: 'Marginal Employment', description: 'Geringfügige Beschäftigung' },
];

// ============================================================================
// SWITZERLAND (CH)
// ============================================================================

const SWITZERLAND: CountryData = {
  code: 'CH',
  code3: 'CHE',
  name: 'Switzerland',
  nameNative: 'Schweiz',
  currency: 'CHF',
  currencySymbol: 'CHF',
  locale: 'de-CH',
  timezone: 'Europe/Zurich',
  fiscalYearStart: '01-01',
};

const CH_REGIONS: RegionData[] = [
  { code: 'AG', name: 'Aargau' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'BE', name: 'Bern' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'GE', name: 'Geneva', nameNative: 'Genève' },
  { code: 'GL', name: 'Glarus' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'JU', name: 'Jura' },
  { code: 'LU', name: 'Lucerne', nameNative: 'Luzern' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Ticino', nameNative: 'Ticino' },
  { code: 'UR', name: 'Uri' },
  { code: 'VD', name: 'Vaud' },
  { code: 'VS', name: 'Valais', nameNative: 'Wallis' },
  { code: 'ZG', name: 'Zug' },
  { code: 'ZH', name: 'Zurich', nameNative: 'Zürich' },
];

const CH_VAT_RATES: VatRateData[] = [
  { name: 'Standard', rate: 7.70, validFrom: new Date('2024-01-01') },
  { name: 'Reduced', rate: 2.50, validFrom: new Date('2024-01-01') },
  { name: 'Special', rate: 3.70, validFrom: new Date('2024-01-01') },
  { name: 'Zero', rate: 0.00, validFrom: new Date('2024-01-01') },
];

const CH_DEDUCTION_CATEGORIES: DeductionCategoryData[] = [
  {
    code: 'TRAVEL',
    name: 'Business Travel',
    description: 'Travel expenses for business purposes',
    requiresProof: true,
  },
  {
    code: 'HOME_OFFICE',
    name: 'Home Office',
    description: 'Home office expenses',
    requiresProof: true,
  },
  {
    code: 'PROFESSIONAL_DEVELOPMENT',
    name: 'Professional Development',
    description: 'Training and education expenses',
    requiresProof: true,
  },
  {
    code: 'OFFICE_SUPPLIES',
    name: 'Office Supplies',
    description: 'Work materials and office supplies',
    requiresProof: true,
  },
  {
    code: 'COMMUTING',
    name: 'Commuting',
    description: 'Commuting expenses',
    requiresProof: false,
  },
];

const CH_GOVERNMENT_APIS: GovernmentApiData[] = [
  {
    name: 'UID_Register',
    baseUrl: 'https://www.uid.admin.ch',
    authType: 'api_key',
  },
];

const CH_FEATURES: CountryFeatureData[] = [
  { feature: 'tax_filing', enabled: true },
  { feature: 'vat_validation', enabled: true },
  { feature: 'social_security', enabled: true },
  { feature: 'payroll', enabled: true },
];

const CH_EMPLOYMENT_TYPES: EmploymentTypeData[] = [
  { code: 'FULL_TIME', name: 'Full-time Employee', description: 'Vollzeitbeschäftigung' },
  { code: 'PART_TIME', name: 'Part-time Employee', description: 'Teilzeitbeschäftigung' },
  { code: 'FREELANCER', name: 'Freelancer', description: 'Freiberufler' },
  { code: 'INTERN', name: 'Intern', description: 'Praktikant' },
  { code: 'APPRENTICE', name: 'Apprentice', description: 'Lehrling' },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedCountry(
  countryData: CountryData,
  regions: RegionData[],
  vatRates: VatRateData[],
  deductionCategories: DeductionCategoryData[],
  governmentApis: GovernmentApiData[],
  features: CountryFeatureData[],
  employmentTypes: EmploymentTypeData[]
): Promise<void> {
  console.log(`\nSeeding ${countryData.name} (${countryData.code})...`);

  // Create country
  const country = await prisma.country.create({
    data: countryData,
  });
  console.log(`  ✓ Created country: ${country.name}`);

  // Create regions
  for (const regionData of regions) {
    await prisma.region.create({
      data: {
        countryId: country.id,
        ...regionData,
      },
    });
  }
  console.log(`  ✓ Created ${regions.length} regions`);

  // Create VAT rates
  for (const vatRateData of vatRates) {
    await prisma.vatRate.create({
      data: {
        countryId: country.id,
        ...vatRateData,
      },
    });
  }
  console.log(`  ✓ Created ${vatRates.length} VAT rates`);

  // Create deduction categories
  for (const deductionCategoryData of deductionCategories) {
    await prisma.deductionCategory.create({
      data: {
        countryId: country.id,
        ...deductionCategoryData,
      },
    });
  }
  console.log(`  ✓ Created ${deductionCategories.length} deduction categories`);

  // Create government APIs
  for (const governmentApiData of governmentApis) {
    await prisma.governmentApi.create({
      data: {
        countryId: country.id,
        ...governmentApiData,
      },
    });
  }
  console.log(`  ✓ Created ${governmentApis.length} government APIs`);

  // Create country features
  for (const featureData of features) {
    await prisma.countryFeature.create({
      data: {
        countryId: country.id,
        ...featureData,
      },
    });
  }
  console.log(`  ✓ Created ${features.length} country features`);

  // Create employment types
  for (const employmentTypeData of employmentTypes) {
    await prisma.employmentType.create({
      data: {
        countryId: country.id,
        ...employmentTypeData,
      },
    });
  }
  console.log(`  ✓ Created ${employmentTypes.length} employment types`);
}

export async function seedCountries(): Promise<void> {
  console.log('Starting country context seeding...\n');

  // Clean existing country data (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning existing country data...');
    await prisma.employmentType.deleteMany();
    await prisma.countryFeature.deleteMany();
    await prisma.governmentApi.deleteMany();
    await prisma.deductionCategory.deleteMany();
    await prisma.vatRate.deleteMany();
    await prisma.taxAuthority.deleteMany();
    await prisma.region.deleteMany();
    await prisma.organisationCountry.deleteMany();
    await prisma.country.deleteMany();
    console.log('Cleaned\n');
  }

  // Seed Germany
  await seedCountry(
    GERMANY,
    DE_REGIONS,
    DE_VAT_RATES,
    DE_DEDUCTION_CATEGORIES,
    DE_GOVERNMENT_APIS,
    DE_FEATURES,
    DE_EMPLOYMENT_TYPES
  );

  // Seed Austria
  await seedCountry(
    AUSTRIA,
    AT_REGIONS,
    AT_VAT_RATES,
    AT_DEDUCTION_CATEGORIES,
    AT_GOVERNMENT_APIS,
    AT_FEATURES,
    AT_EMPLOYMENT_TYPES
  );

  // Seed Switzerland
  await seedCountry(
    SWITZERLAND,
    CH_REGIONS,
    CH_VAT_RATES,
    CH_DEDUCTION_CATEGORIES,
    CH_GOVERNMENT_APIS,
    CH_FEATURES,
    CH_EMPLOYMENT_TYPES
  );

  console.log('\n' + '='.repeat(60));
  console.log('Country context seeding completed successfully!');
  console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
  seedCountries()
    .catch((error) => {
      console.error('Country seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
