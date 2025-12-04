/**
 * Combined Middle East Tax Configuration Seed
 * Task: W28-T4 - Middle East tax rules (VAT 5%/15%)
 *
 * Seeds both UAE and Saudi Arabia tax configurations
 */

import { seedUAETaxConfig } from './ae-tax-seed';
import { seedSaudiArabiaTaxConfig } from './sa-tax-seed';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMiddleEastTaxConfig() {
  console.log('============================================================');
  console.log('MIDDLE EAST TAX CONFIGURATION SEED');
  console.log('============================================================\n');

  try {
    // Seed UAE
    await seedUAETaxConfig();

    // Seed Saudi Arabia
    await seedSaudiArabiaTaxConfig();

    console.log('============================================================');
    console.log('✓ Middle East tax configuration seeded successfully!');
    console.log('============================================================');
    console.log('\nCountries configured:');
    console.log('  - United Arab Emirates (AE)');
    console.log('    - 7 Emirates');
    console.log('    - 11 Free Zones');
    console.log('    - VAT: 5%');
    console.log('    - Corporate Tax: 9%');
    console.log('  - Saudi Arabia (SA)');
    console.log('    - 13 Administrative Regions');
    console.log('    - 3 Special Economic Zones');
    console.log('    - VAT: 15%');
    console.log('    - Zakat: 2.5%');
    console.log('\nFeatures:');
    console.log('  ✓ VAT rates and exemptions');
    console.log('  ✓ Regional subdivisions');
    console.log('  ✓ Free zones and special zones');
    console.log('  ✓ Tax authorities');
    console.log('  ✓ Employment types');
    console.log('  ✓ Country features');
    console.log('  ✓ E-invoicing configuration');
    console.log('============================================================\n');
  } catch (error) {
    console.error('Error seeding Middle East tax configuration:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedMiddleEastTaxConfig()
    .then(() => {
      console.log('Seed completed successfully');
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
