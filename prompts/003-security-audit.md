<objective>
Perform a comprehensive security audit of the Operate application. Identify vulnerabilities, security misconfigurations, exposed secrets, and areas needing hardening.
</objective>

<context>
Operate is an enterprise SaaS handling sensitive business data:
- Financial data (invoices, expenses, bank transactions)
- Business intelligence and analytics
- Tax information
- Employee/HR data
- Multi-tenant architecture

Integrations requiring secure handling:
- Google OAuth (authentication)
- Anthropic AI (business data sent to AI)
- TrueLayer/Tink (Open Banking - highly sensitive)
- Stripe (payment processing)
- Plaid (US banking)
</context>

<audit_areas>
1. **Exposed Secrets & Credentials**
   - API keys in source code
   - Hardcoded passwords
   - Secrets in git history
   - .env files committed
   - Credentials in logs

2. **Authentication & Authorization**
   - JWT implementation security
   - Session management
   - Password policies
   - MFA implementation
   - Role-based access control (RBAC)
   - API endpoint protection

3. **Data Security**
   - PII handling and encryption
   - Data at rest encryption
   - Data in transit (HTTPS, TLS)
   - Database security
   - Backup security

4. **Input Validation**
   - SQL injection vulnerabilities
   - XSS vulnerabilities
   - Command injection
   - Path traversal
   - CSRF protection

5. **API Security**
   - Rate limiting
   - Input sanitization
   - Error message exposure
   - CORS configuration
   - API versioning

6. **Infrastructure Security**
   - Dependency vulnerabilities (npm audit)
   - Outdated packages
   - Security headers
   - Logging sensitive data
</audit_areas>

<methodology>
1. **Secret Scanning**
   - Grep for API_KEY, SECRET, PASSWORD, TOKEN patterns
   - Check .env.example for sensitive defaults
   - Review git history for leaked secrets

2. **Dependency Audit**
   - Run `npm audit` to find vulnerable packages
   - Check for outdated critical dependencies

3. **Code Review for OWASP Top 10**
   - Search for raw SQL queries (injection risk)
   - Check for innerHTML usage (XSS)
   - Review file upload handling
   - Check authentication middleware

4. **Configuration Review**
   - Check CORS settings
   - Review CSP headers
   - Validate rate limiting config
   - Check error handling (info leakage)

5. **Data Flow Analysis**
   - How is sensitive data passed to AI?
   - Are bank credentials properly secured?
   - Is PII logged anywhere?
</methodology>

<output>
Save findings to: `./audits/security-audit.md`

Structure:
## Executive Summary
[Overall security posture assessment]

## Critical Vulnerabilities (P0 - Fix Immediately)
[High-risk issues requiring immediate attention]

## High Severity Issues (P1)
[Significant security gaps]

## Medium Severity Issues (P2)
[Important but not urgent]

## Low Severity / Hardening Recommendations (P3)
[Best practices to implement]

## Dependency Vulnerabilities
[npm audit results summary]

## Compliance Considerations
[GDPR, SOC2, PCI-DSS relevant items]

## Recommended Security Enhancements
[Proactive improvements]
</output>

<success_criteria>
- No critical vulnerabilities left undocumented
- All secret exposure risks identified
- OWASP Top 10 coverage verified
- Dependency audit completed
- Clear remediation priorities established
</success_criteria>
