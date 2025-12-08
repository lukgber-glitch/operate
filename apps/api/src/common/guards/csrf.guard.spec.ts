import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { Request } from 'express';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CsrfGuard(reflector);
  });

  const createMockContext = (
    method: string,
    path: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {},
    isPublic = false,
  ): ExecutionContext => {
    const request = {
      method,
      path,
      cookies,
      headers,
    } as Request;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    // Mock Reflector
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
    jest.spyOn(reflector, 'get').mockReturnValue(false);

    return context;
  };

  describe('Safe methods (GET, HEAD, OPTIONS)', () => {
    it('should allow GET requests without CSRF token', async () => {
      const context = createMockContext('GET', '/api/test');
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow HEAD requests without CSRF token', async () => {
      const context = createMockContext('HEAD', '/api/test');
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      const context = createMockContext('OPTIONS', '/api/test');
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Public routes', () => {
    it('should allow POST to public routes without CSRF token', async () => {
      const context = createMockContext('POST', '/api/auth/login', {}, {}, true);
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow POST to webhook routes without CSRF token', async () => {
      const context = createMockContext(
        'POST',
        '/api/integrations/stripe/webhook',
        {},
        {},
        true,
      );
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('State-changing methods (POST, PUT, PATCH, DELETE)', () => {
    const validToken = 'a'.repeat(64); // 64-char hex string

    it('should reject POST without CSRF token', async () => {
      const context = createMockContext('POST', '/api/test');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'CSRF token validation failed. Missing CSRF token.',
      );
    });

    it('should reject POST with cookie but no header', async () => {
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': validToken },
        {},
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should reject POST with header but no cookie', async () => {
      const context = createMockContext(
        'POST',
        '/api/test',
        {},
        { 'x-xsrf-token': validToken },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should reject POST with mismatched tokens', async () => {
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': validToken },
        { 'x-xsrf-token': 'b'.repeat(64) },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'CSRF token validation failed. Token mismatch.',
      );
    });

    it('should reject POST with invalid token format', async () => {
      const invalidToken = 'invalid-token';
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': invalidToken },
        { 'x-xsrf-token': invalidToken },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'CSRF token validation failed. Invalid token format.',
      );
    });

    it('should allow POST with matching valid tokens', async () => {
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': validToken },
        { 'x-xsrf-token': validToken },
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow PUT with matching valid tokens', async () => {
      const context = createMockContext(
        'PUT',
        '/api/test',
        { 'XSRF-TOKEN': validToken },
        { 'x-xsrf-token': validToken },
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow PATCH with matching valid tokens', async () => {
      const context = createMockContext(
        'PATCH',
        '/api/test',
        { 'XSRF-TOKEN': validToken },
        { 'x-xsrf-token': validToken },
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow DELETE with matching valid tokens', async () => {
      const context = createMockContext(
        'DELETE',
        '/api/test',
        { 'XSRF-TOKEN': validToken },
        { 'x-xsrf-token': validToken },
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Token validation', () => {
    it('should validate token format correctly', () => {
      // Valid 64-char hex strings
      expect(() => {
        const context = createMockContext(
          'POST',
          '/api/test',
          { 'XSRF-TOKEN': 'a'.repeat(64) },
          { 'x-xsrf-token': 'a'.repeat(64) },
        );
        return guard.canActivate(context);
      }).not.toThrow();
    });

    it('should reject short tokens', async () => {
      const shortToken = 'a'.repeat(32); // Too short
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': shortToken },
        { 'x-xsrf-token': shortToken },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should reject long tokens', async () => {
      const longToken = 'a'.repeat(128); // Too long
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': longToken },
        { 'x-xsrf-token': longToken },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should reject tokens with invalid characters', async () => {
      const invalidToken = 'g'.repeat(64); // 'g' is not a valid hex character
      const context = createMockContext(
        'POST',
        '/api/test',
        { 'XSRF-TOKEN': invalidToken },
        { 'x-xsrf-token': invalidToken },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});
