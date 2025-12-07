# Operate API Endpoint Test Report

**Generated:** 2025-12-07T11:58:06.970Z

**API Base:** https://operate.guru/api/v1

## Summary

| Status | Count |
|--------|-------|
| Total Endpoints | 67 |
| Exists (2xx) | 1 |
| Not Found (404) | 55 |
| Unauthorized (401) | 8 |
| Forbidden (403) | 0 |
| Client Error (4xx) | 1 |
| Server Error (5xx) | 0 |

## Results by Module

### Auth

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| POST /auth/login | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| POST /auth/register | ? CLIENT_ERROR | 400 | Client error |
| POST /auth/logout | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| POST /auth/refresh | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| GET /auth/me | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| GET /auth/google | ? UNKNOWN | 302 | Unexpected status |
| GET /auth/google/callback | ? UNKNOWN | 302 | Unexpected status |

### Banking

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /banking/accounts | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /banking/sync | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Chat

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /chat/conversations | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /chat/conversations | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /chat/messages | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /chat/messages | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Contacts

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /contacts | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /contacts | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /contacts/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| PATCH /contacts/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| DELETE /contacts/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Documents

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /documents | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /documents/upload | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /documents/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| DELETE /documents/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /documents/1/process | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Employees

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /employees | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /employees | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /employees/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| PATCH /employees/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| DELETE /employees/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Health

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /health | ✓ EXISTS | 200 | Success |
| GET /health/ready | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /health/live | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Invoices

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /invoices | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /invoices | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /invoices/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| PATCH /invoices/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Onboarding

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /onboarding/status | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| POST /onboarding/complete | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| PATCH /onboarding/step | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Organizations

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /organizations | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /organizations | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /organizations/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| PATCH /organizations/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Payroll

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /payroll | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /payroll | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /payroll/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /payroll/1/process | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /payroll/runs | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Settings

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /settings | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| PATCH /settings | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /settings/preferences | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### System

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /metrics | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /version | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /status | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Tax

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /tax/elster/status | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /tax/elster/connect | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /tax/elster/ustva | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /tax/elster/submissions | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /tax/returns | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /tax/returns | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Transactions

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /transactions | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /transactions/1 | ✗ NOT_FOUND | 404 | Endpoint does not exist |

### Users

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| GET /users | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| GET /users/me | 🔒 UNAUTHORIZED | 401 | Requires authentication |
| PATCH /users/me | 🔒 UNAUTHORIZED | 401 | Requires authentication |

### Webhooks

| Endpoint | Status | Code | Message |
|----------|--------|------|----------|
| POST /webhooks/stripe | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /webhooks/plaid | ✗ NOT_FOUND | 404 | Endpoint does not exist |
| POST /webhooks/tink | ✗ NOT_FOUND | 404 | Endpoint does not exist |

