-- Tink Webhook Events Table
-- Stores incoming webhook events from Tink for idempotency and audit purposes

CREATE TABLE IF NOT EXISTS tink_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(500) UNIQUE NOT NULL, -- Composite: eventType_userId_timestamp
  event_type VARCHAR(100) NOT NULL, -- e.g., transaction:created, account:balance_updated
  user_id VARCHAR(255) NOT NULL, -- Tink user ID
  payload JSONB NOT NULL, -- Full webhook payload for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT tink_webhook_events_event_id_key UNIQUE (event_id)
);

-- Index for quick duplicate checks
CREATE INDEX IF NOT EXISTS idx_tink_webhook_events_event_id ON tink_webhook_events(event_id);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_tink_webhook_events_type ON tink_webhook_events(event_type);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_tink_webhook_events_user ON tink_webhook_events(user_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_tink_webhook_events_created_at ON tink_webhook_events(created_at);

COMMENT ON TABLE tink_webhook_events IS 'Stores Tink webhook events for idempotency and audit';
COMMENT ON COLUMN tink_webhook_events.event_id IS 'Unique event identifier to prevent duplicate processing';
COMMENT ON COLUMN tink_webhook_events.event_type IS 'Type of webhook event (transaction:created, etc.)';
COMMENT ON COLUMN tink_webhook_events.user_id IS 'Tink user ID from the webhook payload';
COMMENT ON COLUMN tink_webhook_events.payload IS 'Full webhook payload as JSON for debugging';
