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
      displayName: 'Free',
      description: 'Perfect for trying out Operate',
      priceMonthly: 0,
      priceAnnual: 0,
      limits: {
        AI_MESSAGES: 50,
        BANK_CONNECTIONS: 1,
        INVOICES: 5,
        EMAIL_SYNCS: 0,
        TAX_FILINGS: 0,
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
      displayName: 'Starter',
      description: 'For freelancers and solo entrepreneurs',
      priceMonthly: 990, // €9.90 in cents
      priceAnnual: 9500, // €95.00 in cents
      limits: {
        AI_MESSAGES: 200,
        BANK_CONNECTIONS: 3,
        INVOICES: -1, // Unlimited
        EMAIL_SYNCS: 100,
        TAX_FILINGS: 0,
      },
      features: [
        'basic_invoicing',
        'basic_expense_tracking',
        'ai_chat_assistant',
        'multi_bank_connections',
        'email_integration',
        'basic_reports',
        'datev_export',
        'receipt_scanning',
      ],
      isActive: true,
      isVisible: true,
    },
    {
      name: 'pro',
      displayName: 'Pro',
      description: 'For small businesses',
      priceMonthly: 1990, // €19.90 in cents
      priceAnnual: 19000, // €190.00 in cents
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
        'basic_reports',
        'advanced_reports',
        'datev_export',
        'tax_filing',
        'cash_flow_forecasting',
        'document_ocr',
        'receipt_scanning',
        'team_collaboration',
      ],
      isActive: true,
      isVisible: true,
    },
    {
      name: 'business',
      displayName: 'Business',
      description: 'For growing teams',
      priceMonthly: 3990, // €39.90 in cents
      priceAnnual: 38000, // €380.00 in cents
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
        'basic_reports',
        'advanced_reports',
        'datev_export',
        'tax_filing',
        'cash_flow_forecasting',
        'document_ocr',
        'receipt_scanning',
        'team_collaboration',
        'unlimited_team_members',
        'api_access',
        'multi_currency',
        'custom_integrations',
        'priority_support',
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
