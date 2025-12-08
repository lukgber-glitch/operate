# SEC-008: Rate Limiting Implementation Guide

## Overview

This guide shows how to apply rate limiting to different types of endpoints using the `@RateLimit()` decorator.

## Quick Reference

### Predefined Profiles

| Profile | Limit | Time Window | Use Case |
|---------|-------|-------------|----------|
| `AUTH` | 5 | 1 minute | Login, register, password reset |
| `API` | 100 | 1 minute | Standard CRUD operations |
| `UPLOAD` | 10 | 1 minute | File uploads |
| `AI` | 20 | 1 minute | AI/chat operations |
| `PUBLIC` | 1000 | 15 minutes | Health checks, public endpoints |
| `SEARCH` | 30 | 1 minute | Search operations |

## Examples

### 1. Authentication Endpoints (Already Applied)

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  // Already uses @Throttle decorator, which is equivalent to:
  @RateLimit(RateLimitProfile.AUTH)
  @Post('login')
  async login() { ... }

  @RateLimit(RateLimitProfile.AUTH)
  @Post('register')
  async register() { ... }
}
```

### 2. AI/Chat Endpoints

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

@Controller('chatbot')
export class ChatController {
  // Apply AI rate limiting (20 req/min)
  @RateLimit(RateLimitProfile.AI)
  @Post('conversations/:id/messages')
  async sendMessage() { ... }

  @RateLimit(RateLimitProfile.AI)
  @Post('quick-ask')
  async quickAsk() { ... }
}
```

### 3. File Upload Endpoints

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

@Controller('documents')
export class DocumentsController {
  // Apply upload rate limiting (10 req/min)
  @RateLimit(RateLimitProfile.UPLOAD)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument() { ... }

  // Standard API rate limit for non-upload operations
  @RateLimit(RateLimitProfile.API)
  @Get()
  async listDocuments() { ... }
}
```

### 4. Search Endpoints

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

@Controller('search')
export class SearchController {
  @RateLimit(RateLimitProfile.SEARCH)
  @Get()
  async search() { ... }
}
```

### 5. Standard API Endpoints

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

@Controller('invoices')
export class InvoicesController {
  // Apply standard API rate limiting (100 req/min)
  @RateLimit(RateLimitProfile.API)
  @Get()
  async findAll() { ... }

  @RateLimit(RateLimitProfile.API)
  @Post()
  async create() { ... }
}
```

### 6. Custom Rate Limits

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

@Controller('reports')
export class ReportsController {
  // Custom limit: 5 requests per minute
  @RateLimit(RateLimitProfile.API, { limit: 5 })
  @Post('generate')
  async generateReport() { ... }
}
```

### 7. Skip Rate Limiting (Use Sparingly)

```typescript
import { SkipRateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('health')
export class HealthController {
  @SkipRateLimit()
  @Get()
  async check() { ... }
}
```

### 8. Controller-Level Rate Limiting

```typescript
import { RateLimit, RateLimitProfile } from '../../common/decorators/rate-limit.decorator';

// Apply to entire controller
@RateLimit(RateLimitProfile.API)
@Controller('users')
export class UsersController {
  // All endpoints inherit API rate limit (100 req/min)
  @Get()
  async findAll() { ... }

  // Override at method level for stricter limit
  @RateLimit(RateLimitProfile.AUTH)
  @Post('impersonate')
  async impersonate() { ... }
}
```

## Implementation Checklist

Apply rate limiting to the following endpoint types:

### High Priority (Strict Limits)
- [x] Auth endpoints (login, register) - Already using @Throttle
- [ ] AI/Chat endpoints - Apply `RateLimitProfile.AI`
- [ ] File uploads - Apply `RateLimitProfile.UPLOAD`
- [ ] Password reset/MFA - Apply `RateLimitProfile.AUTH`

### Medium Priority (Moderate Limits)
- [ ] Search endpoints - Apply `RateLimitProfile.SEARCH`
- [ ] Report generation - Apply custom limit or `RateLimitProfile.API`
- [ ] Bulk operations - Apply custom limit (e.g., 5/min)
- [ ] Export operations - Apply custom limit (e.g., 10/min)

### Standard API Endpoints
- [ ] CRUD operations - Apply `RateLimitProfile.API`
- [ ] List/query endpoints - Apply `RateLimitProfile.API`

### Skip Rate Limiting (Carefully)
- [ ] Health check endpoints
- [ ] Webhooks (external systems)
- [ ] Internal admin endpoints (with other auth)

## Testing Rate Limits

```bash
# Test rate limit by making rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' &
done

# Expected: First 5 succeed, next 5 fail with 429 Too Many Requests
```

## Configuration

Rate limits are configured in:
- `apps/api/src/common/decorators/rate-limit.decorator.ts` - Profile definitions
- `apps/api/src/app.module.ts` - Global ThrottlerModule settings

To adjust limits globally, modify `app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,     // 1 second
    limit: 10,      // 10 requests per second
  },
  {
    name: 'medium',
    ttl: 60000,    // 1 minute
    limit: 100,     // 100 requests per minute
  },
  {
    name: 'long',
    ttl: 900000,   // 15 minutes
    limit: 1000,    // 1000 requests per 15 minutes
  },
]),
```

## Best Practices

1. **Authentication endpoints**: Always use strict limits (5/min)
2. **Expensive operations** (AI, reports, uploads): Use moderate limits (10-20/min)
3. **Standard CRUD**: Use generous limits (100/min)
4. **Public endpoints**: Use very generous limits (1000/15min) or skip
5. **Never skip** rate limiting for user-facing endpoints
6. **Test** rate limits in development to avoid false positives
7. **Monitor** rate limit hits in production to adjust as needed
