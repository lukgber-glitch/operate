import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Subscription Tier Seed Data
 * Defines the four main subscription tiers with their limits and pricing
 */
export async function seedSubscriptionTiers() {
  console.log('Seeding subscription tiers...');

  const tiers = [
    {
      name: 'free',
      displayName: 'Free Plan',
      description: 'Perfect for trying out Operate',
      priceMonthly: 0,
      priceAnnual: 0,
      limits: {
        AI_MESSAGES: 50,
        BANK_CONNECTIONS: 1,
        INVOICES: 5,
        EMAIL_SYNCS: 10,
        TAX_FILINGS: 1,
      },
      features: [
        'basic_invoicing',
        'basic_expense_tracking',
        'ai_chat_assistant',
        'single_bank_connection',
      ],
      isActive: true,
      isVisible: true,
    },
    {
      name: 'starter',
      displayName: 'Starter Plan',
      description: 'For small businesses getting started',
      priceMonthly: 2900, // $29.00 in cents
      priceAnnual: 29000, // $290.00 in cents (2 months free)
      limits: {
        AI_MESSAGES: 500,
        BANK_CONNECTIONS: 3,
        INVOICES: 50,
        EMAIL_SYNCS: 100,
        TAX_FILINGS: 5,
      },
      features: [
        'basic_invoicing',
        'advanced_expense_tracking',
        'ai_chat_assistant',
        'multi_bank_connections',
        'email_integration',
        'basic_tax_filing',
        'receipt_scanning',
      ],
      isActive: true,
      isVisible: true,
    },
    {
      name: 'pro',
      displayName: 'Pro Plan',
      description: 'For growing businesses with higher volume',
      priceMonthly: 7900, // $79.00 in cents
      priceAnnual: 79000, // $790.00 in cents (2 months free)
      limits: {
        AI_MESSAGES: -1, // Unlimited
        BANK_CONNECTIONS: 10,
        INVOICES: -1, // Unlimited
        EMAIL_SYNCS: -1, // Unlimited
        TAX_FILINGS: -1, // Unlimited
      },
      features: [
        'basic_invoicing',
        'advanced_expense_tracking',
        'ai_chat_assistant',
        'unlimited_ai_messages',
        'multi_bank_connections',
        'email_integration',
        'advanced_tax_filing',
        'receipt_scanning',
        'cash_flow_forecasting',
        'vendor_management',
        'bill_payments',
        'automated_reconciliation',
      ],
      isActive: true,
      isVisible: true,
    },
    {
      name: 'business',
      displayName: 'Business Plan',
      description: 'For established businesses with complex needs',
      priceMonthly: 14900, // $149.00 in cents
      priceAnnual: 149000, // $1,490.00 in cents (2 months free)
      limits: {
        AI_MESSAGES: -1, // Unlimited
        BANK_CONNECTIONS: -1, // Unlimited
        INVOICES: -1, // Unlimited
        EMAIL_SYNCS: -1, // Unlimited
        TAX_FILINGS: -1, // Unlimited
      },
      features: [
        'basic_invoicing',
        'advanced_expense_tracking',
        'ai_chat_assistant',
        'unlimited_ai_messages',
        'unlimited_bank_connections',
        'email_integration',
        'advanced_tax_filing',
        'receipt_scanning',
        'cash_flow_forecasting',
        'vendor_management',
        'bill_payments',
        'automated_reconciliation',
        'multi_currency',
        'multi_entity',
        'advanced_reporting',
        'api_access',
        'priority_support',
        'dedicated_account_manager',
      ],
      isActive: true,
      isVisible: true,
    },
  ];

  for (const tier of tiers) {
    await prisma.subscriptionTier.upsert({
      where: { name: tier.name },
      create: tier,
      update: tier,
    });

    console.log(`✓ Seeded tier: ${tier.displayName}`);
  }

  console.log('Subscription tiers seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedSubscriptionTiers()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
