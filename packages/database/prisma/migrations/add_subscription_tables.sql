-- Subscription Module Database Schema
-- Tables for subscription usage tracking, audit logs, and notifications

-- Subscription Usage Tracking Table
-- Tracks resource usage (invoices, users) for billing period
CREATE TABLE IF NOT EXISTS subscription_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'invoice', 'user', etc.
  resource_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'created', 'added', 'deleted'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_usage_tracking_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes for Subscription Usage Tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_id ON subscription_usage_tracking(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_resource_type ON subscription_usage_tracking(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON subscription_usage_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_period ON subscription_usage_tracking(org_id, created_at);

-- Subscription Usage Archive Table
-- Historical usage data (moved monthly)
CREATE TABLE IF NOT EXISTS subscription_usage_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for Subscription Usage Archive
CREATE INDEX IF NOT EXISTS idx_usage_archive_org_id ON subscription_usage_archive(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_archive_created_at ON subscription_usage_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_archive_archived_at ON subscription_usage_archive(archived_at DESC);

-- Subscription Change Log Table
-- Audit log of subscription tier changes
CREATE TABLE IF NOT EXISTS subscription_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  change_type VARCHAR(50) NOT NULL, -- 'TRIAL_START', 'UPGRADE', 'DOWNGRADE', 'CANCEL', etc.
  from_tier VARCHAR(20) NOT NULL,
  to_tier VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_change_log_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_change_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for Subscription Change Log
CREATE INDEX IF NOT EXISTS idx_change_log_org_id ON subscription_change_log(org_id);
CREATE INDEX IF NOT EXISTS idx_change_log_user_id ON subscription_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_change_log_change_type ON subscription_change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_change_log_created_at ON subscription_change_log(created_at DESC);

-- Subscription Notifications Table
-- Stores limit warnings and other subscription-related notifications
CREATE TABLE IF NOT EXISTS subscription_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'LIMIT_WARNING', 'TRIAL_ENDING', 'PAYMENT_FAILED'
  resource_type VARCHAR(50), -- 'invoices', 'users', null for general notifications
  percent_used INTEGER, -- For limit warnings
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_notifications_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes for Subscription Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON subscription_notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON subscription_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON subscription_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON subscription_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON subscription_notifications(created_at DESC);

-- Subscription Audit Log Table
-- General audit log for subscription events
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for Subscription Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON subscription_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON subscription_audit_log(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE subscription_usage_tracking IS 'Tracks resource usage (invoices, users) for current billing period';
COMMENT ON TABLE subscription_usage_archive IS 'Historical archive of usage data, rotated monthly';
COMMENT ON TABLE subscription_change_log IS 'Audit log of subscription tier changes and lifecycle events';
COMMENT ON TABLE subscription_notifications IS 'Subscription-related notifications sent to organizations';
COMMENT ON TABLE subscription_audit_log IS 'General audit log for subscription system events';

COMMENT ON COLUMN subscription_usage_tracking.resource_type IS 'Type of resource being tracked (invoice, user, etc.)';
COMMENT ON COLUMN subscription_usage_tracking.event_type IS 'Event that occurred (created, added, deleted)';

COMMENT ON COLUMN subscription_change_log.change_type IS 'Type of subscription change (TRIAL_START, UPGRADE, DOWNGRADE, CANCEL, etc.)';
COMMENT ON COLUMN subscription_change_log.from_tier IS 'Previous subscription tier (FREE, PRO, ENTERPRISE)';
COMMENT ON COLUMN subscription_change_log.to_tier IS 'New subscription tier (FREE, PRO, ENTERPRISE)';

COMMENT ON COLUMN subscription_notifications.notification_type IS 'Type of notification (LIMIT_WARNING, TRIAL_ENDING, PAYMENT_FAILED)';
COMMENT ON COLUMN subscription_notifications.percent_used IS 'Percentage of limit used (for LIMIT_WARNING notifications)';
