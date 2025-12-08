-- CASCADE RULES FIX SCRIPT
-- This script documents the proper cascade behavior for all relations
-- Execute this AFTER applying Prisma schema changes

-- ============================================================================
-- CRITICAL CASCADE RULE DECISIONS
-- ============================================================================

-- RULE 1: User Relations (SetNull or Restrict)
-- When a user is deleted, we DON'T want to cascade delete data
-- Instead: SetNull for optional assignments, Restrict for required ownership

-- Examples:
-- - Membership: User deleted → Restrict (can't delete if has memberships)
-- - Session: User deleted → Cascade (session is meaningless without user)
-- - Employee: User deleted → SetNull (employee record stays, user link removed)
-- - LeaveRequest.reviewer: User deleted → SetNull (leave request stays, reviewer unassigned)
-- - Invoice assignments: SetNull
-- - Audit actions: SetNull (keep history, mark as deleted user)

-- RULE 2: Organisation Relations (Cascade)
-- Organisation data should cascade delete - org deleted = all data deleted
-- This is correct for multi-tenant data isolation

-- RULE 3: Customer/Vendor/Client Relations (Restrict)
-- Can't delete customers with invoices, vendors with bills
-- This protects financial records

-- RULE 4: Invoice/Bill Relations
-- - RecurringInvoice → Invoice: SetNull (invoice stays if template deleted)
-- - Client → Invoice: Restrict (can't delete client with invoices)
-- - Vendor → Bill: Restrict (can't delete vendor with bills)

-- RULE 5: Hierarchical Relations
-- - DocumentFolder.parent: SetNull or Cascade (depends on design choice)
-- - We'll use SetNull to prevent accidental deletion cascades

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- Check all foreign keys have proper actions
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check for missing cascade rules (should be empty after fix)
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND rc.delete_rule = 'NO ACTION' -- Prisma default
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
