-- TrueLayer OAuth State Storage
-- Stores temporary OAuth state and PKCE code verifiers for security
CREATE TABLE IF NOT EXISTS truelayer_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL UNIQUE,
  code_verifier VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_truelayer_oauth_user_state (user_id, state),
  INDEX idx_truelayer_oauth_expires (expires_at)
);

-- TrueLayer Connections
-- Stores TrueLayer-specific connection details (uses BankConnection as well)
CREATE TABLE IF NOT EXISTS truelayer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,

  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  -- Provider information
  provider_id VARCHAR(255),
  provider_name VARCHAR(255),

  -- Permissions
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

  -- Sync tracking
  last_synced TIMESTAMP,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_truelayer_conn_user (user_id),
  INDEX idx_truelayer_conn_status (status),
  INDEX idx_truelayer_conn_expires (expires_at)
);

-- TrueLayer Audit Logs
-- Comprehensive audit trail for all TrueLayer operations
CREATE TABLE IF NOT EXISTS truelayer_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_truelayer_audit_user (user_id),
  INDEX idx_truelayer_audit_action (action),
  INDEX idx_truelayer_audit_created (created_at)
);

-- Cleanup job for expired OAuth states (run daily)
-- DELETE FROM truelayer_oauth_states WHERE expires_at < NOW();

-- Comments
COMMENT ON TABLE truelayer_oauth_states IS 'Temporary OAuth2 PKCE state and code verifier storage for TrueLayer';
COMMENT ON TABLE truelayer_connections IS 'TrueLayer bank connection details with encrypted tokens';
COMMENT ON TABLE truelayer_audit_logs IS 'Audit trail for all TrueLayer API operations';
