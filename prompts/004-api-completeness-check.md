<objective>
Audit the Operate API to identify missing endpoints, incomplete implementations, and functionality gaps that prevent companies from focusing on their actual work.
</objective>

<context>
Operate aims to be "fully automatic" - companies should be able to:
1. Open the app and receive proactive suggestions
2. Click suggestions to "lock them in" to the AI chatbot
3. Let the app handle finances, taxes, HR, etc. automatically

Current integrations:
- Google OAuth (auth)
- Anthropic AI (intelligence)
- TrueLayer/Tink (EU/UK banking)
- Stripe (payments)
- Plaid (US banking)

The app should handle:
- Invoice management (AR/AP)
- Expense tracking
- Bank reconciliation
- Tax filing assistance
- HR/Payroll
- Document management
- Cash flow predictions
</context>

<audit_areas>
1. **Core CRUD Operations**
   - Do all entities have complete CRUD?
   - Are there orphaned entities without APIs?
   - Missing list/filter/sort capabilities?

2. **Business Logic Endpoints**
   - Invoice generation and sending
   - Payment processing
   - Expense approval workflows
   - Bank transaction import
   - Tax calculation endpoints

3. **Automation Endpoints**
   - Proactive suggestion generation
   - Auto-classification of transactions
   - Bill payment scheduling
   - Recurring invoice generation
   - Automated reconciliation

4. **AI Integration**
   - Chat endpoint completeness
   - Document analysis endpoints
   - Natural language query handling
   - Suggestion generation APIs

5. **Reporting Endpoints**
   - Financial reports
   - Tax reports
   - Cash flow projections
   - Analytics/dashboards data

6. **Integration Endpoints**
   - Bank connection status
   - Webhook handling
   - Third-party sync status
</audit_areas>

<methodology>
1. **Inventory All Endpoints**
   - Scan apps/api/src/**/*.controller.ts
   - List all routes with HTTP methods
   - Check for missing implementations (empty handlers)

2. **Compare to Business Requirements**
   - Map endpoints to user stories
   - Identify functionality gaps
   - Check if automation features are implemented

3. **Test Endpoint Completeness**
   - Do GET endpoints have corresponding POST/PUT/DELETE?
   - Are bulk operations supported?
   - Is pagination implemented?

4. **Review Service Layer**
   - Are services complete?
   - Missing business logic?
   - Incomplete transaction handling?

5. **Check Integration Completeness**
   - Can we actually import bank transactions?
   - Can we send invoices via email?
   - Can we generate and file tax reports?
</methodology>

<output>
Save findings to: `./audits/api-completeness.md`

Structure:
## Executive Summary
[API completeness score and overview]

## Missing Critical Endpoints
[Endpoints that MUST exist for core functionality]

## Incomplete Implementations
[Endpoints that exist but don't fully work]

## Missing Automation APIs
[Endpoints needed for "fully automatic" vision]

## Missing AI/Chat APIs
[Gaps in AI integration]

## Missing Reporting APIs
[Reports users expect but don't exist]

## API Endpoint Inventory
[Complete list of existing endpoints by module]

## Recommended Additions
[Prioritized list of APIs to build]

## Quick Wins
[Simple endpoints that add high value]
</output>

<success_criteria>
- Complete inventory of existing endpoints
- All missing critical endpoints identified
- Automation feature gaps documented
- Clear roadmap for API completion
- Quick wins identified for immediate value
</success_criteria>
