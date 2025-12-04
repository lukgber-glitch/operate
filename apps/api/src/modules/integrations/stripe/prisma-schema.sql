-- Stripe Connect Integration Schema
-- Add this to your Prisma schema or run as a migration

-- Stripe Connect Accounts Table
-- Stores information about connected Stripe accounts
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'express' or 'standard'
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, RESTRICTED, REJECTED, DISABLED
  email VARCHAR(255),
  country VARCHAR(2) NOT NULL,
  default_currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  capabilities JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_stripe_connect_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Stripe Connect Accounts
CREATE INDEX IF NOT EXISTS idx_stripe_connect_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_account_id ON stripe_connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_status ON stripe_connect_accounts(status);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_deleted_at ON stripe_connect_accounts(deleted_at);

-- Stripe Payments Table
-- Stores payment intent records
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- Amount in smallest currency unit (cents)
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELED, REFUNDED, PARTIALLY_REFUNDED
  connected_account_id VARCHAR(255), -- Stripe account ID if using Connect
  platform_fee INTEGER, -- Platform fee amount in smallest currency unit
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_stripe_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Stripe Payments
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_intent_id ON stripe_payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_connected_account ON stripe_payments(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_created_at ON stripe_payments(created_at DESC);

-- Stripe Audit Logs Table
-- Stores audit trail for all Stripe operations
CREATE TABLE IF NOT EXISTS stripe_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_stripe_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Stripe Audit Logs
CREATE INDEX IF NOT EXISTS idx_stripe_audit_user_id ON stripe_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_audit_action ON stripe_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_stripe_audit_created_at ON stripe_audit_logs(created_at DESC);

-- Stripe Webhook Logs Table
-- Stores webhook event processing logs
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(event_id)
);

-- Indexes for Stripe Webhook Logs
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_event_id ON stripe_webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_event_type ON stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_status ON stripe_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_created_at ON stripe_webhook_logs(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE stripe_connect_accounts IS 'Stores Stripe Connect account information for merchants/sellers';
COMMENT ON TABLE stripe_payments IS 'Stores payment intent records and transaction history';
COMMENT ON TABLE stripe_audit_logs IS 'Audit trail for all Stripe operations';
COMMENT ON TABLE stripe_webhook_logs IS 'Logs for webhook event processing';

COMMENT ON COLUMN stripe_connect_accounts.stripe_account_id IS 'Stripe account ID (acct_xxx)';
COMMENT ON COLUMN stripe_connect_accounts.type IS 'Account type: express or standard';
COMMENT ON COLUMN stripe_connect_accounts.status IS 'Account status: PENDING, ACTIVE, RESTRICTED, REJECTED, DISABLED';
COMMENT ON COLUMN stripe_connect_accounts.charges_enabled IS 'Whether account can accept charges';
COMMENT ON COLUMN stripe_connect_accounts.payouts_enabled IS 'Whether account can receive payouts';
COMMENT ON COLUMN stripe_connect_accounts.capabilities IS 'Stripe capabilities JSON (card_payments, transfers, etc.)';

COMMENT ON COLUMN stripe_payments.payment_intent_id IS 'Stripe payment intent ID (pi_xxx)';
COMMENT ON COLUMN stripe_payments.amount IS 'Amount in smallest currency unit (e.g., cents for USD)';
COMMENT ON COLUMN stripe_payments.connected_account_id IS 'Connected Stripe account ID for split payments';
COMMENT ON COLUMN stripe_payments.platform_fee IS 'Platform fee amount in smallest currency unit';

COMMENT ON COLUMN stripe_webhook_logs.event_id IS 'Stripe webhook event ID (evt_xxx)';
COMMENT ON COLUMN stripe_webhook_logs.event_type IS 'Webhook event type (e.g., payment_intent.succeeded)';
