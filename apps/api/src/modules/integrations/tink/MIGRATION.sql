-- Tink Open Banking Integration Database Schema
-- Add these tables to your database schema

-- Store encrypted Tink OAuth2 tokens
CREATE TABLE IF NOT EXISTS tink_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    access_token TEXT NOT NULL, -- AES-256-GCM encrypted
    refresh_token TEXT NOT NULL, -- AES-256-GCM encrypted
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT tink_credentials_org_user_unique UNIQUE (organization_id, user_id)
);

-- Index for faster lookups
CREATE INDEX idx_tink_credentials_org_user ON tink_credentials(organization_id, user_id);
CREATE INDEX idx_tink_credentials_expires_at ON tink_credentials(expires_at);

-- Store OAuth2 PKCE authorization flow state
CREATE TABLE IF NOT EXISTS tink_authorization_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state TEXT NOT NULL UNIQUE,
    code_verifier TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    redirect_uri TEXT NOT NULL,
    scope TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for state lookups
CREATE INDEX idx_tink_auth_flows_state ON tink_authorization_flows(state);
CREATE INDEX idx_tink_auth_flows_expires_at ON tink_authorization_flows(expires_at);

-- Audit log for all Tink API interactions
CREATE TABLE IF NOT EXISTS tink_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    request_id TEXT,
    duration INTEGER NOT NULL, -- milliseconds
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for audit log queries
CREATE INDEX idx_tink_audit_org_user ON tink_audit_logs(organization_id, user_id);
CREATE INDEX idx_tink_audit_timestamp ON tink_audit_logs(timestamp DESC);
CREATE INDEX idx_tink_audit_action ON tink_audit_logs(action);

-- Optional: Clean up expired authorization flows periodically
-- Run this as a scheduled job or cron
CREATE OR REPLACE FUNCTION cleanup_expired_tink_auth_flows()
RETURNS void AS $$
BEGIN
    DELETE FROM tink_authorization_flows
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE tink_credentials IS 'Stores encrypted OAuth2 tokens for Tink Open Banking integration';
COMMENT ON TABLE tink_authorization_flows IS 'Temporary storage for OAuth2 PKCE authorization flow state';
COMMENT ON TABLE tink_audit_logs IS 'Audit trail for all Tink API interactions';

COMMENT ON COLUMN tink_credentials.access_token IS 'AES-256-GCM encrypted access token';
COMMENT ON COLUMN tink_credentials.refresh_token IS 'AES-256-GCM encrypted refresh token';
COMMENT ON COLUMN tink_authorization_flows.code_verifier IS 'PKCE code verifier (stored temporarily)';
COMMENT ON COLUMN tink_authorization_flows.code_challenge IS 'PKCE code challenge (SHA-256 of verifier)';
