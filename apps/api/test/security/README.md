# Security Test Suite

## Overview

Comprehensive security testing suite for the Operate/CoachOS API. This suite tests authentication, authorization, input validation, and API security measures to ensure the application is secure against common vulnerabilities.

## Task Reference

**Task**: OP-081 - Implement Security Test Suite
**Agent**: VERIFY (QA Agent)

## Test Coverage

### 1. Authentication Security (`auth.security.spec.ts`)

Tests JWT authentication and session management:

- **JWT Token Validation**
  - Valid token acceptance
  - Expired token rejection
  - Invalid signature rejection
  - Malformed token rejection
  - Token structure validation

- **Refresh Token Flow**
  - Token refresh functionality
  - Invalid refresh token rejection
  - Token rotation (prevent reuse)

- **Password Security**
  - Password complexity enforcement
  - Strong password acceptance
  - Password hashing verification
  - User enumeration prevention

- **Brute Force Protection**
  - Login rate limiting
  - Progressive delays
  - Account lockout prevention

- **Authentication Bypass**
  - SQL injection in credentials
  - Array injection
  - Null/undefined handling

- **Session Management**
  - Token invalidation on logout
  - Session fixation prevention
  - Unique session ID generation

- **Multi-Factor Authentication**
  - MFA enforcement
  - Invalid MFA code rejection

**Total Tests**: ~35

### 2. Authorization Security (`authorization.security.spec.ts`)

Tests role-based access control and permissions:

- **RBAC Permission Checks**
  - Role-based access enforcement
  - OWNER, ADMIN, MEMBER, ASSISTANT permissions

- **Role Hierarchy**
  - OWNER > ADMIN > MEMBER > ASSISTANT
  - Privilege escalation prevention
  - Role modification restrictions

- **Cross-Tenant Access**
  - Organization isolation
  - Cross-tenant read prevention
  - Cross-tenant write prevention

- **Resource Ownership**
  - Owner-only resource modification
  - Self-profile access
  - Account deletion restrictions

- **MFA Enforcement**
  - Sensitive operation protection
  - Optional MFA bypass

- **Mass Assignment Protection**
  - Protected field prevention
  - Role assignment restrictions
  - Organization ID protection

- **Permission Boundaries**
  - Explicit permission requirements
  - Permission-based access

- **IDOR Prevention**
  - Indirect object reference attacks
  - Sequential ID guessing

- **API Key Authorization**
  - Invalid API key rejection
  - API key permission enforcement

**Total Tests**: ~30

### 3. Input Validation Security (`input-validation.security.spec.ts`)

Tests protection against injection attacks:

- **SQL Injection Prevention**
  - Search parameter sanitization
  - Email field protection
  - Filter parameter validation
  - Parameterized queries

- **XSS Prevention**
  - Script tag sanitization
  - Stored XSS prevention
  - Reflected XSS prevention
  - Special character encoding
  - DOM-based XSS prevention

- **Command Injection Prevention**
  - System call protection
  - Filename sanitization

- **Path Traversal Prevention**
  - File path validation
  - Directory restriction
  - Encoded path handling

- **NoSQL Injection Prevention**
  - Query sanitization
  - Object injection rejection

- **File Upload Validation**
  - Dangerous extension rejection
  - MIME type validation
  - File size limits
  - Double extension prevention

- **XXE Prevention**
  - XML external entity rejection

- **Header Injection Prevention**
  - HTTP header sanitization
  - CRLF injection prevention

- **Buffer Overflow Prevention**
  - Long string handling
  - Oversized payload rejection

- **SSRF Prevention**
  - Internal network URL blocking
  - Callback URL validation

- **Email Validation**
  - Format validation
  - Header injection prevention

- **Numeric Validation**
  - Range validation
  - Type coercion prevention

- **JSON Validation**
  - Malformed JSON rejection
  - Schema validation

- **Internationalization**
  - Unicode handling
  - Homograph attack prevention

**Total Tests**: ~60

### 4. API Security (`api-security.spec.ts`)

Tests API-level security configurations:

- **Security Headers**
  - X-Content-Type-Options
  - X-Frame-Options
  - Strict-Transport-Security
  - Content-Security-Policy
  - Server information hiding

- **CORS Configuration**
  - Allowed origin validation
  - Unauthorized origin rejection
  - Proper CORS headers
  - Credential handling

- **Rate Limiting**
  - Global rate limits
  - Auth endpoint limits
  - Rate limit headers
  - Rate limit reset
  - Per-IP limiting

- **Request Size Limits**
  - JSON payload limits
  - URL length limits
  - Header size limits

- **HTTP Method Security**
  - Allowed methods only
  - OPTIONS handling
  - Method-specific restrictions

- **API Versioning**
  - Version support
  - Invalid version rejection

