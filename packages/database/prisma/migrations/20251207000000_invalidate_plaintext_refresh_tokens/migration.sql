-- SECURITY FIX: Invalidate all existing plaintext refresh tokens
-- After this migration, refresh tokens will be hashed (SHA-256) before storage
-- This prevents token theft in case of database compromise

-- Delete all existing sessions to force re-authentication
-- Users will need to log in again, but their refresh tokens are now secure
DELETE FROM "Session";

-- Add comment to token column documenting the security change
COMMENT ON COLUMN "Session"."token" IS 'SHA-256 hash of refresh token (64 hex chars). Tokens are hashed before storage to prevent theft from database compromise.';
