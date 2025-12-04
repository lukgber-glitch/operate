/**
 * India GST Tax Configuration Seed Data
 * Task: W29-T4 - India GST configuration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedIndiaTaxConfig() {
  console.log('Seeding India GST tax configuration...');

  // Create India country
  const india = await prisma.country.upsert({
    where: { code: 'IN' },
    update: {},
    create: {
      code: 'IN',
      code3: 'IND',
      name: 'India',
      officialName: 'Republic of India',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      languages: JSON.stringify(['hi', 'en']),
      isEU: false,
      isActive: true,
    },
  });

  console.log(`✓ Created country: ${india.name} (${india.code})`);

  // Create all 28 states and 8 Union Territories
  const statesAndUTs = [
    // States
    { code: '02', name: 'Himachal Pradesh', capital: 'Shimla', type: 'STATE', special: true },
    { code: '03', name: 'Punjab', capital: 'Chandigarh', type: 'STATE' },
    { code: '05', name: 'Uttarakhand', capital: 'Dehradun', type: 'STATE', special: true },
    { code: '06', name: 'Haryana', capital: 'Chandigarh', type: 'STATE' },
    { code: '08', name: 'Rajasthan', capital: 'Jaipur', type: 'STATE' },
    { code: '09', name: 'Uttar Pradesh', capital: 'Lucknow', type: 'STATE' },
    { code: '10', name: 'Bihar', capital: 'Patna', type: 'STATE' },
    { code: '11', name: 'Sikkim', capital: 'Gangtok', type: 'STATE', special: true },
    { code: '12', name: 'Arunachal Pradesh', capital: 'Itanagar', type: 'STATE', special: true },
    { code: '13', name: 'Nagaland', capital: 'Kohima', type: 'STATE', special: true },
    { code: '14', name: 'Manipur', capital: 'Imphal', type: 'STATE', special: true },
    { code: '15', name: 'Mizoram', capital: 'Aizawl', type: 'STATE', special: true },
    { code: '16', name: 'Tripura', capital: 'Agartala', type: 'STATE', special: true },
    { code: '17', name: 'Meghalaya', capital: 'Shillong', type: 'STATE', special: true },
    { code: '18', name: 'Assam', capital: 'Dispur', type: 'STATE', special: true },
    { code: '19', name: 'West Bengal', capital: 'Kolkata', type: 'STATE' },
    { code: '20', name: 'Jharkhand', capital: 'Ranchi', type: 'STATE' },
    { code: '21', name: 'Odisha', capital: 'Bhubaneswar', type: 'STATE' },
    { code: '22', name: 'Chhattisgarh', capital: 'Raipur', type: 'STATE' },
    { code: '23', name: 'Madhya Pradesh', capital: 'Bhopal', type: 'STATE' },
    { code: '24', name: 'Gujarat', capital: 'Gandhinagar', type: 'STATE' },
    { code: '27', name: 'Maharashtra', capital: 'Mumbai', type: 'STATE' },
    { code: '29', name: 'Karnataka', capital: 'Bengaluru', type: 'STATE' },
    { code: '30', name: 'Goa', capital: 'Panaji', type: 'STATE' },
    { code: '32', name: 'Kerala', capital: 'Thiruvananthapuram', type: 'STATE' },
    { code: '33', name: 'Tamil Nadu', capital: 'Chennai', type: 'STATE' },
    { code: '36', name: 'Telangana', capital: 'Hyderabad', type: 'STATE' },
    { code: '37', name: 'Andhra Pradesh', capital: 'Amaravati', type: 'STATE' },

    // Union Territories
    { code: '01', name: 'Jammu and Kashmir', capital: 'Srinagar', type: 'UNION_TERRITORY' },
    { code: '04', name: 'Chandigarh', capital: 'Chandigarh', type: 'UNION_TERRITORY' },
    { code: '07', name: 'Delhi', capital: 'New Delhi', type: 'UNION_TERRITORY' },
    { code: '25', name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman', type: 'UNION_TERRITORY' },
    { code: '31', name: 'Lakshadweep', capital: 'Kavaratti', type: 'UNION_TERRITORY' },
    { code: '34', name: 'Puducherry', capital: 'Puducherry', type: 'UNION_TERRITORY' },
    { code: '35', name: 'Andaman and Nicobar Islands', capital: 'Port Blair', type: 'UNION_TERRITORY' },
    { code: '38', name: 'Ladakh', capital: 'Leh', type: 'UNION_TERRITORY' },
  ];

  for (const state of statesAndUTs) {
    await prisma.region.upsert({
      where: {
        countryId_code: {
          countryId: india.id,
          code: state.code,
        },
      },
      update: {},
      create: {
        countryId: india.id,
        code: state.code,
        name: state.name,
        type: state.type,
        isActive: true,
      },
    });
    console.log(`  ✓ Created ${state.type}: ${state.name} (${state.code})`);
  }

  // Create GST tax rates for each state
  // GST rates: 0%, 5%, 12%, 18%, 28%
  const gstRates = [
    { category: 'ZERO', rate: 0, description: 'Nil-rated supplies' },
    { category: 'FIVE', rate: 5, description: 'Essential goods and services' },
    { category: 'TWELVE', rate: 12, description: 'Standard goods category 1' },
    { category: 'EIGHTEEN', rate: 18, description: 'Standard goods category 2' },
    { category: 'TWENTY_EIGHT', rate: 28, description: 'Luxury goods and services' },
  ];

  for (const state of statesAndUTs) {
    const region = await prisma.region.findFirst({
      where: {
        countryId: india.id,
        code: state.code,
      },
    });

    if (region) {
      for (const gstRate of gstRates) {
        // For intra-state: CGST + SGST (split equally)
        // For inter-state: IGST (full rate)
        const halfRate = gstRate.rate / 2;

        // CGST Component
        await prisma.taxRate.upsert({
          where: {
            countryId_regionId_category: {
              countryId: india.id,
              regionId: region.id,
              category: `${gstRate.category}_CGST`,
            },
          },
          update: {
            rate: halfRate,
          },
          create: {
            countryId: india.id,
            regionId: region.id,
            category: `${gstRate.category}_CGST`,
            rate: halfRate,
            description: `${state.code} CGST ${halfRate}% (${gstRate.description})`,
            validFrom: new Date('2017-07-01'), // GST introduced July 1, 2017
          },
        });

        // SGST/UTGST Component
        const stateComponent = state.type === 'UNION_TERRITORY' ? 'UTGST' : 'SGST';
        await prisma.taxRate.upsert({
          where: {
            countryId_regionId_category: {
              countryId: india.id,
              regionId: region.id,
              category: `${gstRate.category}_${stateComponent}`,
            },
          },
          update: {
            rate: halfRate,
          },
          create: {
            countryId: india.id,
            regionId: region.id,
            category: `${gstRate.category}_${stateComponent}`,
            rate: halfRate,
            description: `${state.code} ${stateComponent} ${halfRate}% (${gstRate.description})`,
            validFrom: new Date('2017-07-01'),
          },
        });

        // IGST Component (for inter-state)
        await prisma.taxRate.upsert({
          where: {
            countryId_regionId_category: {
              countryId: india.id,
              regionId: region.id,
              category: `${gstRate.category}_IGST`,
            },
          },
          update: {
            rate: gstRate.rate,
          },
          create: {
            countryId: india.id,
            regionId: region.id,
            category: `${gstRate.category}_IGST`,
            rate: gstRate.rate,
            description: `${state.code} IGST ${gstRate.rate}% (${gstRate.description})`,
            validFrom: new Date('2017-07-01'),
          },
        });
      }
      console.log(`  ✓ Created GST rates for: ${state.code}`);
    }
  }

  // Create tax configuration
  await prisma.countryTaxConfig.upsert({
    where: { countryId: india.id },
    update: {},
    create: {
      countryId: india.id,
      vatPeriodType: 'MONTHLY',
      corporateTaxPeriodType: 'ANNUAL',
      vatFilingDeadlineDays: 20, // GSTR-3B due on 20th
      vatPaymentDeadlineDays: 20,
      corporateTaxFilingDays: 365,
      corporateTaxPaymentDays: 365,
      invoiceNumberingType: 'SEQUENTIAL',
      requiresDigitalSignature: true,
      requiresQrCode: true,
      requiresEInvoicing: true,
      eInvoicingMandateDate: new Date('2020-10-01'),
      eInvoicingThreshold: 1_000_000, // ₹10 lakhs
      eInvoicingFormat: 'JSON',
      eInvoicingNetwork: 'IRP',
      viesValidationRequired: false,
      fiscalRepresentativeRequired: false,
      requiresSaftT: false,
      notes: 'GST system with CGST+SGST for intra-state and IGST for inter-state. E-invoicing mandatory above ₹10 lakhs turnover.',
      legalBasis: 'Central Goods and Services Tax Act, 2017',
    },
  });

  console.log('✓ Created India GST tax configuration');

  // Create country features
  const features = [
    {
      feature: 'tax_filing',
      enabled: true,
      config: {
        system: 'GST',
        forms: ['GSTR-1', 'GSTR-3B', 'GSTR-4', 'GSTR-9', 'GSTR-9C'],
        portal: 'https://www.gst.gov.in',
        registrationThreshold: {
          goods: 4_000_000,
          services: 2_000_000,
          specialStates: 2_000_000,
        },
      },
    },
    {
      feature: 'vat_validation',
      enabled: true,
      config: {
        format: 'GSTIN',
        length: 15,
        pattern: '99AAAAA9999A9Z9',
      },
    },
    {
      feature: 'e_invoicing',
      enabled: true,
      config: {
        mandatory: true,
        threshold: 1_000_000,
        irpProviders: ['NIC', 'NSDL', 'Cleartax', 'Iris'],
        qrCodeRequired: true,
        irnGeneration: true,
      },
    },
    {
      feature: 'e_way_bill',
      enabled: true,
      config: {
        threshold: 50_000,
        mandatory: true,
        portal: 'https://ewaybillgst.gov.in',
      },
    },
    {
      feature: 'hsn_sac_codes',
      enabled: true,
      config: {
        hsnMandatory: {
          above50L: 4,
          above5Cr: 6,
        },
        sacMandatory: {
          above50L: 4,
          above5Cr: 6,
        },
      },
    },
    {
      feature: 'composition_scheme',
      enabled: true,
      config: {
        threshold: 15_000_000,
        rates: {
          manufacturers: 1,
          restaurants: 5,
          traders: 1,
          services: 6,
        },
        restrictions: [
          'No inter-state supplies',
          'No input tax credit',
          'Quarterly filing',
        ],
      },
    },
    {
      feature: 'reverse_charge',
      enabled: true,
      config: {
        applicableOn: [
          'Services from unregistered supplier',
          'Import of services',
          'GTA services',
          'Advocate services',
        ],
      },
    },
    {
      feature: 'tds_tcs',
      enabled: true,
      config: {
        tdsRate: 2,
        tcsRate: 1,
        tdsThreshold: 250_000,
        tcsThreshold: 500_000,
      },
    },
  ];

  for (const feat of features) {
    await prisma.countryFeature.upsert({
      where: {
        countryId_feature: {
          countryId: india.id,
          feature: feat.feature,
        },
      },
      update: {},
      create: {
        countryId: india.id,
        feature: feat.feature,
        enabled: feat.enabled,
        config: feat.config,
      },
    });
    console.log(`  ✓ Created feature: ${feat.feature}`);
  }

  // Create common HSN codes with GST rates
  const commonHSNCodes = [
    // Food items - 5%
    { hsn: '0401', description: 'Milk and cream', rate: 5, category: 'FIVE' },
    { hsn: '0402', description: 'Milk powder', rate: 5, category: 'FIVE' },
    { hsn: '1701', description: 'Cane or beet sugar', rate: 5, category: 'FIVE' },
    { hsn: '0901', description: 'Coffee', rate: 5, category: 'FIVE' },
    { hsn: '0902', description: 'Tea', rate: 5, category: 'FIVE' },
    { hsn: '1507', description: 'Edible oils', rate: 5, category: 'FIVE' },

    // Processed foods - 12%
    { hsn: '0405', description: 'Butter and dairy spreads', rate: 12, category: 'TWELVE' },
    { hsn: '1905', description: 'Bread, biscuits, cakes', rate: 12, category: 'TWELVE' },
    { hsn: '2009', description: 'Fruit juices', rate: 12, category: 'TWELVE' },

    // Electronics - 18%
    { hsn: '8471', description: 'Computers and peripherals', rate: 18, category: 'EIGHTEEN' },
    { hsn: '8517', description: 'Mobile phones', rate: 18, category: 'EIGHTEEN' },
    { hsn: '8528', description: 'Television sets', rate: 18, category: 'EIGHTEEN' },
    { hsn: '8443', description: 'Printers', rate: 18, category: 'EIGHTEEN' },

    // Luxury items - 28%
    { hsn: '8703', description: 'Motor cars', rate: 28, category: 'TWENTY_EIGHT' },
    { hsn: '8711', description: 'Motorcycles', rate: 28, category: 'TWENTY_EIGHT' },
    { hsn: '8415', description: 'Air conditioners', rate: 28, category: 'TWENTY_EIGHT' },
    { hsn: '8418', description: 'Refrigerators', rate: 28, category: 'TWENTY_EIGHT' },
    { hsn: '2402', description: 'Cigarettes containing tobacco', rate: 28, category: 'TWENTY_EIGHT' },
    { hsn: '2202', description: 'Aerated beverages', rate: 28, category: 'TWENTY_EIGHT' },

    // Textiles - varies
    { hsn: '6203', description: 'Men\'s suits, jackets', rate: 12, category: 'TWELVE' },
    { hsn: '6204', description: 'Women\'s suits, jackets', rate: 12, category: 'TWELVE' },
    { hsn: '6402', description: 'Footwear', rate: 5, category: 'FIVE' },

    // Medicines - 5% or 12%
    { hsn: '3003', description: 'Medicaments (not packaged)', rate: 12, category: 'TWELVE' },
    { hsn: '3004', description: 'Medicaments (packaged)', rate: 12, category: 'TWELVE' },

    // Books and educational - 0%
    { hsn: '4901', description: 'Printed books', rate: 0, category: 'ZERO' },
    { hsn: '4902', description: 'Newspapers', rate: 0, category: 'ZERO' },
  ];

  console.log('\n✓ HSN Code Reference (Common items):');
  for (const hsn of commonHSNCodes) {
    console.log(`  HSN ${hsn.hsn}: ${hsn.description} - ${hsn.rate}% GST`);
  }

  // Create SAC codes reference for services
  const commonSACCodes = [
    { sac: '995411', description: 'IT software services', rate: 18 },
    { sac: '996511', description: 'Professional services', rate: 18 },
    { sac: '996331', description: 'Legal services', rate: 18 },
    { sac: '996411', description: 'Accounting services', rate: 18 },
    { sac: '996601', description: 'Banking services', rate: 18 },
    { sac: '996711', description: 'Insurance services', rate: 18 },
    { sac: '997212', description: 'Restaurant services (AC)', rate: 18 },
    { sac: '997213', description: 'Restaurant services (non-AC)', rate: 5 },
    { sac: '996411', description: 'Consulting services', rate: 18 },
    { sac: '998511', description: 'Telecommunication services', rate: 18 },
  ];

  console.log('\n✓ SAC Code Reference (Common services):');
  for (const sac of commonSACCodes) {
    console.log(`  SAC ${sac.sac}: ${sac.description} - ${sac.rate}% GST`);
  }

  console.log('\n✓ India GST configuration seeded successfully!');
  console.log(`  Total States: 28`);
  console.log(`  Total Union Territories: 8`);
  console.log(`  GST Slabs: 0%, 5%, 12%, 18%, 28%`);
  console.log(`  Components: CGST, SGST/UTGST, IGST`);
  console.log(`  E-invoicing: Mandatory (₹10 lakhs+)`);
  console.log(`  E-way bill: Mandatory (₹50,000+)\n`);
}

// Run if executed directly
if (require.main === module) {
  seedIndiaTaxConfig()
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
