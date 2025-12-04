-- Row-Level Security (RLS) Policies for Tenant Isolation
-- Migration: 20251128233757_rls_policies
--
-- This migration enables Row-Level Security on all tenant-scoped tables
-- to enforce data isolation between organizations. All queries will be
-- automatically filtered by the current organization context set via
-- PostgreSQL session variables.
--
-- Tables with RLS:
-- - Membership (orgId)
-- - AuditLog (orgId)
--
-- Security Context:
-- - app.current_org_id: UUID of the current organization
-- - app.bypass_rls: Boolean flag to bypass RLS for system operations
--
-- IMPORTANT: The Organisation table itself is NOT protected by RLS as it
-- represents the tenant entities themselves. Access control for switching
-- between organizations should be handled at the application layer.

-- ============================================================================
-- Enable Row-Level Security on Tenant Tables
-- ============================================================================

ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop existing policies if any (idempotent migration)
-- ============================================================================

DROP POLICY IF EXISTS membership_tenant_isolation ON "Membership";
DROP POLICY IF EXISTS auditlog_tenant_isolation ON "AuditLog";

-- ============================================================================
-- Create RLS Policies for Membership Table
-- ============================================================================

-- Policy: membership_tenant_isolation
-- Applies to: SELECT, INSERT, UPDATE, DELETE
-- Logic: Allow access only to rows where orgId matches current tenant context
--        OR when RLS bypass is explicitly enabled for system operations
CREATE POLICY membership_tenant_isolation ON "Membership"
  FOR ALL
  USING (
    "orgId" = current_setting('app.current_org_id', true)::uuid
    OR current_setting('app.bypass_rls', true)::boolean = true
  )
  WITH CHECK (
    "orgId" = current_setting('app.current_org_id', true)::uuid
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- ============================================================================
-- Create RLS Policies for AuditLog Table
-- ============================================================================

-- Policy: auditlog_tenant_isolation
-- Applies to: SELECT, INSERT, UPDATE, DELETE
-- Logic: Allow access only to rows where orgId matches current tenant context
--        OR when RLS bypass is explicitly enabled for system operations
CREATE POLICY auditlog_tenant_isolation ON "AuditLog"
  FOR ALL
  USING (
    "orgId" = current_setting('app.current_org_id', true)::uuid
    OR current_setting('app.bypass_rls', true)::boolean = true
  )
  WITH CHECK (
    "orgId" = current_setting('app.current_org_id', true)::uuid
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- ============================================================================
-- Index Optimization for RLS Policies
-- ============================================================================

-- Ensure orgId columns are indexed for efficient RLS filtering
-- (These should already exist from schema, but verify)
CREATE INDEX IF NOT EXISTS "Membership_orgId_idx" ON "Membership"("orgId");
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx" ON "AuditLog"("orgId");

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

-- Ensure the application database user can read current_setting
-- (Usually granted by default, but explicitly ensuring it here)
-- Note: Replace 'your_app_user' with actual database user if needed
-- GRANT EXECUTE ON FUNCTION current_setting(text, boolean) TO your_app_user;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON POLICY membership_tenant_isolation ON "Membership" IS
  'Enforces tenant isolation by restricting access to memberships belonging to the current organization context (app.current_org_id) or when RLS bypass is enabled.';

COMMENT ON POLICY auditlog_tenant_isolation ON "AuditLog" IS
  'Enforces tenant isolation by restricting access to audit logs belonging to the current organization context (app.current_org_id) or when RLS bypass is enabled.';
