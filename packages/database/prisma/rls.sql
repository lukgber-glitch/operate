-- Row-Level Security (RLS) Policies for Multi-Tenant Isolation
--
-- This file defines PostgreSQL RLS policies to enforce tenant isolation
-- at the database level. RLS ensures that queries automatically filter
-- data based on the current organization context, preventing accidental
-- cross-tenant data access.
--
-- Usage:
--   Run this after migrations: psql $DATABASE_URL < prisma/rls.sql
--
-- Related files:
--   - src/rls.ts - Helper functions for setting tenant context
--   - src/middleware/tenant-context.ts - Prisma middleware integration

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Returns the current organization ID set in the session context.
-- Used by RLS policies to filter queries to the current tenant.
--
-- Returns NULL if no context is set, which will cause RLS policies
-- to block access (unless bypass is enabled).
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Returns whether RLS bypass is enabled for the current session.
-- When true, RLS policies will not filter queries, allowing
-- system operations to access all tenant data.
--
-- WARNING: Bypass should only be used for administrative operations.
CREATE OR REPLACE FUNCTION bypass_rls() RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.bypass_rls', true)::boolean, false);
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- Enable RLS on Tenant-Scoped Tables
-- ============================================================================

-- Enable RLS on all tables that contain tenant-specific data
-- Tables with an orgId column are tenant-scoped
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Note: Session table is intentionally NOT RLS-protected as it's user-scoped,
-- not org-scoped. Session isolation is handled at the application layer.

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy for Membership table
-- Allows access only to memberships belonging to the current organization
-- or when bypass is enabled for system operations
CREATE POLICY membership_isolation ON "Membership"
  FOR ALL
  USING (bypass_rls() OR "orgId" = current_org_id());

-- Policy for AuditLog table
-- Allows access only to audit logs belonging to the current organization
-- or when bypass is enabled for system operations
CREATE POLICY auditlog_isolation ON "AuditLog"
  FOR ALL
  USING (bypass_rls() OR "orgId" = current_org_id());

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- You can verify RLS is working with these queries:
--
-- 1. Check RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public' AND rowsecurity = true;
--
-- 2. Check policies exist:
--    SELECT tablename, policyname, permissive, cmd
--    FROM pg_policies
--    WHERE schemaname = 'public';
--
-- 3. Test with tenant context:
--    SELECT set_config('app.current_org_id', 'your-org-uuid', true);
--    SELECT * FROM "Membership";  -- Should only return current org's data
--
-- 4. Test bypass:
--    SELECT set_config('app.bypass_rls', 'true', true);
--    SELECT * FROM "Membership";  -- Should return all orgs' data
--
-- 5. Clear context:
--    SELECT set_config('app.current_org_id', NULL, true);
--    SELECT * FROM "Membership";  -- Should return no rows (blocked by RLS)
