import { PrismaClient, TaxPeriodType, TaxCategory, InvoiceNumberingType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed EU country data with comprehensive tax configurations
 * Countries: FR, IT, NL, BE, SE, IE
 * Task: W24-T5 - Add EU country tax configurations
 */
export async function seedEUCountries() {
  console.log('Seeding EU countries with tax configurations...');

  // ============================================================================
  // FRANCE (FR)
  // ============================================================================

  const france = await prisma.country.upsert({
    where: { code: 'FR' },
    update: {},
    create: {
      code: 'FR',
      code3: 'FRA',
      name: 'France',
      nameNative: 'France',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // French tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: france.id },
    update: {},
    create: {
      countryId: france.id,
      vatPeriodType: TaxPeriodType.MONTHLY,
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 24,
      vatPaymentDeadlineDays: 24,
      corporateTaxFilingDays: 120,
      corporateTaxPaymentDays: 120,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2026-09-01'),
      eInvoicingFormat: 'Chorus Pro / Factur-X',
      eInvoicingNetwork: 'Chorus Pro',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      legalBasis: 'EU VAT Directive 2006/112/EC',
    },
  });

  // Get the tax config for France
  const franceTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: france.id },
  });

  // French VAT rates (TVA)
  const franceVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 20.0,
      description: 'TVA Standard Rate - Most goods and services',
      examples: JSON.stringify([
        'Electronics',
        'Clothing',
        'General services',
        'Alcohol',
        'Tobacco',
      ]),
      legalBasis: 'Article 278 CGI',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 10.0,
      description: 'TVA Reduced Rate - Restaurant services, transportation, hotels',
      examples: JSON.stringify([
        'Restaurant meals',
        'Passenger transport',
        'Hotel accommodation',
        'Cultural events',
      ]),
      legalBasis: 'Article 278-0 bis CGI',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 5.5,
      description: 'TVA Reduced Rate - Food, books, energy, social housing',
      examples: JSON.stringify([
        'Food products',
        'Books',
        'Water supply',
        'Energy products',
        'Social housing construction',
      ]),
      legalBasis: 'Article 278-0 bis A CGI',
    },
    {
      category: TaxCategory.SUPER_REDUCED,
      rate: 2.1,
      description: 'TVA Super-Reduced Rate - Newspapers, medicines',
      examples: JSON.stringify([
        'Press publications',
        'Reimbursable medicines',
        'TV license fees',
      ]),
      legalBasis: 'Article 281 quater CGI',
    },
  ];

  for (const vatRate of franceVatRates) {
    await prisma.vatRateConfig.create({
      data: {
        taxConfigId: franceTaxConfig!.id,
        ...vatRate,
        validFrom: new Date('2014-01-01'),
        euDirectiveRef: 'Directive 2006/112/EC Art. 96-99',
      },
    });
  }

  // French regions
  const frenchRegions = [
    { code: 'ARA', name: 'Auvergne-Rhône-Alpes', nameNative: 'Auvergne-Rhône-Alpes' },
    { code: 'BFC', name: 'Bourgogne-Franche-Comté', nameNative: 'Bourgogne-Franche-Comté' },
    { code: 'BRE', name: 'Brittany', nameNative: 'Bretagne' },
    { code: 'CVL', name: 'Centre-Val de Loire', nameNative: 'Centre-Val de Loire' },
    { code: 'COR', name: 'Corsica', nameNative: 'Corse' },
    { code: 'GES', name: 'Grand Est', nameNative: 'Grand Est' },
    { code: 'HDF', name: 'Hauts-de-France', nameNative: 'Hauts-de-France' },
    { code: 'IDF', name: 'Île-de-France', nameNative: 'Île-de-France' },
    { code: 'NOR', name: 'Normandy', nameNative: 'Normandie' },
    { code: 'NAQ', name: 'Nouvelle-Aquitaine', nameNative: 'Nouvelle-Aquitaine' },
    { code: 'OCC', name: 'Occitanie', nameNative: 'Occitanie' },
    { code: 'PDL', name: 'Pays de la Loire', nameNative: 'Pays de la Loire' },
    { code: 'PAC', name: "Provence-Alpes-Côte d'Azur", nameNative: "Provence-Alpes-Côte d'Azur" },
  ];

  for (const region of frenchRegions) {
    await prisma.region.upsert({
      where: { countryId_code: { countryId: france.id, code: region.code } },
      update: {},
      create: { countryId: france.id, ...region },
    });
  }

  // ============================================================================
  // ITALY (IT)
  // ============================================================================

  const italy = await prisma.country.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      code: 'IT',
      code3: 'ITA',
      name: 'Italy',
      nameNative: 'Italia',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'it-IT',
      timezone: 'Europe/Rome',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Italian tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: italy.id },
    update: {},
    create: {
      countryId: italy.id,
      vatPeriodType: TaxPeriodType.MONTHLY,
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 16,
      vatPaymentDeadlineDays: 16,
      corporateTaxFilingDays: 180,
      corporateTaxPaymentDays: 180,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: true,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2019-01-01'),
      eInvoicingFormat: 'FatturaPA',
      eInvoicingNetwork: 'Sistema di Interscambio (SDI)',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      legalBasis: 'EU VAT Directive 2006/112/EC',
    },
  });

  const italyTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: italy.id },
  });

  // Italian VAT rates (IVA)
  const italyVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 22.0,
      description: 'IVA Ordinaria - Standard rate for most goods and services',
      examples: JSON.stringify([
        'Electronics',
        'Clothing',
        'Furniture',
        'Professional services',
      ]),
      legalBasis: 'DPR 633/1972 Art. 16',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 10.0,
      description: 'IVA Ridotta - Reduced rate for specific goods and services',
      examples: JSON.stringify([
        'Food products',
        'Restaurant services',
        'Hotel accommodation',
        'Construction works',
      ]),
      legalBasis: 'DPR 633/1972 Tabella A Parte II',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 5.0,
      description: 'IVA Ridotta - Social goods and services',
      examples: JSON.stringify([
        'Basic food items',
        'Social housing',
        'Medical devices',
      ]),
      legalBasis: 'DPR 633/1972 Tabella A Parte II-bis',
    },
    {
      category: TaxCategory.SUPER_REDUCED,
      rate: 4.0,
      description: 'IVA Minima - Essential goods',
      examples: JSON.stringify([
        'Basic food products',
        'Newspapers',
        'Books',
        'Agricultural products',
      ]),
      legalBasis: 'DPR 633/1972 Tabella A Parte III',
    },
  ];

  for (const vatRate of italyVatRates) {
    await prisma.vatRateConfig.create({
      data: {
        taxConfigId: italyTaxConfig!.id,
        ...vatRate,
        validFrom: new Date('2013-10-01'),
        euDirectiveRef: 'Directive 2006/112/EC Art. 96-99',
      },
    });
  }

  // Italian regions
  const italianRegions = [
    { code: 'ABR', name: 'Abruzzo', nameNative: 'Abruzzo' },
    { code: 'BAS', name: 'Basilicata', nameNative: 'Basilicata' },
    { code: 'CAL', name: 'Calabria', nameNative: 'Calabria' },
    { code: 'CAM', name: 'Campania', nameNative: 'Campania' },
    { code: 'EMR', name: 'Emilia-Romagna', nameNative: 'Emilia-Romagna' },
    { code: 'FVG', name: 'Friuli-Venezia Giulia', nameNative: 'Friuli-Venezia Giulia' },
    { code: 'LAZ', name: 'Lazio', nameNative: 'Lazio' },
    { code: 'LIG', name: 'Liguria', nameNative: 'Liguria' },
    { code: 'LOM', name: 'Lombardy', nameNative: 'Lombardia' },
    { code: 'MAR', name: 'Marche', nameNative: 'Marche' },
    { code: 'MOL', name: 'Molise', nameNative: 'Molise' },
    { code: 'PMN', name: 'Piedmont', nameNative: 'Piemonte' },
    { code: 'PUG', name: 'Apulia', nameNative: 'Puglia' },
    { code: 'SAR', name: 'Sardinia', nameNative: 'Sardegna' },
    { code: 'SIC', name: 'Sicily', nameNative: 'Sicilia' },
    { code: 'TOS', name: 'Tuscany', nameNative: 'Toscana' },
    { code: 'TAA', name: 'Trentino-Alto Adige', nameNative: 'Trentino-Alto Adige' },
    { code: 'UMB', name: 'Umbria', nameNative: 'Umbria' },
    { code: 'VDA', name: "Aosta Valley", nameNative: "Valle d'Aosta" },
    { code: 'VEN', name: 'Veneto', nameNative: 'Veneto' },
  ];

  for (const region of italianRegions) {
    await prisma.region.upsert({
      where: { countryId_code: { countryId: italy.id, code: region.code } },
      update: {},
      create: { countryId: italy.id, ...region },
    });
  }

  // ============================================================================
  // NETHERLANDS (NL)
  // ============================================================================

  const netherlands = await prisma.country.upsert({
    where: { code: 'NL' },
    update: {},
    create: {
      code: 'NL',
      code3: 'NLD',
      name: 'Netherlands',
      nameNative: 'Nederland',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'nl-NL',
      timezone: 'Europe/Amsterdam',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Dutch tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: netherlands.id },
    update: {},
    create: {
      countryId: netherlands.id,
      vatPeriodType: TaxPeriodType.QUARTERLY,
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 31,
      vatPaymentDeadlineDays: 31,
      corporateTaxFilingDays: 150,
      corporateTaxPaymentDays: 150,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2026-01-01'),
      eInvoicingFormat: 'Peppol BIS Billing 3.0',
      eInvoicingNetwork: 'Peppol',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: true,
      saftTFrequency: TaxPeriodType.ANNUAL,
      legalBasis: 'EU VAT Directive 2006/112/EC',
    },
  });

  const netherlandsTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: netherlands.id },
  });

  // Dutch VAT rates (BTW)
  const netherlandsVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 21.0,
      description: 'BTW Algemeen Tarief - Standard rate',
      examples: JSON.stringify([
        'Electronics',
        'Clothing',
        'Services',
        'Alcohol',
      ]),
      legalBasis: 'Wet OB 1968 Art. 9',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 9.0,
      description: 'BTW Verlaagd Tarief - Reduced rate',
      examples: JSON.stringify([
        'Food products',
        'Books',
        'Newspapers',
        'Medicines',
        'Passenger transport',
        'Hotel accommodation',
        'Hairdressing',
      ]),
      legalBasis: 'Wet OB 1968 Tabel I',
    },
    {
      category: TaxCategory.ZERO,
      rate: 0.0,
      description: 'Zero-rated - Exports and intra-community supplies',
      examples: JSON.stringify([
        'Exports outside EU',
        'Intra-community supplies',
        'International transport',
      ]),
      legalBasis: 'Wet OB 1968 Art. 11',
    },
  ];

  for (const vatRate of netherlandsVatRates) {
    await prisma.vatRateConfig.create({
      data: {
        taxConfigId: netherlandsTaxConfig!.id,
        ...vatRate,
        validFrom: new Date('2019-01-01'),
        euDirectiveRef: 'Directive 2006/112/EC Art. 96-99',
      },
    });
  }

  // Dutch provinces
  const dutchProvinces = [
    { code: 'DR', name: 'Drenthe', nameNative: 'Drenthe' },
    { code: 'FL', name: 'Flevoland', nameNative: 'Flevoland' },
    { code: 'FR', name: 'Friesland', nameNative: 'Fryslân' },
    { code: 'GE', name: 'Gelderland', nameNative: 'Gelderland' },
    { code: 'GR', name: 'Groningen', nameNative: 'Groningen' },
    { code: 'LI', name: 'Limburg', nameNative: 'Limburg' },
    { code: 'NB', name: 'North Brabant', nameNative: 'Noord-Brabant' },
    { code: 'NH', name: 'North Holland', nameNative: 'Noord-Holland' },
    { code: 'OV', name: 'Overijssel', nameNative: 'Overijssel' },
    { code: 'UT', name: 'Utrecht', nameNative: 'Utrecht' },
    { code: 'ZE', name: 'Zeeland', nameNative: 'Zeeland' },
    { code: 'ZH', name: 'South Holland', nameNative: 'Zuid-Holland' },
  ];

  for (const province of dutchProvinces) {
    await prisma.region.upsert({
      where: { countryId_code: { countryId: netherlands.id, code: province.code } },
      update: {},
      create: { countryId: netherlands.id, ...province },
    });
  }

  // ============================================================================
  // BELGIUM (BE)
  // ============================================================================

  const belgium = await prisma.country.upsert({
    where: { code: 'BE' },
    update: {},
    create: {
      code: 'BE',
      code3: 'BEL',
      name: 'Belgium',
      nameNative: 'België / Belgique',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'nl-BE',
      timezone: 'Europe/Brussels',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Belgian tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: belgium.id },
    update: {},
    create: {
      countryId: belgium.id,
      vatPeriodType: TaxPeriodType.MONTHLY,
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 20,
      vatPaymentDeadlineDays: 20,
      corporateTaxFilingDays: 180,
      corporateTaxPaymentDays: 180,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2026-01-01'),
      eInvoicingFormat: 'Peppol BIS Billing 3.0',
      eInvoicingNetwork: 'Peppol',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      legalBasis: 'EU VAT Directive 2006/112/EC',
    },
  });

  const belgiumTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: belgium.id },
  });

  // Belgian VAT rates (TVA/BTW)
  const belgiumVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 21.0,
      description: 'TVA/BTW Normale - Standard rate',
      examples: JSON.stringify([
        'Electronics',
        'Clothing',
        'Services',
        'Alcohol',
      ]),
      legalBasis: 'Code TVA Art. 37',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 12.0,
      description: 'TVA/BTW Intermédiaire - Intermediate rate',
      examples: JSON.stringify([
        'Restaurant services',
        'Social housing',
        'Coal products',
      ]),
      legalBasis: 'Code TVA Tableau B',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 6.0,
      description: 'TVA/BTW Réduite - Reduced rate',
      examples: JSON.stringify([
        'Food products',
        'Water supply',
        'Medicines',
        'Books',
        'Newspapers',
        'Hotel accommodation',
        'Passenger transport',
      ]),
      legalBasis: 'Code TVA Tableau A',
    },
    {
      category: TaxCategory.ZERO,
      rate: 0.0,
      description: 'Zero-rated - Exports and specific services',
      examples: JSON.stringify([
        'Exports outside EU',
        'Intra-community supplies',
        'International transport',
        'Recycled materials',
      ]),
      legalBasis: 'Code TVA Art. 39bis',
    },
  ];

  for (const vatRate of belgiumVatRates) {
    await prisma.vatRateConfig.create({
      data: {
        taxConfigId: belgiumTaxConfig!.id,
        ...vatRate,
        validFrom: new Date('2014-01-01'),
        euDirectiveRef: 'Directive 2006/112/EC Art. 96-99',
      },
    });
  }

  // Belgian regions
  const belgianRegions = [
    { code: 'BRU', name: 'Brussels', nameNative: 'Bruxelles / Brussel' },
    { code: 'VLG', name: 'Flanders', nameNative: 'Vlaanderen' },
    { code: 'WAL', name: 'Wallonia', nameNative: 'Wallonie' },
  ];

  for (const region of belgianRegions) {
    await prisma.region.upsert({
      where: { countryId_code: { countryId: belgium.id, code: region.code } },
      update: {},
      create: { countryId: belgium.id, ...region },
    });
  }

  // ============================================================================
  // SWEDEN (SE)
  // ============================================================================

  const sweden = await prisma.country.upsert({
    where: { code: 'SE' },
    update: {},
    create: {
      code: 'SE',
      code3: 'SWE',
      name: 'Sweden',
      nameNative: 'Sverige',
      currency: 'SEK',
      currencySymbol: 'kr',
      locale: 'sv-SE',
      timezone: 'Europe/Stockholm',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Swedish tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: sweden.id },
    update: {},
    create: {
      countryId: sweden.id,
      vatPeriodType: TaxPeriodType.MONTHLY,
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 26,
      vatPaymentDeadlineDays: 12,
      corporateTaxFilingDays: 180,
      corporateTaxPaymentDays: 180,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2025-01-01'),
      eInvoicingFormat: 'Peppol BIS Billing 3.0',
      eInvoicingNetwork: 'Peppol',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      legalBasis: 'EU VAT Directive 2006/112/EC',
    },
  });

  const swedenTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: sweden.id },
  });

  // Swedish VAT rates (MOMS)
  const swedenVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 25.0,
      description: 'MOMS Normalskattesats - Standard rate',
      examples: JSON.stringify([
        'Electronics',
        'Clothing',
        'Services',
        'Alcohol',
        'Tobacco',
      ]),
      legalBasis: 'Mervärdesskattelagen (1994:200) 7 kap. 1 §',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 12.0,
      description: 'MOMS Reducerad skattesats - Reduced rate',
      examples: JSON.stringify([
        'Food products',
        'Restaurant services',
        'Hotel accommodation',
        'Cultural events',
        'Small repairs',
      ]),
      legalBasis: 'Mervärdesskattelagen 7 kap. 1 §',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 6.0,
      description: 'MOMS Lägsta skattesats - Lowest rate',
      examples: JSON.stringify([
        'Newspapers',
        'Magazines',
        'Books',
        'Passenger transport',
        'Cultural services',
      ]),
      legalBasis: 'Mervärdesskattelagen 7 kap. 1 §',
    },
    {
      category: TaxCategory.ZERO,
      rate: 0.0,
      description: 'Zero-rated - Exports and international transport',
      examples: JSON.stringify([
        'Exports outside EU',
        'Intra-community supplies',
        'International transport',
      ]),
      legalBasis: 'Mervärdesskattelagen 5 kap.',
    },
  ];

  for (const vatRate of swedenVatRates) {
    await prisma.vatRateConfig.create({
      data: {
        taxConfigId: swedenTaxConfig!.id,
        ...vatRate,
        validFrom: new Date('2013-01-01'),
        euDirectiveRef: 'Directive 2006/112/EC Art. 96-99',
      },
    });
  }

  // Swedish counties (län)
  const swedishCounties = [
    { code: 'AB', name: 'Stockholm County', nameNative: 'Stockholms län' },
    { code: 'C', name: 'Uppsala County', nameNative: 'Uppsala län' },
    { code: 'D', name: 'Södermanland County', nameNative: 'Södermanlands län' },
    { code: 'E', name: 'Östergötland County', nameNative: 'Östergötlands län' },
    { code: 'F', name: 'Jönköping County', nameNative: 'Jönköpings län' },
    { code: 'G', name: 'Kronoberg County', nameNative: 'Kronobergs län' },
    { code: 'H', name: 'Kalmar County', nameNative: 'Kalmar län' },
    { code: 'I', name: 'Gotland County', nameNative: 'Gotlands län' },
    { code: 'K', name: 'Blekinge County', nameNative: 'Blekinge län' },
    { code: 'M', name: 'Skåne County', nameNative: 'Skåne län' },
    { code: 'N', name: 'Halland County', nameNative: 'Hallands län' },
    { code: 'O', name: 'Västra Götaland County', nameNative: 'Västra Götalands län' },
    { code: 'S', name: 'Värmland County', nameNative: 'Värmlands län' },
    { code: 'T', name: 'Örebro County', nameNative: 'Örebro län' },
    { code: 'U', name: 'Västmanland County', nameNative: 'Västmanlands län' },
    { code: 'W', name: 'Dalarna County', nameNative: 'Dalarnas län' },
    { code: 'X', name: 'Gävleborg County', nameNative: 'Gävleborgs län' },
    { code: 'Y', name: 'Västernorrland County', nameNative: 'Västernorrlands län' },
    { code: 'Z', name: 'Jämtland County', nameNative: 'Jämtlands län' },
    { code: 'AC', name: 'Västerbotten County', nameNative: 'Västerbottens län' },
    { code: 'BD', name: 'Norrbotten County', nameNative: 'Norrbottens län' },
  ];

  for (const county of swedishCounties) {
    await prisma.region.upsert({
      where: { countryId_code: { countryId: sweden.id, code: county.code } },
      update: {},
      create: { countryId: sweden.id, ...county },
    });
  }

  // ============================================================================
  // IRELAND (IE)
  // ============================================================================

  const ireland = await prisma.country.upsert({
    where: { code: 'IE' },
    update: {},
    create: {
      code: 'IE',
      code3: 'IRL',
      name: 'Ireland',
      nameNative: 'Éire',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'en-IE',
      timezone: 'Europe/Dublin',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Irish tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: ireland.id },
    update: {},
    create: {
      countryId: ireland.id,
      vatPeriodType: TaxPeriodType.BI_MONTHLY,
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 19,
      vatPaymentDeadlineDays: 19,
      corporateTaxFilingDays: 270,
      corporateTaxPaymentDays: 270,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2026-01-01'),
      eInvoicingFormat: 'Peppol BIS Billing 3.0',
      eInvoicingNetwork: 'Peppol',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: true,
      saftTFrequency: TaxPeriodType.ANNUAL,
      legalBasis: 'EU VAT Directive 2006/112/EC',
    },
  });

  const irelandTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: ireland.id },
  });

  // Irish VAT rates (VAT)
  const irelandVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 23.0,
      description: 'VAT Standard Rate',
      examples: JSON.stringify([
        'Electronics',
        'Clothing',
        'Services',
        'Alcohol',
      ]),
      legalBasis: 'VAT Consolidation Act 2010 Schedule 3',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 13.5,
      description: 'VAT Second Reduced Rate',
      examples: JSON.stringify([
        'Fuel and heating',
        'Building services',
        'Veterinary services',
        'Short-term vehicle hire',
        'Agricultural services',
      ]),
      legalBasis: 'VAT Consolidation Act 2010 Schedule 3',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 9.0,
      description: 'VAT Reduced Rate - Tourism and hospitality',
      examples: JSON.stringify([
        'Restaurant and catering services',
        'Hotel accommodation',
        'Hairdressing',
        'Printed matter',
        'Sports facilities',
      ]),
      legalBasis: 'VAT Consolidation Act 2010 Schedule 3',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 4.8,
      description: 'VAT Livestock Rate',
      examples: JSON.stringify([
        'Livestock (horses, greyhounds, cattle, etc.)',
        'Hire of horses',
      ]),
      legalBasis: 'VAT Consolidation Act 2010 Schedule 3',
    },
    {
      category: TaxCategory.ZERO,
      rate: 0.0,
      description: 'Zero-rated supplies',
      examples: JSON.stringify([
        'Exports',
        'Intra-community supplies',
        'Food and drink (most)',
        'Children\'s clothing and footwear',
        'Books and educational materials',
        'Oral medicine',
      ]),
      legalBasis: 'VAT Consolidation Act 2010 Schedule 2',
    },
  ];

  for (const vatRate of irelandVatRates) {
    await prisma.vatRateConfig.create({
      data: {
        taxConfigId: irelandTaxConfig!.id,
        ...vatRate,
        validFrom: new Date('2021-09-01'),
        euDirectiveRef: 'Directive 2006/112/EC Art. 96-99',
      },
    });
  }

  // Irish counties
  const irishCounties = [
    { code: 'CW', name: 'Carlow', nameNative: 'Ceatharlach' },
    { code: 'CN', name: 'Cavan', nameNative: 'An Cabhán' },
    { code: 'CE', name: 'Clare', nameNative: 'An Clár' },
    { code: 'CO', name: 'Cork', nameNative: 'Corcaigh' },
    { code: 'DL', name: 'Donegal', nameNative: 'Dún na nGall' },
    { code: 'D', name: 'Dublin', nameNative: 'Baile Átha Cliath' },
    { code: 'G', name: 'Galway', nameNative: 'Gaillimh' },
    { code: 'KY', name: 'Kerry', nameNative: 'Ciarraí' },
    { code: 'KE', name: 'Kildare', nameNative: 'Cill Dara' },
    { code: 'KK', name: 'Kilkenny', nameNative: 'Cill Chainnigh' },
    { code: 'LS', name: 'Laois', nameNative: 'Laois' },
    { code: 'LM', name: 'Leitrim', nameNative: 'Liatroim' },
    { code: 'LK', name: 'Limerick', nameNative: 'Luimneach' },
    { code: 'LD', name: 'Longford', nameNative: 'An Longfort' },
    { code: 'LH', name: 'Louth', nameNative: 'Lú' },
    { code: 'MO', name: 'Mayo', nameNative: 'Maigh Eo' },
    { code: 'MH', name: 'Meath', nameNative: 'An Mhí' },
    { code: 'MN', name: 'Monaghan', nameNative: 'Muineachán' },
    { code: 'OY', name: 'Offaly', nameNative: 'Uíbh Fhailí' },
    { code: 'RN', name: 'Roscommon', nameNative: 'Ros Comáin' },
    { code: 'SO', name: 'Sligo', nameNative: 'Sligeach' },
    { code: 'TA', name: 'Tipperary', nameNative: 'Tiobraid Árann' },
    { code: 'WD', name: 'Waterford', nameNative: 'Port Láirge' },
    { code: 'WH', name: 'Westmeath', nameNative: 'An Iarmhí' },
    { code: 'WX', name: 'Wexford', nameNative: 'Loch Garman' },
    { code: 'WW', name: 'Wicklow', nameNative: 'Cill Mhantáin' },
  ];

  for (const county of irishCounties) {
    await prisma.region.upsert({
      where: { countryId_code: { countryId: ireland.id, code: county.code } },
      update: {},
      create: { countryId: ireland.id, ...county },
    });
  }

  console.log('EU countries seeded successfully!');
  console.log(`  - France (${france.code}): ${frenchRegions.length} regions, ${franceVatRates.length} VAT rates`);
  console.log(`  - Italy (${italy.code}): ${italianRegions.length} regions, ${italyVatRates.length} VAT rates`);
  console.log(`  - Netherlands (${netherlands.code}): ${dutchProvinces.length} provinces, ${netherlandsVatRates.length} VAT rates`);
  console.log(`  - Belgium (${belgium.code}): ${belgianRegions.length} regions, ${belgiumVatRates.length} VAT rates`);
  console.log(`  - Sweden (${sweden.code}): ${swedishCounties.length} counties, ${swedenVatRates.length} VAT rates`);
  console.log(`  - Ireland (${ireland.code}): ${irishCounties.length} counties, ${irelandVatRates.length} VAT rates`);
}
