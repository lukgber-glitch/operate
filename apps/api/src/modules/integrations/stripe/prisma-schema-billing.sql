-- Stripe Billing Schema Extensions
-- Add this to your existing Stripe schema or run as a migration

-- Stripe Products Table
-- Stores Stripe product catalog
CREATE TABLE IF NOT EXISTS stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT uk_stripe_product_id UNIQUE (stripe_product_id)
);

-- Indexes for Stripe Products
CREATE INDEX IF NOT EXISTS idx_stripe_products_product_id ON stripe_products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_products_active ON stripe_products(active);
CREATE INDEX IF NOT EXISTS idx_stripe_products_created_at ON stripe_products(created_at DESC);

-- Stripe Prices Table
-- Stores pricing information for products
CREATE TABLE IF NOT EXISTS stripe_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id VARCHAR(255) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES stripe_products(id) ON DELETE CASCADE,
  unit_amount INTEGER NOT NULL, -- Amount in smallest currency unit (cents)
  currency VARCHAR(3) NOT NULL,
  billing_interval VARCHAR(20) NOT NULL, -- 'month' or 'year'
  interval_count INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_stripe_price_product FOREIGN KEY (product_id) REFERENCES stripe_products(id) ON DELETE CASCADE,
  CONSTRAINT uk_stripe_price_id UNIQUE (stripe_price_id)
);

-- Indexes for Stripe Prices
CREATE INDEX IF NOT EXISTS idx_stripe_prices_price_id ON stripe_prices(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_product_id ON stripe_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_active ON stripe_prices(active);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_interval ON stripe_prices(billing_interval);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_created_at ON stripe_prices(created_at DESC);

-- Stripe Subscriptions Table
-- Stores subscription records
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, UNPAID, CANCELED, INCOMPLETE, INCOMPLETE_EXPIRED, TRIALING, PAUSED
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_stripe_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_stripe_subscription_id UNIQUE (stripe_subscription_id)
);

-- Indexes for Stripe Subscriptions
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_subscription_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_period_end ON stripe_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_trial_end ON stripe_subscriptions(trial_end);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_deleted_at ON stripe_subscriptions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_created_at ON stripe_subscriptions(created_at DESC);

-- Stripe Subscription Items Table
-- Stores individual line items within a subscription
CREATE TABLE IF NOT EXISTS stripe_subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_item_id VARCHAR(255) NOT NULL UNIQUE,
  subscription_id UUID NOT NULL REFERENCES stripe_subscriptions(id) ON DELETE CASCADE,
  stripe_price_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_stripe_subscription_item_subscription FOREIGN KEY (subscription_id) REFERENCES stripe_subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT uk_stripe_subscription_item_id UNIQUE (stripe_subscription_item_id)
);

-- Indexes for Stripe Subscription Items
CREATE INDEX IF NOT EXISTS idx_stripe_subscription_items_item_id ON stripe_subscription_items(stripe_subscription_item_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscription_items_subscription_id ON stripe_subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscription_items_price_id ON stripe_subscription_items(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscription_items_created_at ON stripe_subscription_items(created_at DESC);

-- Stripe Billing History Table
-- Stores invoice and payment history
CREATE TABLE IF NOT EXISTS stripe_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  invoice_number VARCHAR(100),
  amount INTEGER NOT NULL, -- Amount in smallest currency unit (cents)
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL, -- draft, open, paid, void, uncollectible
  invoice_url TEXT,
  invoice_pdf TEXT,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  paid_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_stripe_billing_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_stripe_invoice_id UNIQUE (stripe_invoice_id)
);

-- Indexes for Stripe Billing History
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_user_id ON stripe_billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_invoice_id ON stripe_billing_history(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_customer_id ON stripe_billing_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_subscription_id ON stripe_billing_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_status ON stripe_billing_history(status);
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_paid_at ON stripe_billing_history(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_billing_history_created_at ON stripe_billing_history(created_at DESC);

-- Stripe Customers Table (if not already exists)
-- Stores Stripe customer information
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  default_payment_method VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_stripe_customer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_stripe_customer_id UNIQUE (stripe_customer_id),
  CONSTRAINT uk_stripe_customer_user_id UNIQUE (user_id)
);

-- Indexes for Stripe Customers
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON stripe_customers(email);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_created_at ON stripe_customers(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE stripe_products IS 'Stores Stripe product catalog for subscription offerings';
COMMENT ON TABLE stripe_prices IS 'Stores pricing information for Stripe products (monthly/yearly tiers)';
COMMENT ON TABLE stripe_subscriptions IS 'Stores customer subscription records';
COMMENT ON TABLE stripe_subscription_items IS 'Stores individual line items within subscriptions';
COMMENT ON TABLE stripe_billing_history IS 'Stores invoice and payment history for billing';
COMMENT ON TABLE stripe_customers IS 'Stores Stripe customer information';

COMMENT ON COLUMN stripe_products.stripe_product_id IS 'Stripe product ID (prod_xxx)';
COMMENT ON COLUMN stripe_products.active IS 'Whether the product is currently available for purchase';

COMMENT ON COLUMN stripe_prices.stripe_price_id IS 'Stripe price ID (price_xxx)';
COMMENT ON COLUMN stripe_prices.unit_amount IS 'Amount in smallest currency unit (e.g., cents for USD)';
COMMENT ON COLUMN stripe_prices.billing_interval IS 'Billing interval: month or year';
COMMENT ON COLUMN stripe_prices.interval_count IS 'Number of intervals between billings (e.g., 3 for quarterly)';

COMMENT ON COLUMN stripe_subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN stripe_subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN stripe_subscriptions.status IS 'Subscription status: ACTIVE, PAST_DUE, UNPAID, CANCELED, etc.';
COMMENT ON COLUMN stripe_subscriptions.current_period_start IS 'Current billing period start timestamp';
COMMENT ON COLUMN stripe_subscriptions.current_period_end IS 'Current billing period end timestamp';
COMMENT ON COLUMN stripe_subscriptions.trial_start IS 'Trial period start timestamp (if applicable)';
COMMENT ON COLUMN stripe_subscriptions.trial_end IS 'Trial period end timestamp (if applicable)';
COMMENT ON COLUMN stripe_subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';
COMMENT ON COLUMN stripe_subscriptions.canceled_at IS 'Timestamp when subscription was canceled';

COMMENT ON COLUMN stripe_subscription_items.stripe_subscription_item_id IS 'Stripe subscription item ID (si_xxx)';
COMMENT ON COLUMN stripe_subscription_items.stripe_price_id IS 'Reference to Stripe price ID';
COMMENT ON COLUMN stripe_subscription_items.quantity IS 'Quantity of the subscription item (for per-seat pricing)';

COMMENT ON COLUMN stripe_billing_history.stripe_invoice_id IS 'Stripe invoice ID (in_xxx)';
COMMENT ON COLUMN stripe_billing_history.invoice_number IS 'Human-readable invoice number';
COMMENT ON COLUMN stripe_billing_history.amount IS 'Invoice amount in smallest currency unit';
COMMENT ON COLUMN stripe_billing_history.status IS 'Invoice status: draft, open, paid, void, uncollectible';
COMMENT ON COLUMN stripe_billing_history.invoice_url IS 'Hosted invoice URL for customer viewing';
COMMENT ON COLUMN stripe_billing_history.invoice_pdf IS 'PDF download URL for invoice';

COMMENT ON COLUMN stripe_customers.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN stripe_customers.default_payment_method IS 'Default payment method ID (pm_xxx)';
