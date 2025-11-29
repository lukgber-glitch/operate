-- ============================================================================
-- RLS Verification Script
-- ============================================================================
-- This script verifies that Row-Level Security is properly configured
-- Run with: psql $DATABASE_URL -f scripts/verify-rls.sql
--
-- Expected results:
-- - RLS enabled on Membership and AuditLog tables
-- - Policies created for both tables
-- - Indexes exist on orgId columns
-- ============================================================================

\echo '==================== RLS Verification Script ===================='
\echo ''

-- ============================================================================
-- 1. Check if RLS is enabled on tables
-- ============================================================================
\echo '1. Checking RLS Status on Tables...'
\echo ''

SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('Membership', 'AuditLog')
ORDER BY tablename;

\echo ''
\echo 'Expected: Both tables should show "✓ ENABLED"'
\echo ''

-- ============================================================================
-- 2. Check policies
-- ============================================================================
\echo '2. Checking RLS Policies...'
\echo ''

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as applies_to,
  qual as using_expression
FROM pg_policies
WHERE tablename IN ('Membership', 'AuditLog')
ORDER BY tablename, policyname;

\echo ''
\echo 'Expected: membership_tenant_isolation and auditlog_tenant_isolation policies'
\echo ''

-- ============================================================================
-- 3. Check indexes on orgId columns
-- ============================================================================
\echo '3. Checking Indexes on orgId Columns...'
\echo ''

SELECT
  t.relname as table_name,
  i.relname as index_name,
  a.attname as column_name,
  ix.indisunique as is_unique
FROM
  pg_class t,
  pg_class i,
  pg_index ix,
  pg_attribute a
WHERE
  t.oid = ix.indrelid
  AND i.oid = ix.indexrelid
  AND a.attrelid = t.oid
  AND a.attnum = ANY(ix.indkey)
  AND t.relkind = 'r'
  AND t.relname IN ('Membership', 'AuditLog')
  AND a.attname = 'orgId'
ORDER BY t.relname, i.relname;

\echo ''
\echo 'Expected: Indexes on Membership.orgId and AuditLog.orgId'
\echo ''

-- ============================================================================
-- 4. Check table structure (orgId columns)
-- ============================================================================
\echo '4. Verifying orgId Column Existence...'
\echo ''

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Membership', 'AuditLog')
  AND column_name = 'orgId'
ORDER BY table_name;

\echo ''
\echo 'Expected: orgId column in both tables (text/varchar type for UUID)'
\echo ''

-- ============================================================================
-- 5. Test RLS Policy (Safe Read-Only Test)
-- ============================================================================
\echo '5. Testing RLS Policy Behavior (Read-Only)...'
\echo ''

-- Save current state
\echo 'Saving current session state...'

-- Test 1: Query without context (should work but policies will filter)
\echo 'Test 1: Query without tenant context...'
SELECT set_config('app.current_org_id', NULL, true);
SELECT set_config('app.bypass_rls', 'false', true);

SELECT
  'Memberships without context' as test,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS (RLS blocking access)'
    ELSE '⚠ WARNING (Expected 0 rows, RLS may not be working)'
  END as result
FROM "Membership";

\echo ''

-- Test 2: Query with bypass (should see all data if you have permission)
\echo 'Test 2: Query with RLS bypass enabled...'
SELECT set_config('app.bypass_rls', 'true', true);

SELECT
  'Memberships with bypass' as test,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS (Bypass working)'
    ELSE 'ℹ INFO (No data in table or insufficient permissions)'
  END as result
FROM "Membership";

\echo ''

-- Reset state
\echo 'Resetting session state...'
SELECT set_config('app.current_org_id', NULL, true);
SELECT set_config('app.bypass_rls', 'false', true);

\echo ''

-- ============================================================================
-- 6. Summary
-- ============================================================================
\echo '==================== Verification Summary ===================='
\echo ''
\echo 'Checklist:'
\echo '  [ ] RLS enabled on Membership table'
\echo '  [ ] RLS enabled on AuditLog table'
\echo '  [ ] Policies created for both tables'
\echo '  [ ] Indexes exist on orgId columns'
\echo '  [ ] RLS blocks access without context'
\echo '  [ ] RLS bypass allows access'
\echo ''
\echo 'If all checks pass, RLS is properly configured!'
\echo ''
\echo '==================== End of Verification ===================='
