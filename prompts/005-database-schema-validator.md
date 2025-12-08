<objective>
Audit the Operate database schema for completeness, integrity issues, missing relationships, and optimization opportunities.
</objective>

<context>
Operate uses Prisma with PostgreSQL:
- Schema location: packages/database/prisma/schema.prisma
- Multi-tenant SaaS (organization-based isolation)
- Handles financial data requiring high integrity

Key domains:
- Users & Organizations (multi-tenant)
- Invoices & Payments (AR)
- Bills & Vendors (AP)
- Bank Accounts & Transactions
- Documents & Attachments
- Tax Records & Filings
- HR/Employees & Payroll
</context>

<audit_areas>
1. **Schema Completeness**
   - Are all necessary entities defined?
   - Missing fields for core functionality?
   - Proper enum types defined?

2. **Relationship Integrity**
   - Missing foreign keys?
   - Orphan prevention (cascade rules)
   - Many-to-many relationships properly modeled?

3. **Multi-Tenancy**
   - Every table has organizationId where needed?
   - Tenant isolation enforced at DB level?
   - Cross-tenant data leak risks?

4. **Data Integrity**
   - Required fields properly marked?
   - Default values sensible?
   - Unique constraints in place?
   - Check constraints for enums?

5. **Performance**
   - Indexes on frequently queried fields?
   - Indexes on foreign keys?
   - Composite indexes where needed?
   - N+1 query risks?

6. **Audit Trail**
   - createdAt/updatedAt on all tables?
   - Soft delete vs hard delete?
   - Change history tracking?

7. **Migration Health**
   - Pending migrations?
   - Migration conflicts?
   - Schema drift from migrations?
</audit_areas>

<methodology>
1. **Review Schema File**
   - Read packages/database/prisma/schema.prisma
   - Document all models and relationships
   - Identify missing relationships

2. **Check Migration Status**
   - List migration files
   - Check for pending migrations
   - Identify any failed migrations

3. **Analyze Indexes**
   - List existing indexes
   - Identify missing indexes for common queries
   - Check for redundant indexes

4. **Multi-Tenancy Audit**
   - Verify organizationId on appropriate tables
   - Check RLS policies if any
   - Review query patterns for tenant isolation

5. **Compare to Business Model**
   - Does schema support all planned features?
   - Missing tables for automation features?
   - Can we model proactive suggestions?
</methodology>

<output>
Save findings to: `./audits/database-schema.md`

Structure:
## Executive Summary
[Schema health score and overview]

## Critical Schema Issues
[Problems that could cause data loss or corruption]

## Missing Entities
[Tables/models that need to be added]

## Missing Relationships
[Foreign keys and relations to add]

## Index Recommendations
[Indexes to add for performance]

## Multi-Tenancy Issues
[Tenant isolation gaps]

## Migration Status
[Current migration health]

## Schema Enhancement Recommendations
[Improvements for new features]

## ERD Overview
[Text-based entity relationship summary]
</output>

<success_criteria>
- Full schema inventory completed
- Relationship integrity verified
- Multi-tenancy properly enforced
- Index optimization opportunities identified
- Clear enhancement roadmap for new features
</success_criteria>
