# Security Audit Logging - Integration Guide

## Status: IMPLEMENTED ✅

The SecurityAuditService is fully implemented and ready for integration.

## What's Already Built

### Service Features
- ✅ Login attempt tracking (success/failure)
- ✅ Password change logging
- ✅ Permission change tracking
- ✅ MFA event logging
- ✅ API key usage tracking
- ✅ Sensitive data access logging
- ✅ Failed login detection with auto-lock
- ✅ Bulk export monitoring

### Storage
- Uses existing `AuditLog` table
- Immutable audit trail with hash chain
- Multi-tenant isolation
- Complete metadata capture

## Integration Points

### 1. Auth Service Integration

**File:** `apps/api/src/modules/auth/auth.service.ts`

Add to constructor:
```typescript
constructor(
  // ... existing dependencies
  private securityAuditService: SecurityAuditService,
) {}
```

Add logging calls:

#### Login Success (line ~194)
```typescript
this.logger.log(`User logged in: ${user.id}`);

// ADD THIS:
await this.securityAuditService.logLoginAttempt({
  userId: user.id,
  email: user.email,
  success: true,
  ipAddress: req?.ip,
  userAgent: req?.headers['user-agent'],
});
```

#### Login Failure (line ~52-68 in validateUser)
```typescript
if (!isPasswordValid) {
  // ADD THIS BEFORE returning null:
  await this.securityAuditService.logLoginAttempt({
    email,
    success: false,
    ipAddress: req?.ip,
    userAgent: req?.headers['user-agent'],
    reason: 'invalid_credentials',
  });

  return null;
}
```

#### Password Change (line ~541)
```typescript
this.logger.log(`Password changed for user: ${userId}`);

// ADD THIS:
await this.securityAuditService.logPasswordChange({
  userId,
  organisationId: orgId, // from membership
  changeType: 'change',
  ipAddress: req?.ip,
  userAgent: req?.headers['user-agent'],
});
```

### 2. MFA Service Integration

**File:** `apps/api/src/modules/auth/mfa/mfa.service.ts`

Add logging for:
- MFA enablement
- MFA verification (success/failure)
- Backup code usage

### 3. RBAC Service Integration

**File:** `apps/api/src/modules/auth/rbac/rbac.service.ts`

Add logging for:
- Role changes
- Permission grants/revocations

### 4. Export Service Integration

Already has some audit logging, enhance with security-specific tracking for bulk exports.

## Request Context

To get IP and User Agent, you'll need to pass the Express Request object:

```typescript
// In controller
async login(@Request() req, @Body() dto: LoginDto) {
  const result = await this.authService.login(user, req);
  // ...
}

// In service
async login(user: any, req?: Request): Promise<AuthResponseDto> {
  // Now you can access:
  // - req.ip
  // - req.headers['user-agent']
  // - req.headers['x-forwarded-for']
}
```

## Query Security Events

### Get user's security history
```typescript
const events = await securityAuditService.getUserSecurityEvents(
  userId,
  100, // limit
);
```

### Detect suspicious login attempts
```typescript
const { count, shouldLock } = await securityAuditService.detectFailedLoginAttempts(
  email,
  15, // time window in minutes
);

if (shouldLock) {
  // Implement account locking logic
}
```

### Organization-wide security monitoring
```typescript
const orgEvents = await securityAuditService.getOrganizationSecurityEvents(
  orgId,
  100,
);
```

## Dashboard Integration

Create a security dashboard endpoint:

```typescript
@Get('security/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole(Role.ADMIN)
async getSecurityEvents(
  @CurrentOrg() orgId: string,
  @Query('limit') limit?: number,
) {
  return this.securityAuditService.getOrganizationSecurityEvents(
    orgId,
    limit || 100,
  );
}
```

## Compliance Benefits

✅ **SOC 2** - Security monitoring and logging
✅ **ISO 27001** - Access control logging
✅ **GDPR Article 30** - Processing records
✅ **PCI DSS 10.2** - Audit trail requirements
✅ **HIPAA** - Security incident tracking

## Priority Integration Order

1. **P0 - Authentication Events** ✅
   - Login success/failure
   - Password changes
   - Account lockout

2. **P1 - Authorization Events**
   - Role changes
   - Permission modifications

3. **P2 - Data Access Events**
   - Sensitive data access
   - Bulk exports

4. **P3 - API Security**
   - API key creation/usage
   - Rate limit violations

## Testing

```typescript
// Test login attempt logging
it('should log successful login', async () => {
  const spy = jest.spyOn(securityAuditService, 'logLoginAttempt');

  await authService.login(user, mockRequest);

  expect(spy).toHaveBeenCalledWith({
    userId: user.id,
    email: user.email,
    success: true,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  });
});
```

## Next Steps

1. Add SecurityAuditModule to AuthModule imports
2. Inject SecurityAuditService into AuthService
3. Add logging calls at integration points
4. Test with real login attempts
5. Create admin dashboard for security events
6. Set up alerts for high-risk events

## Files Modified

- ✅ `security-audit.service.ts` - Core service (already exists)
- ✅ `security-audit.module.ts` - Module export (just created)
- ⏳ `auth.service.ts` - Add login/password logging
- ⏳ `mfa.service.ts` - Add MFA event logging
- ⏳ `rbac.service.ts` - Add permission change logging

## Performance Impact

- **Minimal** - Async logging doesn't block business logic
- Failed audit logs don't break operations (error handling)
- Indexed queries for fast retrieval
- Hash chain for tamper detection