- **Error Handling**
  - Stack trace hiding
  - Database error hiding
  - Error message sanitization
  - Consistent error format

- **Request Logging**
  - Sensitive data exclusion
  - Failed auth logging

- **API Documentation**
  - Production access restriction
  - Sensitive endpoint exclusion

- **Health Check Security**
  - Limited information exposure
  - Public access appropriateness

- **Timing Attack Prevention**
  - Consistent response times

**Total Tests**: ~45

## Test Statistics

- **Total Test Suites**: 4
- **Total Test Cases**: ~170
- **Coverage Areas**: 14
- **Security Categories**: OWASP Top 10 + Additional

## Running Tests

### Run All Security Tests
```bash
cd /c/Users/grube/op/operate/apps/api
npm run test -- test/security
```

### Run Specific Test Suite
```bash
# Authentication tests
npm run test -- test/security/auth.security.spec.ts

# Authorization tests
npm run test -- test/security/authorization.security.spec.ts

# Input validation tests
npm run test -- test/security/input-validation.security.spec.ts

# API security tests
npm run test -- test/security/api-security.spec.ts
```

### Run with Coverage
```bash
npm run test:cov -- test/security
```

### Run in Watch Mode
```bash
npm run test:watch -- test/security
```

## Test Utilities

### Payloads (`utils/payloads.ts`)

Collection of malicious payloads for security testing:
- SQL injection patterns
- XSS payloads
- Command injection
- Path traversal
- NoSQL injection
- XXE payloads
- Header injection
- File upload payloads
- SSRF payloads
- Buffer overflow patterns
- JWT manipulation
- CSRF manipulation
- Auth bypass patterns

### Helpers (`utils/test-helpers.ts`)

Common utilities for security testing:
- Test user creation
- JWT token generation
- Security test app setup
- Authenticated requests
- Rate limit testing
- Database integrity verification
- XSS detection
- Security header verification
- CORS testing
- Session fixation testing
- Response time measurement

## Security Assumptions

1. **Authentication**: JWT tokens are signed with HS256 or RS256
2. **Passwords**: Minimum 8 characters with complexity requirements
3. **Rate Limiting**: Implemented via @nestjs/throttler
4. **Input Validation**: class-validator and class-transformer
5. **CORS**: Configured with allowed origins
6. **Headers**: Helmet middleware for security headers
7. **Database**: Prisma ORM with parameterized queries
8. **MFA**: Optional but enforceable per organization

## Vulnerabilities Tested

Based on OWASP Top 10 2021:

1. **Broken Access Control**
   - Authorization tests
   - IDOR prevention
   - Cross-tenant access

2. **Cryptographic Failures**
   - Password hashing
   - Token encryption

3. **Injection**
   - SQL injection
   - NoSQL injection
   - Command injection
   - XSS
   - XXE

4. **Insecure Design**
   - Rate limiting
   - Session management
   - Error handling

5. **Security Misconfiguration**
   - Security headers
   - CORS
   - Error messages

6. **Vulnerable Components**
   - Tested indirectly through dependency security

7. **Authentication Failures**
   - Authentication tests
   - MFA enforcement

8. **Data Integrity Failures**
   - Input validation
   - Mass assignment

9. **Security Logging Failures**
   - Logging tests (partial)

10. **Server-Side Request Forgery**
    - SSRF prevention tests

## Recommendations

### High Priority

1. **Enable MFA Organization-Wide**: Enforce MFA for all sensitive operations
2. **Implement WAF**: Add Web Application Firewall for additional protection
3. **Security Monitoring**: Set up real-time security monitoring and alerting
4. **Penetration Testing**: Conduct regular penetration tests by security professionals

### Medium Priority

1. **Content Security Policy**: Strengthen CSP headers
2. **Rate Limiting**: Fine-tune rate limits based on actual usage
3. **API Documentation**: Ensure production API docs are properly secured
4. **Logging**: Implement comprehensive security event logging

### Low Priority

1. **Security Training**: Regular security training for development team
2. **Dependency Scanning**: Automated dependency vulnerability scanning
3. **Security Headers**: Review and optimize all security headers
4. **Error Messages**: Ensure all error messages are sanitized

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test -- test/security
```

## Discovered Issues

**None** - All tests are currently passing. Any vulnerabilities discovered during testing should be documented here with:
- Severity level
- Description
- Affected endpoints
- Recommended fix
- Tracking ticket number

## Maintenance

This test suite should be updated when:
- New authentication mechanisms are added
- New endpoints are created
- Security requirements change
- New vulnerabilities are discovered (CVEs)
- OWASP Top 10 is updated

## Contact

For security concerns or questions about this test suite:
- **Agent**: VERIFY (QA Agent)
- **Task**: OP-081
- **Sprint**: 1 - Foundation

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
