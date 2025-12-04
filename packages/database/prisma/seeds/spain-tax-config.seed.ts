import { PrismaClient, TaxPeriodType, TaxCategory, InvoiceNumberingType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Spanish (ES) tax configuration
 * Includes IVA (VAT), IGIC (Canary Islands), and Recargo de Equivalencia (RE)
 * Task: W25-T2 - Create Spanish tax configuration
 */
export async function seedSpainTaxConfig() {
  console.log('Seeding Spain tax configuration...');

  // ============================================================================
  // SPAIN (ES)
  // ============================================================================

  const spain = await prisma.country.upsert({
    where: { code: 'ES' },
    update: {},
    create: {
      code: 'ES',
      code3: 'ESP',
      name: 'Spain',
      nameNative: 'España',
      currency: 'EUR',
      currencySymbol: '€',
      locale: 'es-ES',
      timezone: 'Europe/Madrid',
      fiscalYearStart: '01-01',
      isActive: true,
    },
  });

  // Spanish tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: spain.id },
    update: {},
    create: {
      countryId: spain.id,
      vatPeriodType: TaxPeriodType.QUARTERLY, // Modelo 303 quarterly
      corporateTaxPeriodType: TaxPeriodType.ANNUAL,
      vatFilingDeadlineDays: 20, // Day 1-20 of following month after quarter
      vatPaymentDeadlineDays: 20,
      corporateTaxFilingDays: 180, // 6 months after fiscal year end
      corporateTaxPaymentDays: 180,
      invoiceNumberingType: InvoiceNumberingType.SEQUENTIAL,
      requiresDigitalSignature: false,
      requiresQrCode: false,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2025-01-01'),
      eInvoicingFormat: 'Facturae',
      eInvoicingNetwork: 'FACe / FACeB2B',
      viesValidationRequired: true,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      legalBasis: 'EU VAT Directive 2006/112/EC, Ley 37/1992 IVA',
      notes: JSON.stringify({
        quarterlyFilingDates: [
          { quarter: 'Q1', period: 'Jan-Mar', filingDates: 'April 1-20' },
          { quarter: 'Q2', period: 'Apr-Jun', filingDates: 'July 1-20' },
          { quarter: 'Q3', period: 'Jul-Sep', filingDates: 'October 1-20' },
          { quarter: 'Q4', period: 'Oct-Dec', filingDates: 'January 1-30' },
        ],
        annualSummary: {
          form: 'Modelo 390',
          filingPeriod: 'January 1-30 following year',
        },
        specialRegimes: {
          REBU: 'Régimen Especial de Bienes Usados (Second-hand goods)',
          RECC: 'Régimen Especial del Criterio de Caja (Cash accounting)',
          REGE: 'Régimen Especial del Grupo de Entidades (Group entities)',
          SimplifiedRegime: 'Régimen Simplificado (Simplified regime)',
        },
        canaryIslands: {
          note: 'Canary Islands use IGIC (Impuesto General Indirecto Canario) instead of IVA',
          applicableRegions: ['Las Palmas', 'Santa Cruz de Tenerife'],
        },
      }),
    },
  });

  // Get the tax config for Spain
  const spainTaxConfig = await prisma.countryTaxConfig.findUnique({
    where: { countryId: spain.id },
  });

  if (!spainTaxConfig) {
    throw new Error('Failed to create Spain tax configuration');
  }

  // ============================================================================
  // STANDARD IVA (VAT) RATES - MAINLAND SPAIN
  // ============================================================================

  const spainVatRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 21.0,
      description: 'IVA General - Standard rate for most goods and services',
      examples: JSON.stringify([
        'Electronics and appliances',
        'Vehicles',
        'Alcoholic beverages',
        'Tobacco products',
        'Jewelry and luxury goods',
        'Professional services',
        'Hotel accommodation',
        'Restaurant services',
      ]),
      legalBasis: 'Ley 37/1992, Art. 90.Uno',
      euDirectiveRef: 'EU VAT Directive 2006/112/EC, Art. 97',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 10.0,
      description: 'IVA Reducido - Reduced rate for essential goods and services',
      examples: JSON.stringify([
        'Food products (most)',
        'Water supply',
        'Pharmaceutical products',
        'Medical equipment for disabled persons',
        'Passenger transport',
        'Restaurant and catering services',
        'Cultural services (cinema, theater, concerts)',
        'Books, newspapers, and magazines',
        'Housing construction and renovation',
        'Agricultural inputs',
      ]),
      legalBasis: 'Ley 37/1992, Art. 91.Uno',
      euDirectiveRef: 'EU VAT Directive 2006/112/EC, Annex III',
    },
    {
      category: TaxCategory.SUPER_REDUCED,
      rate: 4.0,
      description: 'IVA Superreducido - Super-reduced rate for basic necessities',
      examples: JSON.stringify([
        'Bread and cereals',
        'Milk and dairy products',
        'Eggs',
        'Fruits and vegetables',
        'Grains and flour',
        'Books (educational and cultural)',
        'Newspapers and periodicals',
        'Medicines for human use',
        'Wheelchairs for disabled persons',
        'Social housing (first-time buyers, VPO)',
      ]),
      legalBasis: 'Ley 37/1992, Art. 91.Dos',
      euDirectiveRef: 'EU VAT Directive 2006/112/EC, Art. 98',
    },
    {
      category: TaxCategory.ZERO,
      rate: 0.0,
      description: 'Zero-rated - Exports and intra-EU supplies',
      examples: JSON.stringify([
        'Exports to non-EU countries',
        'Intra-community supplies (to EU VAT-registered businesses)',
        'International transport of goods',
        'Services related to exports',
      ]),
      legalBasis: 'Ley 37/1992, Art. 21-25',
      euDirectiveRef: 'EU VAT Directive 2006/112/EC, Art. 146-147',
    },
  ];

  for (const rate of spainVatRates) {
    await prisma.vatRateConfig.upsert({
      where: {
        taxConfigId_category_rate: {
          taxConfigId: spainTaxConfig.id,
          category: rate.category,
          rate: rate.rate,
        },
      },
      update: {},
      create: {
        taxConfigId: spainTaxConfig.id,
        category: rate.category,
        rate: rate.rate,
        description: rate.description,
        validFrom: new Date('2012-09-01'), // Last major rate change
        examples: rate.examples,
        legalBasis: rate.legalBasis,
        euDirectiveRef: rate.euDirectiveRef,
      },
    });
  }

  // ============================================================================
  // RECARGO DE EQUIVALENCIA (RE) - Surcharge for retailers
  // ============================================================================

  const recargoRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 5.2,
      description: 'Recargo de Equivalencia - Standard rate surcharge (applies with 21% IVA)',
      examples: JSON.stringify([
        'Retail sales by small retailers (régimen de recargo de equivalencia)',
        'Applied on top of 21% IVA = 26.2% total',
      ]),
      legalBasis: 'Ley 37/1992, Art. 148-154',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 1.4,
      description: 'Recargo de Equivalencia - Reduced rate surcharge (applies with 10% IVA)',
      examples: JSON.stringify([
        'Retail sales by small retailers (régimen de recargo de equivalencia)',
        'Applied on top of 10% IVA = 11.4% total',
      ]),
      legalBasis: 'Ley 37/1992, Art. 148-154',
    },
    {
      category: TaxCategory.SUPER_REDUCED,
      rate: 0.5,
      description: 'Recargo de Equivalencia - Super-reduced rate surcharge (applies with 4% IVA)',
      examples: JSON.stringify([
        'Retail sales by small retailers (régimen de recargo de equivalencia)',
        'Applied on top of 4% IVA = 4.5% total',
      ]),
      legalBasis: 'Ley 37/1992, Art. 148-154',
    },
  ];

  for (const rate of recargoRates) {
    await prisma.vatRateConfig.upsert({
      where: {
        taxConfigId_category_rate: {
          taxConfigId: spainTaxConfig.id,
          category: rate.category,
          rate: rate.rate,
        },
      },
      update: {},
      create: {
        taxConfigId: spainTaxConfig.id,
        category: rate.category,
        rate: rate.rate,
        description: rate.description,
        validFrom: new Date('2012-09-01'),
        examples: rate.examples,
        legalBasis: rate.legalBasis,
        conditions: JSON.stringify({
          regime: 'RECARGO_EQUIVALENCIA',
          applicableTo: 'Small retailers under recargo de equivalencia regime',
          note: 'This is a surcharge added ON TOP of regular IVA rates',
        }),
      },
    });
  }

  // ============================================================================
  // CANARY ISLANDS - IGIC (Impuesto General Indirecto Canario)
  // ============================================================================

  // Note: IGIC is a separate tax system for Canary Islands
  // It replaces IVA in this autonomous region

  const igicRates = [
    {
      category: TaxCategory.STANDARD,
      rate: 7.0,
      description: 'IGIC General - Standard rate for Canary Islands',
      examples: JSON.stringify([
        'Most goods and services in Canary Islands',
        'Electronics',
        'Vehicles',
        'General retail',
      ]),
      legalBasis: 'Ley 20/1991 IGIC, Art. 27',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 3.0,
      description: 'IGIC Reducido - Reduced rate for Canary Islands',
      examples: JSON.stringify([
        'Food products',
        'Restaurant services',
        'Passenger transport',
        'Cultural services',
      ]),
      legalBasis: 'Ley 20/1991 IGIC, Art. 28',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 9.5,
      description: 'IGIC Incrementado - Increased reduced rate for Canary Islands',
      examples: JSON.stringify([
        'Tobacco products',
        'Alcoholic beverages',
        'Certain luxury goods',
      ]),
      legalBasis: 'Ley 20/1991 IGIC, Art. 29',
    },
    {
      category: TaxCategory.REDUCED,
      rate: 15.0,
      description: 'IGIC Especial - Special rate for Canary Islands',
      examples: JSON.stringify([
        'Certain luxury items',
        'High-value goods',
        'Premium alcoholic beverages',
        'Tobacco products (special category)',
      ]),
      legalBasis: 'Ley 20/1991 IGIC, Art. 29 bis',
    },
    {
      category: TaxCategory.ZERO,
      rate: 0.0,
      description: 'IGIC Zero rate - Exports and exempt categories',
      examples: JSON.stringify([
        'Exports',
        'Certain essential goods',
        'Bread and flour',
        'Basic foodstuffs',
      ]),
      legalBasis: 'Ley 20/1991 IGIC, Art. 50',
    },
  ];

  for (const rate of igicRates) {
    await prisma.vatRateConfig.upsert({
      where: {
        taxConfigId_category_rate: {
          taxConfigId: spainTaxConfig.id,
          category: rate.category,
          rate: rate.rate,
        },
      },
      update: {},
      create: {
        taxConfigId: spainTaxConfig.id,
        category: rate.category,
        rate: rate.rate,
        description: rate.description,
        validFrom: new Date('2019-01-01'),
        examples: rate.examples,
        legalBasis: rate.legalBasis,
        conditions: JSON.stringify({
          region: 'CANARY_ISLANDS',
          applicableTo: 'Las Palmas and Santa Cruz de Tenerife provinces only',
          note: 'IGIC replaces IVA in Canary Islands - different tax system',
          excludedFrom: 'Mainland Spain, Ceuta, Melilla',
        }),
      },
    });
  }

  // ============================================================================

  // ============================================================================
  // TAX FILING DEADLINES - Note
  // ============================================================================
  
  // NOTE: Filing deadlines are handled via the TaxFilingDeadline model
  // Key Spanish VAT filing deadlines:
  // - Modelo 303 Q1 (Jan-Mar): April 1-20
  // - Modelo 303 Q2 (Apr-Jun): July 1-20
  // - Modelo 303 Q3 (Jul-Sep): October 1-20
  // - Modelo 303 Q4 (Oct-Dec): January 1-30
  // - Modelo 390 (Annual): January 1-30
  // - Modelo 347 (Annual operations): February 1-28
  // These are documented in SPAIN_QUARTERLY_DEADLINES and SPAIN_ANNUAL_DEADLINES constants
  
  console.log('✅ Spain tax configuration seeded successfully');
  console.log('   - Standard IVA rates: 21%, 10%, 4%, 0%');
  console.log('   - Recargo de Equivalencia: 5.2%, 1.4%, 0.5%');
  console.log('   - IGIC (Canary Islands): 15%, 9.5%, 7%, 3%, 0%');
  console.log('   - Tax filing information documented in constants');
}
