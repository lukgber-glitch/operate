import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StripeService } from '../stripe.service';
import {
  CreateProductDto,
  CreatePriceDto,
  SubscriptionTier,
  BillingInterval,
} from '../dto/subscription.dto';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';

/**
 * Stripe Products Service
 * Manages Stripe products and pricing configurations
 *
 * Features:
 * - Create and manage products
 * - Create pricing tiers (Free, Pro, Enterprise)
 * - Support for flat-rate and per-seat pricing
 * - Multiple billing intervals (monthly/yearly)
 * - Multi-currency support
 * - Product metadata and features
 * - Sync products with Stripe
 */
@Injectable()
export class StripeProductsService {
  private readonly logger = new Logger(StripeProductsService.name);
  private readonly stripe: Stripe;

  // Caching for pricing table - reduces Stripe API calls
  private pricingTableCache: { data: any[]; expiresAt: number } | null = null;
  private readonly PRICING_TABLE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // Request deduplication
  private pendingPricingTableRequest: Promise<any[]> | null = null;

  // Predefined pricing tiers configuration - EUR pricing for DACH market
  private readonly DEFAULT_TIERS = {
    [SubscriptionTier.FREE]: {
      name: 'Kostenlos',
      description: 'Perfekt zum Ausprobieren',
      features: [
        '50 KI-Nachrichten/Monat',
        '1 Bankverbindung',
        '5 Rechnungen/Monat',
        'Grundlegende Ausgabenverfolgung',
        '14 Tage Pro-Testversion',
      ],
      price: {
        monthly: 0,
        yearly: 0,
      },
      limits: {
        aiMessages: 50,
        bankConnections: 1,
        invoices: 5,
        teamMembers: 1,
      },
    },
    [SubscriptionTier.STARTER]: {
      name: 'Starter',
      description: 'Ideal für Solo-Freelancer',
      features: [
        '200 KI-Nachrichten/Monat',
        '3 Bankverbindungen',
        'Unbegrenzte Rechnungen',
        'E-Mail-Rechnungssync',
        'Grundlegende Berichte',
        'DATEV-Export',
        'E-Mail-Support',
      ],
      price: {
        monthly: 990, // €9.90
        yearly: 9500, // €95.00 (~20% Ersparnis)
      },
      limits: {
        aiMessages: 200,
        bankConnections: 3,
        invoices: -1, // unlimited
        teamMembers: 1,
      },
    },
    [SubscriptionTier.PRO]: {
      name: 'Pro',
      description: 'Für wachsende Unternehmen',
      features: [
        'Unbegrenzte KI-Nachrichten',
        '10 Bankverbindungen',
        'Steuereinreichung (UStVA, EÜR)',
        'Cashflow-Prognosen',
        'Dokument-OCR-Scanning',
        'Erweiterte Berichte (BWA)',
        'Bis zu 3 Teammitglieder',
        'Prioritäts-Support',
      ],
      price: {
        monthly: 1990, // €19.90
        yearly: 19000, // €190.00 (~20% Ersparnis)
      },
      limits: {
        aiMessages: -1, // unlimited
        bankConnections: 10,
        invoices: -1,
        teamMembers: 3,
      },
    },
    [SubscriptionTier.BUSINESS]: {
      name: 'Business',
      description: 'Für wachsende Teams',
      features: [
        'Unbegrenzte KI-Nachrichten',
        'Unbegrenzte Bankverbindungen',
        'Alle Pro-Funktionen',
        'Unbegrenzte Teammitglieder',
        'API-Zugang',
        'Benutzerdefinierte Integrationen',
        'Multi-Währung',
        'Dedizierter Support',
        'Eigenes Branding',
      ],
      price: {
        monthly: 3990, // €39.90
        yearly: 38000, // €380.00 (~20% Ersparnis)
      },
      limits: {
        aiMessages: -1,
        bankConnections: -1,
        invoices: -1,
        teamMembers: -1,
      },
    },
  };

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = this.stripeService.getClient();
  }

  /**
   * Create a new product
   */
  async createProduct(dto: CreateProductDto): Promise<Stripe.Product> {
    const startTime = Date.now();
    const idempotencyKey = `create-product-${dto.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${randomBytes(8).toString('hex')}`;

    try {
      this.logger.log(`Creating product: ${dto.name}`);

      const productParams: Stripe.ProductCreateParams = {
        name: dto.name,
        description: dto.description,
        metadata: {
          tier: dto.tier || '',
          features: dto.features ? JSON.stringify(dto.features) : '',
          ...dto.metadata,
        },
      };

      const product = await this.stripe.products.create(productParams, {
        idempotencyKey,
      });

      this.logger.log(`Product created: ${product.id}`);

      return product;
    } catch (error) {
      this.logger.error('Failed to create product', error);
      throw this.stripeService.handleStripeError(error, 'createProduct');
    }
  }

  /**
   * Create a new price for a product
   */
  async createPrice(dto: CreatePriceDto): Promise<Stripe.Price> {
    const startTime = Date.now();
    const idempotencyKey = `create-price-${dto.productId}-${dto.interval}-${Date.now()}-${randomBytes(8).toString('hex')}`;

    try {
      this.logger.log(
        `Creating price for product ${dto.productId}: ${dto.unitAmount / 100} ${dto.currency}/${dto.interval}`,
      );

      const priceParams: Stripe.PriceCreateParams = {
        product: dto.productId,
        unit_amount: dto.unitAmount,
        currency: dto.currency.toLowerCase(),
        recurring: {
          interval: dto.interval,
          interval_count: dto.intervalCount || 1,
        },
        metadata: dto.metadata,
        nickname: dto.nickname,
      };

      const price = await this.stripe.prices.create(priceParams, {
        idempotencyKey,
      });

      this.logger.log(`Price created: ${price.id}`);

      return price;
    } catch (error) {
      this.logger.error('Failed to create price', error);
      throw this.stripeService.handleStripeError(error, 'createPrice');
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<Stripe.Product> {
    try {
      return await this.stripe.products.retrieve(productId);
    } catch (error) {
      this.logger.error('Failed to retrieve product', error);
      throw this.stripeService.handleStripeError(error, 'getProduct');
    }
  }

  /**
   * List all products
   */
  async listProducts(limit: number = 100): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.list({
        limit,
        active: true,
      });

      return products.data;
    } catch (error) {
      this.logger.error('Failed to list products', error);
      throw this.stripeService.handleStripeError(error, 'listProducts');
    }
  }

  /**
   * Get price by ID
   */
  async getPrice(priceId: string): Promise<Stripe.Price> {
    try {
      return await this.stripe.prices.retrieve(priceId);
    } catch (error) {
      this.logger.error('Failed to retrieve price', error);
      throw this.stripeService.handleStripeError(error, 'getPrice');
    }
  }

  /**
   * List all prices for a product
   */
  async listPricesForProduct(
    productId: string,
    limit: number = 100,
  ): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        limit,
        active: true,
      });

      return prices.data;
    } catch (error) {
      this.logger.error('Failed to list prices for product', error);
      throw this.stripeService.handleStripeError(error, 'listPricesForProduct');
    }
  }

  /**
   * Update a product
   */
  async updateProduct(
    productId: string,
    updates: Partial<CreateProductDto>,
  ): Promise<Stripe.Product> {
    try {
      this.logger.log(`Updating product ${productId}`);

      const updateParams: Stripe.ProductUpdateParams = {};

      if (updates.name) updateParams.name = updates.name;
      if (updates.description) updateParams.description = updates.description;
      if (updates.metadata) updateParams.metadata = updates.metadata;

      const product = await this.stripe.products.update(
        productId,
        updateParams,
      );

      this.logger.log(`Product updated: ${product.id}`);

      return product;
    } catch (error) {
      this.logger.error('Failed to update product', error);
      throw this.stripeService.handleStripeError(error, 'updateProduct');
    }
  }

  /**
   * Archive a product (set active = false)
   */
  async archiveProduct(productId: string): Promise<Stripe.Product> {
    try {
      this.logger.log(`Archiving product ${productId}`);

      const product = await this.stripe.products.update(productId, {
        active: false,
      });

      this.logger.log(`Product archived: ${product.id}`);

      return product;
    } catch (error) {
      this.logger.error('Failed to archive product', error);
      throw this.stripeService.handleStripeError(error, 'archiveProduct');
    }
  }

  /**
   * Archive a price (set active = false)
   */
  async archivePrice(priceId: string): Promise<Stripe.Price> {
    try {
      this.logger.log(`Archiving price ${priceId}`);

      const price = await this.stripe.prices.update(priceId, {
        active: false,
      });

      this.logger.log(`Price archived: ${price.id}`);

      return price;
    } catch (error) {
      this.logger.error('Failed to archive price', error);
      throw this.stripeService.handleStripeError(error, 'archivePrice');
    }
  }

  /**
   * Initialize default pricing tiers
   * Creates Free, Starter, Pro, and Business products with monthly/yearly pricing
   * Default currency is EUR for DACH market
   */
  async initializeDefaultPricingTiers(
    currency: string = 'eur',
  ): Promise<{
    products: Record<SubscriptionTier, Stripe.Product>;
    prices: Record<SubscriptionTier, { monthly: Stripe.Price; yearly: Stripe.Price }>;
  }> {
    try {
      this.logger.log('Initializing default pricing tiers');

      const products: Record<SubscriptionTier, Stripe.Product> = {} as Prisma.InputJsonValue;
      const prices: Record<SubscriptionTier, { monthly: Stripe.Price; yearly: Stripe.Price }> = {} as Prisma.InputJsonValue;

      for (const [tier, config] of Object.entries(this.DEFAULT_TIERS)) {
        // Create product
        const product = await this.createProduct({
          name: config.name,
          description: config.description,
          tier: tier as SubscriptionTier,
          features: config.features,
          metadata: {
            tier,
          },
        });

        products[tier as SubscriptionTier] = product;

        // Create monthly price
        if (config.price.monthly > 0) {
          const monthlyPrice = await this.createPrice({
            productId: product.id,
            unitAmount: config.price.monthly,
            currency,
            interval: BillingInterval.MONTH,
            nickname: `${config.name} - Monthly`,
          });
          prices[tier as SubscriptionTier] = { monthly: monthlyPrice } as Prisma.InputJsonValue;
        }

        // Create yearly price
        if (config.price.yearly > 0) {
          const yearlyPrice = await this.createPrice({
            productId: product.id,
            unitAmount: config.price.yearly,
            currency,
            interval: BillingInterval.YEAR,
            nickname: `${config.name} - Yearly`,
          });
          prices[tier as SubscriptionTier] = {
            ...prices[tier as SubscriptionTier],
            yearly: yearlyPrice,
          };
        }

        this.logger.log(`Initialized ${tier} tier: Product ${product.id}`);
      }

      this.logger.log('Default pricing tiers initialized successfully');

      return { products, prices };
    } catch (error) {
      this.logger.error('Failed to initialize default pricing tiers', error);
      throw error;
    }
  }

  /**
   * Sync products from Stripe to local database
   * Useful for keeping product catalog in sync
   */
  async syncProductsFromStripe(): Promise<void> {
    try {
      this.logger.log('Syncing products from Stripe');

      const products = await this.listProducts();

      for (const product of products) {
        await this.prisma.$executeRaw`
          INSERT INTO stripe_products
          (stripe_product_id, name, description, active, metadata, created_at, updated_at)
          VALUES
          (${product.id}, ${product.name}, ${product.description || ''}, ${product.active}, ${JSON.stringify(product.metadata)}::jsonb, to_timestamp(${product.created}), NOW())
          ON CONFLICT (stripe_product_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            active = EXCLUDED.active,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `;

        // Sync prices for this product
        const prices = await this.listPricesForProduct(product.id);

        for (const price of prices) {
          await this.prisma.$executeRaw`
            INSERT INTO stripe_prices
            (stripe_price_id, product_id, unit_amount, currency, billing_interval, interval_count, active, metadata, created_at, updated_at)
            SELECT
              ${price.id},
              id,
              ${price.unit_amount || 0},
              ${price.currency},
              ${price.recurring?.interval || 'month'},
              ${price.recurring?.interval_count || 1},
              ${price.active},
              ${JSON.stringify(price.metadata)}::jsonb,
              to_timestamp(${price.created}),
              NOW()
            FROM stripe_products
            WHERE stripe_product_id = ${product.id}
            ON CONFLICT (stripe_price_id)
            DO UPDATE SET
              unit_amount = EXCLUDED.unit_amount,
              currency = EXCLUDED.currency,
              billing_interval = EXCLUDED.billing_interval,
              interval_count = EXCLUDED.interval_count,
              active = EXCLUDED.active,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          `;
        }
      }

      this.logger.log(`Synced ${products.length} products from Stripe`);
    } catch (error) {
      this.logger.error('Failed to sync products from Stripe', error);
      throw error;
    }
  }

  /**
   * Get pricing table data for frontend display
   * Default currency is EUR for DACH market
   *
   * Performance optimizations:
   * - Cached for 15 minutes (pricing rarely changes)
   * - Request deduplication (concurrent calls share one request)
   * - Batched price fetching with Promise.all
   */
  async getPricingTable(currency: string = 'eur'): Promise<any[]> {
    // Check cache first
    if (
      this.pricingTableCache &&
      Date.now() < this.pricingTableCache.expiresAt
    ) {
      this.logger.debug('Returning cached pricing table');
      return this.pricingTableCache.data;
    }

    // Request deduplication - if a request is already in flight, wait for it
    if (this.pendingPricingTableRequest) {
      this.logger.debug('Deduplicating pricing table request');
      return this.pendingPricingTableRequest;
    }

    // Execute the request
    this.pendingPricingTableRequest = this.fetchPricingTable(currency)
      .finally(() => {
        this.pendingPricingTableRequest = null;
      });

    return this.pendingPricingTableRequest;
  }

  /**
   * Internal method to fetch pricing table from Stripe
   */
  private async fetchPricingTable(currency: string): Promise<any[]> {
    try {
      const products = await this.listProducts();

      // Batch fetch all prices in parallel for efficiency
      const allPricesPromises = products.map(product =>
        this.listPricesForProduct(product.id),
      );
      const allPrices = await Promise.all(allPricesPromises);

      const pricingTable = products.map((product, index) => {
        const prices = allPrices[index];

        const monthlyPrice = prices.find(
          (p) => p.recurring?.interval === 'month' && p.currency === currency,
        );
        const yearlyPrice = prices.find(
          (p) => p.recurring?.interval === 'year' && p.currency === currency,
        );

        const features = product.metadata.features
          ? JSON.parse(product.metadata.features)
          : [];

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          tier: product.metadata.tier,
          features,
          pricing: {
            monthly: monthlyPrice
              ? {
                  id: monthlyPrice.id,
                  amount: monthlyPrice.unit_amount,
                  currency: monthlyPrice.currency,
                  formattedAmount: this.formatCurrency(
                    monthlyPrice.unit_amount || 0,
                    monthlyPrice.currency,
                  ),
                }
              : null,
            yearly: yearlyPrice
              ? {
                  id: yearlyPrice.id,
                  amount: yearlyPrice.unit_amount,
                  currency: yearlyPrice.currency,
                  formattedAmount: this.formatCurrency(
                    yearlyPrice.unit_amount || 0,
                    yearlyPrice.currency,
                  ),
                }
              : null,
          },
        };
      });

      // Cache the result
      this.pricingTableCache = {
        data: pricingTable,
        expiresAt: Date.now() + this.PRICING_TABLE_CACHE_TTL,
      };

      this.logger.log(`Fetched and cached pricing table (${pricingTable.length} products)`);
      return pricingTable;
    } catch (error) {
      this.logger.error('Failed to get pricing table', error);
      throw error;
    }
  }

  /**
   * Invalidate pricing table cache
   * Call this after updating products or prices
   */
  invalidatePricingTableCache(): void {
    this.pricingTableCache = null;
    this.logger.debug('Invalidated pricing table cache');
  }

  // Helper Methods

  private formatCurrency(amount: number, currency: string): string {
    const value = amount / 100;
    // Use German locale for EUR, English for others
    const locale = currency.toLowerCase() === 'eur' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  }
}
